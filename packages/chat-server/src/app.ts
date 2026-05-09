import express from 'express'
import fs from 'node:fs'
import type http from 'node:http'
import path from 'node:path'
import { createAccessControlAdapter, KeyhiveAccessControlAdapter, type AccessControlAdapter, type KeyhiveAccessControlSnapshot } from '@autodisco/chat-acl'
import type { ServerConfig } from './config.js'
import { createBootstrapRouter } from './http/bootstrap.js'
import { createRepoRuntime, type RepoRuntime } from './repo.js'

export interface ChatServer {
  app: express.Express
  runtime: RepoRuntime
  listen(): Promise<http.Server>
}

export interface ChatServerDependencies {
  acl?: AccessControlAdapter
}

export function createChatServer(config: ServerConfig, deps: ChatServerDependencies = {}): ChatServer {
  const app = express()
  app.use(express.json({ limit: '1mb' }))
  const runtime = createRepoRuntime(config)
  const acl = deps.acl ?? createServerAccessControlAdapter(config)

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true })
  })
  app.use('/api/bootstrap', createBootstrapRouter(runtime.repo, config, acl))

  return {
    app,
    runtime,
    listen() {
      return new Promise((resolve) => {
        const server = app.listen(config.port, config.host, () => resolve(server))
        server.on('upgrade', (request, socket, head) => {
          const pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).pathname
          if (pathname !== config.syncPath) {
            socket.destroy()
            return
          }
          runtime.wss.handleUpgrade(request, socket, head, (ws) => {
            runtime.wss.emit('connection', ws, request)
          })
        })
      })
    },
  }
}

function createServerAccessControlAdapter(config: ServerConfig): AccessControlAdapter {
  if (config.aclMode !== 'keyhive-experimental') return createAccessControlAdapter({ mode: config.aclMode })
  const snapshotPath = path.join(config.dataDir, 'keyhive-acl-snapshot.json')
  return new KeyhiveAccessControlAdapter({
    snapshot: readKeyhiveSnapshot(snapshotPath),
    onSnapshot: (snapshot) => writeKeyhiveSnapshot(snapshotPath, snapshot),
  })
}

function readKeyhiveSnapshot(snapshotPath: string): KeyhiveAccessControlSnapshot | undefined {
  try {
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as KeyhiveAccessControlSnapshot
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

function writeKeyhiveSnapshot(snapshotPath: string, snapshot: KeyhiveAccessControlSnapshot): void {
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true })
  const tmpPath = `${snapshotPath}.tmp`
  fs.writeFileSync(tmpPath, `${JSON.stringify(snapshot, null, 2)}\n`)
  fs.renameSync(tmpPath, snapshotPath)
}
