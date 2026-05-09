import type { ChannelMessagesDoc, WorkspaceDoc, WorkspaceId } from './types.js'

export interface CreateWorkspaceInput {
  workspaceId: WorkspaceId
  name: string
  createdAt: string
}

export function createWorkspaceDoc(input: CreateWorkspaceInput): WorkspaceDoc {
  return {
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
