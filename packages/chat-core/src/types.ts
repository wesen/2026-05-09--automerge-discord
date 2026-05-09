export type Brand<T, Name extends string> = T & { readonly __brand: Name }

export type WorkspaceId = Brand<string, 'WorkspaceId'>
export type CategoryId = Brand<string, 'CategoryId'>
export type ChannelId = Brand<string, 'ChannelId'>
export type MemberId = Brand<string, 'MemberId'>
export type RoleId = Brand<string, 'RoleId'>
export type MessageId = Brand<string, 'MessageId'>
export type BotId = Brand<string, 'BotId'>
export type BotRunId = Brand<string, 'BotRunId'>
export type AttachmentId = Brand<string, 'AttachmentId'>

export type ChannelKind = 'text' | 'bot-lab' | 'announcement'
export type BotRunStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface CategoryRecord {
  id: CategoryId
  name: string
  position: number
  archived?: boolean
}

export interface ChannelRecord {
  id: ChannelId
  name: string
  kind: ChannelKind
  categoryId: CategoryId | null
  topic?: string
  createdBy: MemberId
  createdAt: string
  archived?: boolean
  messageDocUrl?: string
}

export interface MemberRecord {
  id: MemberId
  displayName: string
  roles: RoleId[]
  joinedAt: string
  bot?: boolean
}

export interface RoleRecord {
  id: RoleId
  name: string
  grants: string[]
}

export interface AttachmentRef {
  id: AttachmentId
  name: string
  mediaType: string
  byteLength: number
  url?: string
  encryptedBlobRef?: string
}

export interface MessageRecord {
  id: MessageId
  authorId: MemberId | BotId
  body: string
  createdAt: string
  editedAt?: string
  replyTo?: MessageId
  reactions: Record<string, MemberId[]>
  attachments?: AttachmentRef[]
  botRunId?: BotRunId
  deletedAt?: string
}

export interface BotConfig {
  id: BotId
  displayName: string
  defaultChannelIds: ChannelId[]
  enabled: boolean
}

export interface BotRunRecord {
  id: BotRunId
  botId: BotId
  channelId: ChannelId
  promptMessageId: MessageId
  status: BotRunStatus
  startedAt: string
  completedAt?: string
  error?: string
}

export interface KeyhiveRefs {
  workspaceGroupId: string
  workspaceDocumentId: string
  channelDocumentIds: Record<string, string>
}

export interface WorkspaceDoc {
  schemaVersion: 1
  workspaceId: WorkspaceId
  name: string
  createdAt: string
  categories: Record<string, CategoryRecord>
  channels: Record<string, ChannelRecord>
  members: Record<string, MemberRecord>
  roles: Record<string, RoleRecord>
  messagesByChannel: Record<string, MessageRecord[]>
  botConfigs: Record<string, BotConfig>
  botRuns: Record<string, BotRunRecord>
  keyhive?: KeyhiveRefs
}

export interface ChannelMessagesDoc {
  schemaVersion: 1
  workspaceId: WorkspaceId
  channelId: ChannelId
  messages: MessageRecord[]
  botRuns: Record<string, BotRunRecord>
  checkpoints: {
    approximateMessageCount: number
    lastCompactedAt?: string
  }
}
