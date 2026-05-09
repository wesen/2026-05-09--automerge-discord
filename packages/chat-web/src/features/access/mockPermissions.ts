import type { ChannelId, MemberId, WorkspaceDoc } from '@autodisco/chat-core'

export interface PermissionDecision {
  allowed: boolean
  reason?: string
}

export function canCommentInMockWorkspace(doc: WorkspaceDoc | undefined, memberId: MemberId, channelId: ChannelId): PermissionDecision {
  if (!doc) return { allowed: false, reason: 'workspace document is not ready' }
  if (!doc.members[memberId]) return { allowed: false, reason: `member ${memberId} is not in this workspace` }
  if (!doc.channels[channelId]) return { allowed: false, reason: `channel ${channelId} does not exist` }
  return { allowed: true }
}
