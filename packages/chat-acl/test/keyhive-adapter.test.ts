import { describe, expect, it } from 'vitest'
import { ForbiddenError, KeyhiveAccessControlAdapter } from '../src/index.js'

describe('KeyhiveAccessControlAdapter experimental mode', () => {
  it('creates real Keyhive workspace refs and exports archive bytes', async () => {
    const acl = new KeyhiveAccessControlAdapter()
    const workspace = await acl.createWorkspace('Intern Guild')
    const archive = await acl.exportArchiveBytes()

    expect(acl.localMemberId()).toMatch(/^keyhive:/)
    expect(acl.localPublicKey()).toBeInstanceOf(Uint8Array)
    expect(workspace.workspaceGroupId).toMatch(/^0x/)
    expect(workspace.workspaceDocumentId).toMatch(/^0x/)
    await expect(acl.assertCanAdmin(workspace.workspaceDocumentId)).resolves.toBeUndefined()
    expect(archive.length).toBeGreaterThan(0)
  })

  it('receives real contact cards and delegates/revokes document membership', async () => {
    const owner = new KeyhiveAccessControlAdapter()
    const peer = new KeyhiveAccessControlAdapter()
    const workspace = await owner.createWorkspace('Intern Guild')
    const contactCard = await peer.exportOwnContactCardJson()
    const agent = await owner.receiveContactCard(contactCard)

    expect(agent.id).toMatch(/^keyhive:/)
    await expect(owner.invite(agent, { id: workspace.workspaceDocumentId, kind: 'document' }, 'read')).resolves.toBeUndefined()
    await expect(owner.exportMembershipEventsFor(agent)).resolves.toBeInstanceOf(Array)
    await expect(owner.revoke(agent, { id: workspace.workspaceDocumentId, kind: 'document' })).resolves.toBeUndefined()
  })

  it('restores signing identity, archive state, known documents, and admin targets from a snapshot', async () => {
    const first = new KeyhiveAccessControlAdapter()
    const workspace = await first.createWorkspace('Durable Guild')
    const firstMemberId = first.localMemberId()
    const firstPublicKey = Array.from(first.localPublicKey())
    const snapshot = await first.exportSnapshot()

    const restored = new KeyhiveAccessControlAdapter({ snapshot })
    expect(restored.localMemberId()).toBe(firstMemberId)
    expect(Array.from(restored.localPublicKey())).toEqual(firstPublicKey)
    await expect(restored.assertCanAdmin(workspace.workspaceDocumentId)).resolves.toBeUndefined()

    const encrypted = await restored.encryptContentForDocument(
      workspace.workspaceDocumentId,
      new Uint8Array([21, 22, 23]),
      [new Uint8Array([18, 19, 20])],
      new TextEncoder().encode('hello after restore'),
    )
    const plaintext = await restored.decryptContentForDocument(workspace.workspaceDocumentId, encrypted)
    expect(new TextDecoder().decode(plaintext)).toBe('hello after restore')
  })

  it('persists snapshots through the onSnapshot callback after mutations', async () => {
    let latestSnapshot: Awaited<ReturnType<KeyhiveAccessControlAdapter['exportSnapshot']>> | undefined
    const acl = new KeyhiveAccessControlAdapter({ onSnapshot: (snapshot) => (latestSnapshot = snapshot) })
    const workspace = await acl.createWorkspace('Callback Guild')

    expect(latestSnapshot?.signingKeyBytes).toHaveLength(32)
    expect(latestSnapshot?.archiveBytes?.length).toBeGreaterThan(0)
    expect(latestSnapshot?.documentIds).toContain(workspace.workspaceDocumentId)
    expect(latestSnapshot?.adminTargets).toContain(workspace.workspaceDocumentId)
  })

  it('encrypts and decrypts document content through the experimental adapter', async () => {
    const acl = new KeyhiveAccessControlAdapter()
    const workspace = await acl.createWorkspace('Encrypted Guild')
    const encrypted = await acl.encryptContentForDocument(
      workspace.workspaceDocumentId,
      new Uint8Array([13, 14, 15]),
      [new Uint8Array([10, 11, 12])],
      new TextEncoder().encode('hello from adapter'),
    )
    const plaintext = await acl.decryptContentForDocument(workspace.workspaceDocumentId, encrypted)
    expect(new TextDecoder().decode(plaintext)).toBe('hello from adapter')
  })

  it('denies admin checks for unknown targets', async () => {
    const acl = new KeyhiveAccessControlAdapter()
    await expect(acl.assertCanAdmin('doc:unknown')).rejects.toBeInstanceOf(ForbiddenError)
  })
})
