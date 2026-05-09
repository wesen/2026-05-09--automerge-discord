import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
    } finally {
      chat.runtime.wss.close()
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
      await rm(dataDir, { recursive: true, force: true })
    }
  })
})
