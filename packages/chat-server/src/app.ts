import express from 'express'
import type http from 'node:http'
import { createAccessControlAdapter, type AccessControlAdapter } from '@autodisco/chat-acl'
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
  const acl = deps.acl ?? createAccessControlAdapter({ mode: 'mock' })

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
