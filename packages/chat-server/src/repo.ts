import fs from 'node:fs'
import os from 'node:os'
import { Repo, type PeerId } from '@automerge/automerge-repo'
import { WebSocketServerAdapter } from '@automerge/automerge-repo-network-websocket'
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs'
import { WebSocketServer } from 'ws'
import type { ServerConfig } from './config.js'

export interface RepoRuntime {
  repo: Repo
  wss: WebSocketServer
}

export function createRepoRuntime(config: ServerConfig): RepoRuntime {
  fs.mkdirSync(config.dataDir, { recursive: true })
  const wss = new WebSocketServer({ noServer: true })
  const repo = new Repo({
    network: [new WebSocketServerAdapter(wss as never, 60_000)],
    storage: new NodeFSStorageAdapter(config.dataDir),
    peerId: `chat-relay-${os.hostname()}` as PeerId,
    sharePolicy: async () => false,
  })
  return { repo, wss }
}
