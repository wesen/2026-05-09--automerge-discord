import { stableBotRunId } from './ids.js'
import type {
  BotId,
  BotRunRecord,
  CategoryId,
  ChannelId,
  ChannelKind,
  MemberId,
  MessageId,
  MessageRecord,
  RoleId,
  WorkspaceDoc,
} from './types.js'

export class ChatModelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatModelError'
  }
}

export function addMember(
  doc: WorkspaceDoc,
  input: { id: MemberId; displayName: string; roles?: RoleId[]; joinedAt: string; bot?: boolean },
): void {
  doc.members[input.id] = withoutUndefined({
    id: input.id,
    displayName: input.displayName,
    roles: input.roles ?? [],
    joinedAt: input.joinedAt,
    bot: input.bot,
  })
}

export function addRole(doc: WorkspaceDoc, input: { id: RoleId; name: string; grants?: string[] }): void {
  doc.roles[input.id] = {
    id: input.id,
    name: input.name,
    grants: input.grants ?? [],
  }
}

export function createCategory(
  doc: WorkspaceDoc,
  input: { id: CategoryId; name: string; position: number },
): void {
  doc.categories[input.id] = {
    id: input.id,
    name: input.name,
    position: input.position,
  }
}

export function createChannel(
  doc: WorkspaceDoc,
  input: {
    id: ChannelId
    name: string
    kind?: ChannelKind
    categoryId?: CategoryId | null
    topic?: string
    createdBy: MemberId
    createdAt: string
    messageDocUrl?: string
  },
): void {
  assertMemberExists(doc, input.createdBy)
  doc.channels[input.id] = withoutUndefined({
    id: input.id,
    name: input.name,
    kind: input.kind ?? 'text',
    categoryId: input.categoryId ?? null,
    topic: input.topic,
    createdBy: input.createdBy,
    createdAt: input.createdAt,
    messageDocUrl: input.messageDocUrl,
  })
  doc.messagesByChannel[input.id] ??= []
}

export function archiveChannel(doc: WorkspaceDoc, channelId: ChannelId): void {
  const channel = requireChannel(doc, channelId)
  channel.archived = true
}

export function sendMessage(
  doc: WorkspaceDoc,
  input: {
    id: MessageId
    channelId: ChannelId
    authorId: MemberId | BotId
    body: string
    createdAt: string
    replyTo?: MessageId
    botRunId?: BotRunRecord['id']
  },
): void {
  const channel = requireChannel(doc, input.channelId)
  if (channel.archived) throw new ChatModelError(`cannot send to archived channel ${input.channelId}`)
  doc.messagesByChannel[input.channelId] ??= []
  doc.messagesByChannel[input.channelId].push(withoutUndefined({
    id: input.id,
    authorId: input.authorId,
    body: input.body,
    createdAt: input.createdAt,
    replyTo: input.replyTo,
    reactions: {},
    botRunId: input.botRunId,
  }))
}

export function editMessage(
  doc: WorkspaceDoc,
  input: { channelId: ChannelId; messageId: MessageId; body: string; editedAt: string },
): void {
  const message = requireMessage(doc, input.channelId, input.messageId)
  if (message.deletedAt) throw new ChatModelError(`cannot edit deleted message ${input.messageId}`)
  message.body = input.body
  message.editedAt = input.editedAt
}

export function deleteMessage(
  doc: WorkspaceDoc,
  input: { channelId: ChannelId; messageId: MessageId; deletedAt: string },
): void {
  const message = requireMessage(doc, input.channelId, input.messageId)
  message.deletedAt = input.deletedAt
}

export function addReaction(
  doc: WorkspaceDoc,
  input: { channelId: ChannelId; messageId: MessageId; emoji: string; memberId: MemberId },
): void {
  assertMemberExists(doc, input.memberId)
  const message = requireMessage(doc, input.channelId, input.messageId)
  const members = message.reactions[input.emoji] ?? []
  if (!members.includes(input.memberId)) message.reactions[input.emoji] = [...members, input.memberId]
}

export function removeReaction(
  doc: WorkspaceDoc,
  input: { channelId: ChannelId; messageId: MessageId; emoji: string; memberId: MemberId },
): void {
  const message = requireMessage(doc, input.channelId, input.messageId)
  const members = message.reactions[input.emoji]
  if (!members) return
  message.reactions[input.emoji] = members.filter((id) => id !== input.memberId)
}

export function createBotRun(
  doc: WorkspaceDoc,
  input: { botId: BotId; channelId: ChannelId; promptMessageId: MessageId; startedAt: string },
): BotRunRecord {
  requireChannel(doc, input.channelId)
  requireMessage(doc, input.channelId, input.promptMessageId)
  const id = stableBotRunId(input.channelId, input.promptMessageId, input.botId)
  const existing = doc.botRuns[id]
  if (existing) return existing
  const run: BotRunRecord = {
    id,
    botId: input.botId,
    channelId: input.channelId,
    promptMessageId: input.promptMessageId,
    status: 'running',
    startedAt: input.startedAt,
  }
  doc.botRuns[id] = run
  return run
}

export function completeBotRun(
  doc: WorkspaceDoc,
  input: { botRunId: BotRunRecord['id']; completedAt: string },
): void {
  const run = doc.botRuns[input.botRunId]
  if (!run) throw new ChatModelError(`unknown bot run ${input.botRunId}`)
  run.status = 'completed'
  run.completedAt = input.completedAt
}

export function failBotRun(doc: WorkspaceDoc, input: { botRunId: BotRunRecord['id']; error: string }): void {
  const run = doc.botRuns[input.botRunId]
  if (!run) throw new ChatModelError(`unknown bot run ${input.botRunId}`)
  run.status = 'failed'
  run.error = input.error
}

export function listMessages(doc: WorkspaceDoc, channelId: ChannelId): readonly MessageRecord[] {
  requireChannel(doc, channelId)
  return doc.messagesByChannel[channelId] ?? []
}

function assertMemberExists(doc: WorkspaceDoc, memberId: MemberId): void {
  if (!doc.members[memberId]) throw new ChatModelError(`unknown member ${memberId}`)
}

function requireChannel(doc: WorkspaceDoc, channelId: ChannelId) {
  const channel = doc.channels[channelId]
  if (!channel) throw new ChatModelError(`unknown channel ${channelId}`)
  return channel
}

function requireMessage(doc: WorkspaceDoc, channelId: ChannelId, messageId: MessageId) {
  const message = doc.messagesByChannel[channelId]?.find((candidate) => candidate.id === messageId)
  if (!message) throw new ChatModelError(`unknown message ${messageId} in channel ${channelId}`)
  return message
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T
}
