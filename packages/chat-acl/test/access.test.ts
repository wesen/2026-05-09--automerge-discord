import { describe, expect, it } from 'vitest'
import { ForbiddenError, InMemoryAccessControlAdapter } from '../src/index.js'

describe('InMemoryAccessControlAdapter', () => {
  it('allows admin for created workspace documents and denies missing grants', async () => {
    const acl = new InMemoryAccessControlAdapter('server-admin')
    const workspace = await acl.createWorkspace('Intern Guild')

    await expect(acl.assertCanAdmin(workspace.workspaceDocumentId)).resolves.toBeUndefined()
    await expect(acl.assertCanComment('ch_missing')).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('accepts nested contact cards and supports invite/revoke grants', async () => {
    const acl = new InMemoryAccessControlAdapter('server-admin')
    const workspace = await acl.createWorkspace('Intern Guild')
    const agent = await acl.receiveContactCard({ agent: { id: 'mem_peer', kind: 'individual' } })
    const target = { id: workspace.workspaceDocumentId, kind: 'document' as const }

    expect(agent).toEqual({ id: 'mem_peer', kind: 'individual' })
    await acl.invite(agent, target, 'read')
    await acl.revoke(agent, target)
  })
})
