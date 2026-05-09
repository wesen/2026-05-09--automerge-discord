import * as KeyhiveWasm from '@keyhive/keyhive'

export type ChatAccess = 'pull' | 'read' | 'comment' | 'edit' | 'admin'

export interface AgentRef {
  id: string
  kind: 'individual' | 'group' | 'bot'
}

export interface MemberedRef {
  id: string
  kind: 'workspace' | 'channel' | 'document' | 'group'
}

export interface WorkspaceAccessBundle {
  workspaceGroupId: string
  workspaceDocumentId: string
}

export interface ChannelAccessBundle {
  channelId: string
  channelDocumentId: string
}

export interface AccessControlAdapter {
  localMemberId(): string
  localPublicKey(): Uint8Array
  createWorkspace(name: string): Promise<WorkspaceAccessBundle>
  createChannel(workspace: WorkspaceAccessBundle, channelId: string, visibility: 'workspace' | 'private'): Promise<ChannelAccessBundle>
  receiveContactCard(cardJson: unknown): Promise<AgentRef>
  invite(agent: AgentRef, target: MemberedRef, access: ChatAccess): Promise<void>
  revoke(agent: AgentRef, target: MemberedRef): Promise<void>
  assertCanRead(docOrChannel: string): Promise<void>
  assertCanComment(channelId: string): Promise<void>
  assertCanAdmin(target: string): Promise<void>
  exportMembershipEventsFor(agent: AgentRef): Promise<Uint8Array[]>
  ingestMembershipEvents(events: Uint8Array[]): Promise<Uint8Array[]>
}

export interface KeyhiveAccessControlSnapshot {
  signingKeyBytes: number[]
  archiveBytes?: number[]
  prekeySecretBytes?: number[]
  documentIds: string[]
  agentIds: string[]
  adminTargets: string[]
}

export interface KeyhiveAccessControlAdapterOptions {
  snapshot?: KeyhiveAccessControlSnapshot
  onSnapshot?: (snapshot: KeyhiveAccessControlSnapshot) => void | Promise<void>
}

export interface AccessControlConfig {
  mode: 'mock' | 'keyhive-experimental'
  localMemberId?: string
  publicKey?: Uint8Array
  keyhive?: KeyhiveAccessControlAdapterOptions
}

export function createAccessControlAdapter(config: AccessControlConfig = { mode: 'mock' }): AccessControlAdapter {
  if (config.mode === 'mock') {
    return new InMemoryAccessControlAdapter(config.localMemberId ?? 'server-admin', config.publicKey ? new Uint8Array(config.publicKey) : undefined)
  }
  return new KeyhiveAccessControlAdapter(config.keyhive)
}

