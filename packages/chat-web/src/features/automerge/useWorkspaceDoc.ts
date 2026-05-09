import { useEffect, useMemo, useState } from 'react'
import type { AutomergeUrl, DocHandle } from '@automerge/automerge-repo'
import {
  addMember,
  createChannel,
  newId,
  sendMessage,
  type ChannelId,
  type MemberId,
  type WorkspaceDoc,
} from '@autodisco/chat-core'
import { getBrowserRepo } from './repo.js'
import type { LocalIdentity } from './identity.js'

export type WorkspaceDocStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface WorkspaceDocState {
  status: WorkspaceDocStatus
  doc?: WorkspaceDoc
  handle?: DocHandle<WorkspaceDoc>
  error?: string
}

export function useWorkspaceDoc(workspaceDocUrl?: string, syncUrl?: string): WorkspaceDocState {
  const [state, setState] = useState<WorkspaceDocState>({ status: 'idle' })

  useEffect(() => {
    if (!workspaceDocUrl) {
      setState({ status: 'idle' })
      return
    }

    let cancelled = false
    let cleanup: (() => void) | undefined
    setState({ status: 'loading' })

    void getBrowserRepo(syncUrl).find<WorkspaceDoc>(workspaceDocUrl as AutomergeUrl).then((handle) => {
      if (cancelled) return
      const publish = () => setState({ status: 'ready', handle, doc: handle.doc() })
      handle.on('change', publish)
      cleanup = () => handle.off('change', publish)
      publish()
    }).catch((error: unknown) => {
      if (!cancelled) setState({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [workspaceDocUrl, syncUrl])

  return state
}

export function useEnsureWorkspaceReady(handle: DocHandle<WorkspaceDoc> | undefined, doc: WorkspaceDoc | undefined, identity: LocalIdentity): void {
  useEffect(() => {
    if (!handle || !doc) return
    const needsMember = !doc.members[identity.memberId]
    const hasChannel = Object.keys(doc.channels).length > 0
    if (!needsMember && hasChannel) return

    handle.change((draft) => {
      if (!draft.members[identity.memberId]) {
        addMember(draft, {
          id: identity.memberId,
          displayName: identity.displayName,
          joinedAt: new Date().toISOString(),
        })
      }
      if (Object.keys(draft.channels).length === 0) {
        createChannel(draft, {
          id: newId('ch') as ChannelId,
          name: 'general',
          kind: 'text',
          categoryId: null,
          createdBy: identity.memberId,
          createdAt: new Date().toISOString(),
        })
      }
    })
  }, [handle, doc, identity.memberId, identity.displayName])
}

export function useWorkspaceActions(handle: DocHandle<WorkspaceDoc> | undefined, identity: LocalIdentity): { send: (channelId: ChannelId, body: string) => void } {
  return useMemo(() => ({
    send(channelId: ChannelId, body: string) {
      if (!handle) return
      handle.change((doc) => {
        sendMessage(doc, {
          id: newId('msg'),
          channelId,
          authorId: identity.memberId as MemberId,
          body,
          createdAt: new Date().toISOString(),
        })
      })
    },
  }), [handle, identity.memberId])
}
