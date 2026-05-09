import { Repo, type PeerId } from '@automerge/automerge-repo'
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'

const repos = new Map<string, Repo>()

export function getBrowserRepo(syncUrl = deriveDefaultSyncUrl()): Repo {
  const existing = repos.get(syncUrl)
  if (existing) return existing
  const repo = new Repo({
    network: [new WebSocketClientAdapter(syncUrl, 1_000)],
    storage: new IndexedDBStorageAdapter(storageDatabaseName(syncUrl)),
    peerId: getSessionPeerId(),
  })
  repos.set(syncUrl, repo)
  return repo
}

export async function resetBrowserRepoStorage(syncUrl = deriveDefaultSyncUrl()): Promise<void> {
  const repo = repos.get(syncUrl)
  if (repo) {
    await repo.shutdown()
    repos.delete(syncUrl)
  }
  if (typeof indexedDB === 'undefined') return
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(storageDatabaseName(syncUrl))
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('failed to delete IndexedDB storage'))
    request.onblocked = () => resolve()
  })
}

export function storageDatabaseName(syncUrl: string): string {
  return `autodisco:${syncUrl}`
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
