import { Router, type Request, type Response } from 'express'
import { createWorkspaceDoc, newId } from '@autodisco/chat-core'
import type { AccessControlAdapter } from '@autodisco/chat-acl'
import type { Repo } from '@automerge/automerge-repo'
import type { ServerConfig } from '../config.js'
import { syncUrl } from '../config.js'

export function createBootstrapRouter(repo: Repo, config: ServerConfig, acl: AccessControlAdapter): Router {
  const router = Router()

  router.post('/workspaces', async (req: Request, res: Response) => {
    try {
      const name = parseWorkspaceName(req.body)
      if (!name) {
        res.status(400).json({ error: 'name is required' })
        return
      }

      const workspaceId = newId('wk')
      const access = await acl.createWorkspace(name)
      const handle = repo.create(
        createWorkspaceDoc({
          workspaceId,
          name,
          createdAt: new Date().toISOString(),
          keyhive: {
            workspaceGroupId: access.workspaceGroupId,
            workspaceDocumentId: access.workspaceDocumentId,
            channelDocumentIds: {},
          },
        }),
      )

      res.status(201).json({
        workspaceId,
        workspaceDocUrl: handle.url,
        syncUrl: syncUrl(config),
        keyhive: access,
      })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
    }
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
