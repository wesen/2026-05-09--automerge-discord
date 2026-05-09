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

export interface AccessControlConfig {
  mode: 'mock' | 'keyhive-experimental'
  localMemberId?: string
  publicKey?: Uint8Array
}

export function createAccessControlAdapter(config: AccessControlConfig = { mode: 'mock' }): AccessControlAdapter {
  if (config.mode === 'mock') {
    return new InMemoryAccessControlAdapter(config.localMemberId ?? 'server-admin', config.publicKey ? new Uint8Array(config.publicKey) : undefined)
  }
  throw new Error('keyhive-experimental ACL mode is not implemented yet')
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
