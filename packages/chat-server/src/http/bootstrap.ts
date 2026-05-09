import { Router, type Request, type Response } from 'express'
import { createWorkspaceDoc, newId } from '@autodisco/chat-core'
import { ForbiddenError, type AccessControlAdapter, type ChatAccess } from '@autodisco/chat-acl'
import type { Repo } from '@automerge/automerge-repo'
import type { ServerConfig } from '../config.js'
import { syncUrl } from '../config.js'

const CHAT_ACCESSES: ChatAccess[] = ['pull', 'read', 'comment', 'edit', 'admin']

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
      respondWithError(res, error)
    }
  })

  router.post('/invitations', async (req: Request, res: Response) => {
    try {
      const invite = parseInvitationRequest(req.body)
      if (!invite) {
        res.status(400).json({ error: 'workspaceDocumentId, contactCard, and optional access are required' })
        return
      }
      await acl.assertCanAdmin(invite.workspaceDocumentId)
      const agent = await acl.receiveContactCard(invite.contactCard)
      const target = { id: invite.workspaceDocumentId, kind: 'document' as const }
      await acl.invite(agent, target, invite.access)
      const membershipEvents = await acl.exportMembershipEventsFor(agent)
      res.status(201).json({
        invitationId: `inv_${Date.now().toString(36)}`,
        mode: config.aclMode,
        agent,
        target,
        access: invite.access,
        membershipEventCount: membershipEvents.length,
        invitation: {
          kind: 'autodisco.invitation.v1',
          mode: config.aclMode,
          agent,
          target,
          access: invite.access,
          membershipEvents: membershipEvents.map((event) => Buffer.from(event).toString('base64')),
        },
      })
    } catch (error) {
      respondWithError(res, error)
    }
  })

  router.post('/invitations/revoke', async (req: Request, res: Response) => {
    try {
      const revoke = parseRevokeRequest(req.body)
      if (!revoke) {
        res.status(400).json({ error: 'workspaceDocumentId and agent are required' })
        return
      }
      await acl.assertCanAdmin(revoke.workspaceDocumentId)
      const target = { id: revoke.workspaceDocumentId, kind: 'document' as const }
      await acl.revoke(revoke.agent, target)
      res.status(200).json({ mode: config.aclMode, agent: revoke.agent, target, revoked: true })
    } catch (error) {
      respondWithError(res, error)
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

function parseInvitationRequest(body: unknown): { workspaceDocumentId: string; contactCard: unknown; access: ChatAccess } | null {
  if (!body || typeof body !== 'object') return null
  const value = body as { workspaceDocumentId?: unknown; contactCard?: unknown; access?: unknown }
  const workspaceDocumentId = typeof value.workspaceDocumentId === 'string' ? value.workspaceDocumentId.trim() : ''
  if (!workspaceDocumentId || value.contactCard === undefined) return null
  const access = typeof value.access === 'string' && CHAT_ACCESSES.includes(value.access as ChatAccess) ? (value.access as ChatAccess) : 'read'
  return { workspaceDocumentId, contactCard: value.contactCard, access }
}

function parseRevokeRequest(body: unknown): { workspaceDocumentId: string; agent: { id: string; kind: 'individual' | 'group' | 'bot' } } | null {
  if (!body || typeof body !== 'object') return null
  const value = body as { workspaceDocumentId?: unknown; agent?: { id?: unknown; kind?: unknown } }
  const workspaceDocumentId = typeof value.workspaceDocumentId === 'string' ? value.workspaceDocumentId.trim() : ''
  const agent = value.agent
  if (!workspaceDocumentId || !agent?.id || (agent.kind !== 'individual' && agent.kind !== 'group' && agent.kind !== 'bot')) return null
  return { workspaceDocumentId, agent: { id: String(agent.id), kind: agent.kind } }
}

function respondWithError(res: Response, error: unknown): void {
  if (error instanceof ForbiddenError) {
    res.status(403).json({ error: error.message })
    return
  }
  res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
}
