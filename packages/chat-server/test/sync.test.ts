import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Repo, type DocHandle, type PeerId } from '@automerge/automerge-repo'
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs'
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
    await Promise.allSettled(runningServers.splice(0).map((started) => stopServer(started, { removeDataDir: true })))
  })

  it('syncs concurrent workspace edits across two independent repo clients', async () => {
    const started = await startServer()
    const bootstrap = await bootstrapWorkspace(started.baseUrl, 'Distributed Guild')
    expect(bootstrap.workspaceDocUrl).toMatch(/^automerge:/)
    expect(bootstrap.syncUrl).toBe(started.syncUrl)

    const aliceRepo = createClientRepo('alice', started.syncUrl)
    const bobRepo = createClientRepo('bob', started.syncUrl)

    const aliceHandle = await aliceRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
    const { channelId, aliceId, bobId } = initializeWorkspace(aliceHandle)

    const bobHandle = await bobRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
    await waitForDoc(bobHandle, (doc) => Boolean(doc.channels[channelId] && doc.members[aliceId] && doc.members[bobId]))

    sendChatMessage(aliceHandle, { channelId, authorId: aliceId, body: 'hello from alice', createdAt: '2026-05-09T17:01:00Z' })
    sendChatMessage(bobHandle, { channelId, authorId: bobId, body: 'hello from bob', createdAt: '2026-05-09T17:01:01Z' })

    const expectedBodies = ['hello from alice', 'hello from bob']
    await waitForMessages(aliceHandle, channelId, expectedBodies)
    await waitForMessages(bobHandle, channelId, expectedBodies)
  }, 20_000)

  it('merges offline client edits after reconnect', async () => {
    const started = await startServer()
    const bobDataDir = await mkdtemp(join(tmpdir(), 'autodisco-bob-offline-test-'))
    try {
      const bootstrap = await bootstrapWorkspace(started.baseUrl, 'Offline Guild')
      const aliceRepo = createClientRepo('alice-offline', started.syncUrl)
      const bobOnlineRepo = createClientRepo('bob-online', started.syncUrl, bobDataDir)

      const aliceHandle = await aliceRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
      const { channelId, aliceId, bobId } = initializeWorkspace(aliceHandle)

      const bobOnlineHandle = await bobOnlineRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
      await waitForDoc(bobOnlineHandle, (doc) => Boolean(doc.channels[channelId] && doc.members[bobId]))
      await bobOnlineRepo.shutdown()
      removeRunningRepo(bobOnlineRepo)

      sendChatMessage(aliceHandle, {
        channelId,
        authorId: aliceId,
        body: 'online while bob is away',
        createdAt: '2026-05-09T17:03:00Z',
      })

      const bobOfflineRepo = createLocalClientRepo('bob-offline', bobDataDir)
      const bobOfflineHandle = await bobOfflineRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
      sendChatMessage(bobOfflineHandle, {
        channelId,
        authorId: bobId,
        body: 'offline from bob',
        createdAt: '2026-05-09T17:03:01Z',
      })
      await bobOfflineRepo.shutdown()
      removeRunningRepo(bobOfflineRepo)

      const bobReconnectRepo = createClientRepo('bob-reconnect', started.syncUrl, bobDataDir)
      const bobReconnectHandle = await bobReconnectRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)

      const expectedBodies = ['online while bob is away', 'offline from bob']
      await waitForMessages(aliceHandle, channelId, expectedBodies)
      await waitForMessages(bobReconnectHandle, channelId, expectedBodies)
    } finally {
      await rm(bobDataDir, { recursive: true, force: true })
    }
  }, 20_000)

  it('persists synced workspace edits across relay restarts', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'autodisco-sync-persist-test-'))
    const firstServer = await startServer(dataDir)
    const bootstrap = await bootstrapWorkspace(firstServer.baseUrl, 'Persistent Guild')
    const aliceRepo = createClientRepo('alice-persist', firstServer.syncUrl)
    const aliceHandle = await aliceRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
    const { channelId, aliceId } = initializeWorkspace(aliceHandle)
    sendChatMessage(aliceHandle, {
      channelId,
      authorId: aliceId,
      body: 'persist me through restart',
      createdAt: '2026-05-09T17:02:00Z',
    })

    const serverHandle = await firstServer.chat.runtime.repo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
    await waitForMessages(serverHandle, channelId, ['persist me through restart'])
    await firstServer.chat.runtime.repo.flush()
    await aliceRepo.shutdown()
    removeRunningRepo(aliceRepo)
    await stopServer(firstServer, { removeDataDir: false })

    const secondServer = await startServer(dataDir)
    const restartedServerHandle = await secondServer.chat.runtime.repo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)
    await waitForMessages(restartedServerHandle, channelId, ['persist me through restart'])

    const charlieRepo = createClientRepo('charlie-persist', secondServer.syncUrl)
    const charlieHandle = await charlieRepo.find<WorkspaceDoc>(bootstrap.workspaceDocUrl)

    await waitForMessages(charlieHandle, channelId, ['persist me through restart'])
  }, 20_000)
})

