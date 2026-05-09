import type { ChannelMessagesDoc, KeyhiveRefs, WorkspaceDoc, WorkspaceId } from './types.js'

export interface CreateWorkspaceInput {
  workspaceId: WorkspaceId
  name: string
  createdAt: string
  keyhive?: KeyhiveRefs
}

export function createWorkspaceDoc(input: CreateWorkspaceInput): WorkspaceDoc {
  const doc: WorkspaceDoc = {
    schemaVersion: 1,
    workspaceId: input.workspaceId,
    name: input.name,
    createdAt: input.createdAt,
    categories: {},
    channels: {},
    members: {},
    roles: {},
    messagesByChannel: {},
    botConfigs: {},
    botRuns: {},
  }
  if (input.keyhive) doc.keyhive = input.keyhive
  return doc
}

export function createChannelMessagesDoc(input: {
  workspaceId: WorkspaceId
  channelId: ChannelMessagesDoc['channelId']
}): ChannelMessagesDoc {
  return {
    schemaVersion: 1,
    workspaceId: input.workspaceId,
    channelId: input.channelId,
    messages: [],
    botRuns: {},
    checkpoints: {
      approximateMessageCount: 0,
    },
  }
}
