import { Repo, type PeerId } from '@automerge/automerge-repo'
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'

const repos = new Map<string, Repo>()

export function getBrowserRepo(syncUrl = deriveDefaultSyncUrl()): Repo {
  const existing = repos.get(syncUrl)
  if (existing) return existing
  const repo = new Repo({
    network: [new WebSocketClientAdapter(syncUrl, 1_000)],
    storage: new IndexedDBStorageAdapter(`autodisco:${syncUrl}`),
    peerId: getSessionPeerId(),
  })
  repos.set(syncUrl, repo)
  return repo
}

export function deriveDefaultSyncUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3030/sync'
  const url = new URL('/sync', window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

function getSessionPeerId(): PeerId {
  const key = 'autodisco.peerId'
  const existing = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null
  if (existing) return existing as PeerId
  const peerId = `web-${crypto.randomUUID()}` as PeerId
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, peerId)
  return peerId
}