export class ForbiddenError extends Error {
  constructor(message = 'forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class InMemoryAccessControlAdapter implements AccessControlAdapter {
  readonly #memberId: string
  readonly #publicKey: Uint8Array
  readonly #grants = new Map<string, Set<ChatAccess>>()

  constructor(memberId: string, publicKey = new Uint8Array([1, 2, 3])) {
    this.#memberId = memberId
    this.#publicKey = publicKey
  }

  localMemberId(): string {
    return this.#memberId
  }

  localPublicKey(): Uint8Array {
    return this.#publicKey
  }

  async createWorkspace(name: string): Promise<WorkspaceAccessBundle> {
    const bundle = {
      workspaceGroupId: `group:${name}`,
      workspaceDocumentId: `doc:${name}`,
    }
    this.grant(bundle.workspaceDocumentId, 'admin')
    return bundle
  }

  async createChannel(_workspace: WorkspaceAccessBundle, channelId: string): Promise<ChannelAccessBundle> {
    const bundle = {
      channelId,
      channelDocumentId: `doc:channel:${channelId}`,
    }
    this.grant(channelId, 'admin')
    this.grant(bundle.channelDocumentId, 'admin')
    return bundle
  }

  async receiveContactCard(cardJson: unknown): Promise<AgentRef> {
    if (typeof cardJson === 'object' && cardJson && 'agent' in cardJson) {
      const agent = (cardJson as { agent?: { id?: unknown; kind?: unknown } }).agent
      if (agent?.id && (agent.kind === 'individual' || agent.kind === 'group' || agent.kind === 'bot')) {
        return { id: String(agent.id), kind: agent.kind }
      }
    }
    const id = typeof cardJson === 'object' && cardJson && 'id' in cardJson ? String(cardJson.id) : `agent:${Date.now()}`
    return { id, kind: 'individual' }
  }

  async invite(agent: AgentRef, target: MemberedRef, access: ChatAccess): Promise<void> {
    this.grant(`${target.id}:${agent.id}`, access)
  }

  async revoke(agent: AgentRef, target: MemberedRef): Promise<void> {
    this.#grants.delete(`${target.id}:${agent.id}`)
  }

  async assertCanRead(docOrChannel: string): Promise<void> {
    this.assertHas(docOrChannel, ['read', 'comment', 'edit', 'admin'])
  }

  async assertCanComment(channelId: string): Promise<void> {
    this.assertHas(channelId, ['comment', 'edit', 'admin'])
  }

  async assertCanAdmin(target: string): Promise<void> {
    this.assertHas(target, ['admin'])
  }

  async exportMembershipEventsFor(_agent: AgentRef): Promise<Uint8Array[]> {
    return []
  }

  async ingestMembershipEvents(_events: Uint8Array[]): Promise<Uint8Array[]> {
    return []
  }

  grant(resource: string, access: ChatAccess): void {
    const grants = this.#grants.get(resource) ?? new Set<ChatAccess>()
    grants.add(access)
    this.#grants.set(resource, grants)
  }

  private assertHas(resource: string, acceptable: ChatAccess[]): void {
    const grants = this.#grants.get(resource)
    if (!grants || !acceptable.some((access) => grants.has(access))) {
      throw new ForbiddenError(`missing ${acceptable.join('/')} access for ${resource}`)
    }
  }
}

export class KeyhiveAccessControlAdapter implements AccessControlAdapter {
  readonly #signingKeyBytes: Uint8Array
  readonly #signer: KeyhiveWasm.Signer
  readonly #ciphertextStore = KeyhiveWasm.CiphertextStore.newInMemory()
  readonly #events: Uint8Array[] = []
  readonly #memberId: string
  readonly #onSnapshot?: (snapshot: KeyhiveAccessControlSnapshot) => void | Promise<void>
  #archiveBytes?: Uint8Array
  #snapshotPrekeySecretBytes?: Uint8Array
  #keyhive?: Promise<KeyhiveWasm.Keyhive>
  readonly #documents = new Map<string, KeyhiveWasm.Document>()
  readonly #groups = new Map<string, KeyhiveWasm.Group>()
  readonly #agents = new Map<string, KeyhiveWasm.Agent>()
  readonly #knownDocumentIds = new Set<string>()
  readonly #knownAgentIds = new Set<string>()
  readonly #adminTargets = new Set<string>()

  constructor(options: KeyhiveAccessControlAdapterOptions = {}) {
    this.#signingKeyBytes = options.snapshot ? Uint8Array.from(options.snapshot.signingKeyBytes) : randomBytes(32)
    this.#signer = KeyhiveWasm.Signer.memorySignerFromBytes(this.#signingKeyBytes)
    this.#memberId = `keyhive:${bytesToHex(this.#signer.verifyingKey)}`
    this.#onSnapshot = options.onSnapshot
    this.#archiveBytes = options.snapshot?.archiveBytes ? Uint8Array.from(options.snapshot.archiveBytes) : undefined
    this.#snapshotPrekeySecretBytes = options.snapshot?.prekeySecretBytes ? Uint8Array.from(options.snapshot.prekeySecretBytes) : undefined
    for (const documentId of options.snapshot?.documentIds ?? []) this.#knownDocumentIds.add(documentId)
    for (const agentId of options.snapshot?.agentIds ?? []) this.#knownAgentIds.add(agentId)
    for (const target of options.snapshot?.adminTargets ?? []) this.#adminTargets.add(target)
  }

  localMemberId(): string {
    return this.#memberId
  }

