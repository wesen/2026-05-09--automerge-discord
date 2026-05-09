import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Repo, type PeerId } from '@automerge/automerge-repo'
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import {
  addMember,
  createChannel,
  newId,
  sendMessage,
  type ChannelId,
  type MemberId,
  type WorkspaceDoc,
} from '@autodisco/chat-core'
import { afterEach, describe, expect, it } from 'vitest'
import { createChatServer, type ChatServer } from '../src/app.js'
import type { ServerConfig } from '../src/config.js'

interface StartedServer {
  chat: ChatServer
  server: Awaited<ReturnType<ChatServer['listen']>>
  dataDir: string
  baseUrl: string
  syncUrl: string
}

const runningServers: StartedServer[] = []
const runningRepos: Repo[] = []

describe('Automerge relay sync', () => {
  afterEach(async () => {
    await Promise.allSettled(runningRepos.splice(0).map((repo) => repo.shutdown()))
    await Promise.allSettled(runningServers.splice(0).map(async ({ chat, server, dataDir }) => {
      chat.runtime.wss.close()
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
      await rm(dataDir, { recursive: true, force: true })
    }))
  })

  it('syncs concurrent workspace edits across two independent repo clients', async () => {
    const started = await startServer()
    const bootstrap = await bootstrapWorkspace(started.baseUrl, 'Distributed Guild')
    expect(bootstrap.workspaceDocUrl).toMatch(/^automerge:/)
    expect(bootstrap.syncUrl).toBe(started.syncUrl)

    const aliceRepo = createClientRepo('alice', started.syncUrl)
    const bobRepo = createClientRepo('bob', started.syncUrl)

    const aliceHandle = await aliceRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
    const channelId = newId('ch') as ChannelId
    const aliceId = newId('mem') as MemberId
    const bobId = newId('mem') as MemberId

    aliceHandle.change((doc) => {
      addMember(doc, { id: aliceId, displayName: 'Alice', joinedAt: '2026-05-09T17:00:00Z' })
      addMember(doc, { id: bobId, displayName: 'Bob', joinedAt: '2026-05-09T17:00:01Z' })
      createChannel(doc, {
        id: channelId,
        name: 'general',
        kind: 'text',
        categoryId: null,
        createdBy: aliceId,
        createdAt: '2026-05-09T17:00:02Z',
      })
    })

    const bobHandle = await bobRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
    await waitForDoc(bobHandle, (doc) => Boolean(doc.channels[channelId] && doc.members[aliceId] && doc.members[bobId]))

    aliceHandle.change((doc) => {
      sendMessage(doc, {
        id: newId('msg'),
        channelId,
        authorId: aliceId,
        body: 'hello from alice',
        createdAt: '2026-05-09T17:01:00Z',
      })
    })
    bobHandle.change((doc) => {
      sendMessage(doc, {
        id: newId('msg'),
        channelId,
        authorId: bobId,
        body: 'hello from bob',
        createdAt: '2026-05-09T17:01:01Z',
      })
    })

    const expectedBodies = ['hello from alice', 'hello from bob']
    await waitForMessages(aliceHandle, channelId, expectedBodies)
    await waitForMessages(bobHandle, channelId, expectedBodies)
  }, 20_000)
})

async function startServer(): Promise<StartedServer> {
  const dataDir = await mkdtemp(join(tmpdir(), 'autodisco-sync-test-'))
  const config: ServerConfig = {
    host: '127.0.0.1',
    port: 0,
    dataDir,
    publicBaseUrl: 'http://127.0.0.1:0',
    syncPath: '/sync',
  }
  const chat = createChatServer(config)
  const server = await chat.listen()
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('expected TCP listener')
  const baseUrl = `http://127.0.0.1:${address.port}`
  config.publicBaseUrl = baseUrl
  const syncUrl = `ws://127.0.0.1:${address.port}/sync`
  const started = { chat, server, dataDir, baseUrl, syncUrl }
  runningServers.push(started)
  return started
}

function createClientRepo(name: string, syncUrl: string): Repo {
  const repo = new Repo({
    network: [new WebSocketClientAdapter(syncUrl, 100)],
    peerId: `test-${name}-${crypto.randomUUID()}` as PeerId,
  })
  runningRepos.push(repo)
  return repo
}

async function bootstrapWorkspace(baseUrl: string, name: string): Promise<{ workspaceDocUrl: string; syncUrl: string }> {
  const response = await fetch(`${baseUrl}/api/bootstrap/workspaces`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) throw new Error(`bootstrap failed: ${response.status} ${await response.text()}`)
  return (await response.json()) as { workspaceDocUrl: string; syncUrl: string }
}

async function waitForMessages(handle: { doc(): WorkspaceDoc; on: (event: 'change', listener: () => void) => void; off: (event: 'change', listener: () => void) => void }, channelId: ChannelId, bodies: string[]): Promise<void> {
  await waitForDoc(handle, (doc) => {
    const actual = (doc.messagesByChannel[channelId] ?? []).map((message) => message.body).sort()
    return bodies.every((body) => actual.includes(body))
  })
}

function waitForDoc(handle: { doc(): WorkspaceDoc; on: (event: 'change', listener: () => void) => void; off: (event: 'change', listener: () => void) => void }, predicate: (doc: WorkspaceDoc) => boolean, timeoutMs = 5_000): Promise<void> {
  if (predicate(handle.doc())) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`timed out waiting for document predicate after ${timeoutMs}ms`))
    }, timeoutMs)
    const onChange = () => {
      if (!predicate(handle.doc())) return
      cleanup()
      resolve()
    }
    const cleanup = () => {
      clearTimeout(timeout)
      handle.off('change', onChange)
    }
    handle.on('change', onChange)
  })
}