function initializeWorkspace(handle: DocHandle<WorkspaceDoc>): { channelId: ChannelId; aliceId: MemberId; bobId: MemberId } {
  const channelId = newId('ch') as ChannelId
  const aliceId = newId('mem') as MemberId
  const bobId = newId('mem') as MemberId
  handle.change((doc) => {
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
  return { channelId, aliceId, bobId }
}

function sendChatMessage(
  handle: DocHandle<WorkspaceDoc>,
  input: { channelId: ChannelId; authorId: MemberId; body: string; createdAt: string },
): void {
  handle.change((doc) => {
    sendMessage(doc, {
      id: newId('msg'),
      channelId: input.channelId,
      authorId: input.authorId,
      body: input.body,
      createdAt: input.createdAt,
    })
  })
}

async function startServer(dataDir?: string): Promise<StartedServer> {
  const resolvedDataDir = dataDir ?? await mkdtemp(join(tmpdir(), 'autodisco-sync-test-'))
  const config: ServerConfig = {
    host: '127.0.0.1',
    port: 0,
    dataDir: resolvedDataDir,
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
  const started = { chat, server, dataDir: resolvedDataDir, baseUrl, syncUrl }
  runningServers.push(started)
  return started
}

async function stopServer(started: StartedServer, options: { removeDataDir: boolean }): Promise<void> {
  removeRunningServer(started)
  chatClose(started.chat)
  await new Promise<void>((resolve, reject) => started.server.close((err) => (err ? reject(err) : resolve())))
  if (options.removeDataDir) await rm(started.dataDir, { recursive: true, force: true })
}

function chatClose(chat: ChatServer): void {
  chat.runtime.wss.close()
}

function createClientRepo(name: string, syncUrl: string, dataDir?: string): Repo {
  const repo = new Repo({
    network: [new WebSocketClientAdapter(syncUrl, 100)],
    storage: dataDir ? new NodeFSStorageAdapter(dataDir) : undefined,
    peerId: `test-${name}-${crypto.randomUUID()}` as PeerId,
  })
  runningRepos.push(repo)
  return repo
}

function createLocalClientRepo(name: string, dataDir: string): Repo {
  const repo = new Repo({
    storage: new NodeFSStorageAdapter(dataDir),
    peerId: `test-${name}-${crypto.randomUUID()}` as PeerId,
  })
  runningRepos.push(repo)
  return repo
}

function removeRunningRepo(repo: Repo): void {
  const index = runningRepos.indexOf(repo)
  if (index >= 0) runningRepos.splice(index, 1)
}

function removeRunningServer(started: StartedServer): void {
  const index = runningServers.indexOf(started)
  if (index >= 0) runningServers.splice(index, 1)
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

async function waitForMessages(handle: DocHandle<WorkspaceDoc>, channelId: ChannelId, bodies: string[]): Promise<void> {
  await waitForDoc(handle, (doc) => {
    const actual = (doc.messagesByChannel[channelId] ?? []).map((message) => message.body).sort()
    return bodies.every((body) => actual.includes(body))
  })
}

function waitForDoc(handle: DocHandle<WorkspaceDoc>, predicate: (doc: WorkspaceDoc) => boolean, timeoutMs = 5_000): Promise<void> {
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
