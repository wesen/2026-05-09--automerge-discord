import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KeyhiveAccessControlAdapter } from '@autodisco/chat-acl'
import type { WorkspaceDoc } from '@autodisco/chat-core'
import { describe, expect, it } from 'vitest'
import { createChatServer } from '../src/app.js'
import type { ServerConfig } from '../src/config.js'

describe('bootstrap HTTP API', () => {
  it('creates a workspace Automerge document and returns sync and ACL metadata', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'autodisco-test-'))
    const config: ServerConfig = {
      host: '127.0.0.1',
      port: 0,
      dataDir,
      publicBaseUrl: 'http://localhost:3030',
      syncPath: '/sync',
      aclMode: 'mock',
    }
    const chat = createChatServer(config)
    const server = await chat.listen()
    try {
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('expected TCP listener')
      const response = await fetch(`http://127.0.0.1:${address.port}/api/bootstrap/workspaces`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Intern Guild' }),
      })
      const body = (await response.json()) as {
        workspaceId: string
        workspaceDocUrl: string
        syncUrl: string
        keyhive: { workspaceGroupId: string; workspaceDocumentId: string }
      }
      expect(response.status).toBe(201)
      expect(body.workspaceId).toMatch(/^wk_/)
      expect(body.workspaceDocUrl).toMatch(/^automerge:/)
      expect(body.syncUrl).toBe('ws://localhost:3030/sync')
      expect(body.keyhive).toEqual({
        workspaceGroupId: 'group:Intern Guild',
        workspaceDocumentId: 'doc:Intern Guild',
      })

      const handle = await chat.runtime.repo.find<WorkspaceDoc>(body.workspaceDocUrl)
      expect(handle.doc().keyhive).toEqual({
        workspaceGroupId: body.keyhive.workspaceGroupId,
        workspaceDocumentId: body.keyhive.workspaceDocumentId,
        channelDocumentIds: {},
      })

      const inviteResponse = await fetch(`http://127.0.0.1:${address.port}/api/bootstrap/invitations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          workspaceDocumentId: body.keyhive.workspaceDocumentId,
          access: 'read',
          contactCard: {
            kind: 'autodisco.contact-card.v1',
            mode: 'mock',
            agent: { id: 'mem_peer', kind: 'individual' },
            publicKey: 'mock-public-key',
          },
        }),
      })
      const inviteBody = (await inviteResponse.json()) as {
        invitationId: string
        mode: string
        agent: { id: string; kind: string }
        target: { id: string; kind: string }
        access: string
      }
      expect(inviteResponse.status).toBe(201)
      expect(inviteBody.invitationId).toMatch(/^inv_/)
      expect(inviteBody.mode).toBe('mock')
      expect(inviteBody.agent).toEqual({ id: 'mem_peer', kind: 'individual' })
      expect(inviteBody.target).toEqual({ id: body.keyhive.workspaceDocumentId, kind: 'document' })
      expect(inviteBody.access).toBe('read')

      const denyResponse = await fetch(`http://127.0.0.1:${address.port}/api/bootstrap/invitations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          workspaceDocumentId: 'doc:unknown',
          access: 'read',
          contactCard: { agent: { id: 'mem_peer', kind: 'individual' } },
        }),
      })
      expect(denyResponse.status).toBe(403)

      const revokeResponse = await fetch(`http://127.0.0.1:${address.port}/api/bootstrap/invitations/revoke`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          workspaceDocumentId: body.keyhive.workspaceDocumentId,
          agent: inviteBody.agent,
        }),
      })
      const revokeBody = (await revokeResponse.json()) as { revoked: boolean; agent: { id: string } }
      expect(revokeResponse.status).toBe(200)
      expect(revokeBody.revoked).toBe(true)
      expect(revokeBody.agent.id).toBe('mem_peer')
    } finally {
      chat.runtime.wss.close()
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
      await rm(dataDir, { recursive: true, force: true })
    }
  })

  it('persists experimental Keyhive ACL snapshots across server restarts', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'autodisco-keyhive-test-'))
    const config: ServerConfig = {
      host: '127.0.0.1',
      port: 0,
      dataDir,
      publicBaseUrl: 'http://localhost:3030',
      syncPath: '/sync',
      aclMode: 'keyhive-experimental',
    }
    let workspaceDocumentId = ''
    try {
      const first = createChatServer(config)
      const firstServer = await first.listen()
      try {
        const address = firstServer.address()
        if (!address || typeof address === 'string') throw new Error('expected TCP listener')
        const response = await fetch(`http://127.0.0.1:${address.port}/api/bootstrap/workspaces`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'Durable Keyhive Guild' }),
        })
        const body = (await response.json()) as { keyhive: { workspaceDocumentId: string } }
        expect(response.status).toBe(201)
        workspaceDocumentId = body.keyhive.workspaceDocumentId
        const snapshot = JSON.parse(await readFile(join(dataDir, 'keyhive-acl-snapshot.json'), 'utf8')) as { documentIds: string[]; archiveBytes: number[] }
        expect(snapshot.documentIds).toContain(workspaceDocumentId)
        expect(snapshot.archiveBytes.length).toBeGreaterThan(0)
      } finally {
        first.runtime.wss.close()
        await new Promise<void>((resolve, reject) => firstServer.close((err) => (err ? reject(err) : resolve())))
      }

      const peer = new KeyhiveAccessControlAdapter()
      const contactCard = await peer.exportOwnContactCardJson()
      const second = createChatServer(config)
      const secondServer = await second.listen()
      try {
        const address = secondServer.address()
        if (!address || typeof address === 'string') throw new Error('expected TCP listener')
        const inviteResponse = await fetch(`http://127.0.0.1:${address.port}/api/bootstrap/invitations`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            workspaceDocumentId,
            access: 'read',
            contactCard: { keyhiveContactCardJson: contactCard },
          }),
        })
        const inviteBody = (await inviteResponse.json()) as { mode: string; target: { id: string } }
        expect(inviteResponse.status).toBe(201)
        expect(inviteBody.mode).toBe('keyhive-experimental')
        expect(inviteBody.target.id).toBe(workspaceDocumentId)
      } finally {
        second.runtime.wss.close()
        await new Promise<void>((resolve, reject) => secondServer.close((err) => (err ? reject(err) : resolve())))
      }
    } finally {
      await rm(dataDir, { recursive: true, force: true })
    }
  })
})
