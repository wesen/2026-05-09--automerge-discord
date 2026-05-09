import type {
  AttachmentId,
  BotId,
  BotRunId,
  CategoryId,
  ChannelId,
  MemberId,
  MessageId,
  RoleId,
  WorkspaceId,
} from './types.js'

export type IdPrefix = 'wk' | 'cat' | 'ch' | 'mem' | 'role' | 'msg' | 'bot' | 'run' | 'att'

const branders = {
  wk: (id: string) => id as WorkspaceId,
  cat: (id: string) => id as CategoryId,
  ch: (id: string) => id as ChannelId,
  mem: (id: string) => id as MemberId,
  role: (id: string) => id as RoleId,
  msg: (id: string) => id as MessageId,
  bot: (id: string) => id as BotId,
  run: (id: string) => id as BotRunId,
  att: (id: string) => id as AttachmentId,
}

export type IdForPrefix<P extends IdPrefix> = ReturnType<(typeof branders)[P]>

export function newId<P extends IdPrefix>(prefix: P, random = cryptoRandom()): IdForPrefix<P> {
  return branders[prefix](`${prefix}_${random}`) as IdForPrefix<P>
}

export function stableBotRunId(channelId: ChannelId, messageId: MessageId, botId: BotId): BotRunId {
  return `run_${channelId}_${messageId}_${botId}` as BotRunId
}

function cryptoRandom(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 24)
  }
  return Math.random().toString(36).slice(2, 14)
}