  localPublicKey(): Uint8Array {
    return new Uint8Array(this.#signer.verifyingKey)
  }

  async createWorkspace(_name: string): Promise<WorkspaceAccessBundle> {
    const keyhive = await this.keyhive()
    const group = await keyhive.generateGroup([])
    const doc = await keyhive.generateDocument([group.toPeer()], randomChangeId(), [])
    const workspaceGroupId = group.groupId.toString()
    const workspaceDocumentId = doc.doc_id.toString()
    this.#groups.set(workspaceGroupId, group)
    this.#documents.set(workspaceDocumentId, doc)
    this.#knownDocumentIds.add(workspaceDocumentId)
    this.#adminTargets.add(workspaceGroupId)
    this.#adminTargets.add(workspaceDocumentId)
    await this.persistSnapshot()
    return { workspaceGroupId, workspaceDocumentId }
  }

  async createChannel(_workspace: WorkspaceAccessBundle, channelId: string): Promise<ChannelAccessBundle> {
    const keyhive = await this.keyhive()
    const doc = await keyhive.generateDocument([], randomChangeId(), [])
    const channelDocumentId = doc.doc_id.toString()
    this.#documents.set(channelDocumentId, doc)
    this.#knownDocumentIds.add(channelDocumentId)
    this.#adminTargets.add(channelDocumentId)
    this.#adminTargets.add(channelId)
    await this.persistSnapshot()
    return { channelId, channelDocumentId }
  }

  async receiveContactCard(cardJson: unknown): Promise<AgentRef> {
    const keyhive = await this.keyhive()
    const json = parseKeyhiveContactCardJson(cardJson)
    const individual = await keyhive.receiveContactCard(KeyhiveWasm.ContactCard.fromJson(json))
    const id = `keyhive:${bytesToHex(individual.individualId.bytes)}`
    this.#agents.set(id, individual.toAgent())
    this.#knownAgentIds.add(id)
    await this.persistSnapshot()
    return { id, kind: 'individual' }
  }

  async invite(agent: AgentRef, target: MemberedRef, access: ChatAccess): Promise<void> {
    const keyhive = await this.keyhive()
    const wasmAgent = this.#agents.get(agent.id)
    const membered = this.memberedFor(target)
    const keyhiveAccess = toKeyhiveAccess(access)
    if (!wasmAgent) throw new ForbiddenError(`unknown Keyhive agent ${agent.id}`)
    await keyhive.addMember(wasmAgent, membered, keyhiveAccess, [])
    await this.persistSnapshot()
  }

  async revoke(agent: AgentRef, target: MemberedRef): Promise<void> {
    const keyhive = await this.keyhive()
    const wasmAgent = this.#agents.get(agent.id)
    const membered = this.memberedFor(target)
    if (!wasmAgent) throw new ForbiddenError(`unknown Keyhive agent ${agent.id}`)
    await keyhive.revokeMember(wasmAgent, true, membered)
    await this.persistSnapshot()
  }

  async assertCanRead(docOrChannel: string): Promise<void> {
    if (!this.#adminTargets.has(docOrChannel) && !this.#documents.has(docOrChannel)) throw new ForbiddenError(`missing read access for ${docOrChannel}`)
  }

  async assertCanComment(channelId: string): Promise<void> {
    if (!this.#adminTargets.has(channelId)) throw new ForbiddenError(`missing comment access for ${channelId}`)
  }

  async assertCanAdmin(target: string): Promise<void> {
    if (!this.#adminTargets.has(target)) throw new ForbiddenError(`missing admin access for ${target}`)
  }

  async exportMembershipEventsFor(agent: AgentRef): Promise<Uint8Array[]> {
    const keyhive = await this.keyhive()
    const wasmAgent = this.#agents.get(agent.id)
    if (!wasmAgent) return []
    const events = await keyhive.eventsForAgent(wasmAgent)
    return Array.from(events.values()).map((value) => new Uint8Array(value as ArrayBuffer | ArrayLike<number>))
  }

  async ingestMembershipEvents(events: Uint8Array[]): Promise<Uint8Array[]> {
    const keyhive = await this.keyhive()
    const ingested = (await keyhive.ingestEventsBytes(events)).map((event) => new Uint8Array(event as ArrayBuffer | ArrayLike<number>))
    await this.persistSnapshot()
    return ingested
  }

  async exportArchiveBytes(): Promise<Uint8Array> {
    return (await (await this.keyhive()).toArchive()).toBytes()
  }

  async exportOwnContactCardJson(): Promise<string> {
    return (await (await this.keyhive()).contactCard()).toJson()
  }

  async exportSnapshot(): Promise<KeyhiveAccessControlSnapshot> {
    const keyhive = await this.keyhive()
    const archiveBytes = await this.exportArchiveBytes()
    const prekeySecretBytes = await keyhive.exportPrekeySecrets()
    return {
      signingKeyBytes: Array.from(this.#signingKeyBytes),
      archiveBytes: Array.from(archiveBytes),
      prekeySecretBytes: Array.from(prekeySecretBytes),
      documentIds: Array.from(this.#knownDocumentIds).sort(),
      agentIds: Array.from(this.#knownAgentIds).sort(),
      adminTargets: Array.from(this.#adminTargets).sort(),
    }
  }

  async encryptContentForDocument(documentId: string, contentRef: Uint8Array, predRefs: Uint8Array[], content: Uint8Array): Promise<KeyhiveWasm.Encrypted> {
    const keyhive = await this.keyhive()
    const doc = this.#documents.get(documentId)
    if (!doc) throw new ForbiddenError(`unknown Keyhive document ${documentId}`)
    const encrypted = await keyhive.tryEncrypt(
      doc,
      new KeyhiveWasm.ChangeId(contentRef),
      predRefs.map((predRef) => new KeyhiveWasm.ChangeId(predRef)),
      content,
    )
    return encrypted.encrypted_content()
  }

  async decryptContentForDocument(documentId: string, encrypted: KeyhiveWasm.Encrypted): Promise<Uint8Array> {
    const keyhive = await this.keyhive()
    const doc = this.#documents.get(documentId)
    if (!doc) throw new ForbiddenError(`unknown Keyhive document ${documentId}`)
    return await keyhive.tryDecrypt(doc, encrypted)
  }

  private keyhive(): Promise<KeyhiveWasm.Keyhive> {
    this.#keyhive ??= this.initKeyhive()
    return this.#keyhive
  }

  private async initKeyhive(): Promise<KeyhiveWasm.Keyhive> {
    const eventHandler = (event: unknown) => {
      if (event && typeof event === 'object' && 'toBytes' in event && typeof event.toBytes === 'function') {
        this.#events.push(new Uint8Array(event.toBytes() as Uint8Array))
      }
    }
    const keyhive = this.#archiveBytes
      ? await new KeyhiveWasm.Archive(this.#archiveBytes).tryToKeyhive(this.#ciphertextStore, this.#signer.clone(), eventHandler)
      : await KeyhiveWasm.Keyhive.init(this.#signer.clone(), this.#ciphertextStore, eventHandler)
    if (this.#snapshotPrekeySecretBytes) await keyhive.importPrekeySecrets(this.#snapshotPrekeySecretBytes)
    await this.hydrateKnownRefs(keyhive)
    return keyhive
  }

  private async hydrateKnownRefs(keyhive: KeyhiveWasm.Keyhive): Promise<void> {
    for (const documentId of this.#knownDocumentIds) {
      const doc = await keyhive.getDocument(new KeyhiveWasm.DocumentId(hexToBytes(documentId)))
      if (doc) this.#documents.set(documentId, doc)
    }
    for (const agentId of this.#knownAgentIds) {
      const agent = await keyhive.getAgent(new KeyhiveWasm.Identifier(hexToBytes(agentId.replace(/^keyhive:/, ''))))
      if (agent) this.#agents.set(agentId, agent)
    }
  }

  private async persistSnapshot(): Promise<void> {
    if (!this.#onSnapshot) return
    await this.#onSnapshot(await this.exportSnapshot())
  }

  private memberedFor(target: MemberedRef): KeyhiveWasm.Membered {
    const doc = this.#documents.get(target.id)
    if (doc) return doc.toMembered()
    const group = this.#groups.get(target.id)
    if (group) return group.toMembered()
    throw new ForbiddenError(`unknown Keyhive target ${target.id}`)
  }
}

function parseKeyhiveContactCardJson(cardJson: unknown): string {
  if (typeof cardJson === 'string') return cardJson
  if (typeof cardJson === 'object' && cardJson && 'keyhiveContactCardJson' in cardJson) {
    const nested = (cardJson as { keyhiveContactCardJson?: unknown }).keyhiveContactCardJson
    if (typeof nested === 'string') return nested
  }
  return JSON.stringify(cardJson)
}

function toKeyhiveAccess(access: ChatAccess): KeyhiveWasm.Access {
  const keyhiveAccess = KeyhiveWasm.Access.tryFromString(access === 'admin' ? 'admin' : access === 'edit' || access === 'comment' ? 'edit' : 'read')
  if (!keyhiveAccess) throw new ForbiddenError(`unsupported Keyhive access ${access}`)
  return keyhiveAccess
}

function randomChangeId(): KeyhiveWasm.ChangeId {
  return new KeyhiveWasm.ChangeId(randomBytes(32))
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.replace(/^keyhive:/, '').replace(/^0x/, '')
  if (normalized.length % 2 !== 0) throw new ForbiddenError(`invalid hex identifier ${hex}`)
  const bytes = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
  return bytes
}
