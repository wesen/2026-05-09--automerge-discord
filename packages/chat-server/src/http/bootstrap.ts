import { Router, type Request, type Response } from 'express'
import { createWorkspaceDoc, newId } from '@autodisco/chat-core'
import type { Repo } from '@automerge/automerge-repo'
import type { ServerConfig } from '../config.js'
import { syncUrl } from '../config.js'

export function createBootstrapRouter(repo: Repo, config: ServerConfig): Router {
  const router = Router()

  router.post('/workspaces', (req: Request, res: Response) => {
    const name = parseWorkspaceName(req.body)
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }

    const workspaceId = newId('wk')
    const handle = repo.create(
      createWorkspaceDoc({
        workspaceId,
        name,
        createdAt: new Date().toISOString(),
      }),
    )

    res.status(201).json({
      workspaceId,
      workspaceDocUrl: handle.url,
      syncUrl: syncUrl(config),
    })
  })

  router.post('/invitations/accept', (_req: Request, res: Response) => {
    res.status(501).json({
      error: 'Keyhive invitation acceptance is reserved for Phase 4',
    })
  })

  return router
}

function parseWorkspaceName(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('name' in body)) return null
  const name = String((body as { name: unknown }).name).trim()
  return name.length > 0 ? name : null
}
