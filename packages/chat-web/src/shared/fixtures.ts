import type { ChannelId, MemberId, MessageRecord, WorkspaceDoc, WorkspaceId } from '@autodisco/chat-core'

export const fixtureIds = {
  workspace: 'wk_demo' as WorkspaceId,
  general: 'ch_general' as ChannelId,
  bots: 'ch_bots' as ChannelId,
  alice: 'mem_alice' as MemberId,
  bob: 'mem_bob' as MemberId,
}

export const fixtureMessages: MessageRecord[] = [
  {
    id: 'msg_1' as MessageRecord['id'],
    authorId: fixtureIds.alice,
    body: 'I created the workspace while offline. It should merge when I reconnect.',
    createdAt: '2026-05-09T16:00:00Z',
    reactions: { '◆': [fixtureIds.bob] },
  },
  {
    id: 'msg_2' as MessageRecord['id'],
    authorId: fixtureIds.bob,
    body: 'The relay is up. Next step: bind this to Automerge live handles.',
    createdAt: '2026-05-09T16:01:00Z',
    reactions: {},
  },
]

export const fixtureWorkspace: WorkspaceDoc = {
  schemaVersion: 1,
  workspaceId: fixtureIds.workspace,
  name: 'Intern Guild',
  createdAt: '2026-05-09T15:59:00Z',
  categories: {},
  channels: {
    [fixtureIds.general]: {
      id: fixtureIds.general,
      name: 'general',
      kind: 'text',
      categoryId: null,
      createdBy: fixtureIds.alice,
      createdAt: '2026-05-09T15:59:30Z',
    },
    [fixtureIds.bots]: {
      id: fixtureIds.bots,
      name: 'bots',
      kind: 'bot-lab',
      categoryId: null,
      createdBy: fixtureIds.bob,
      createdAt: '2026-05-09T15:59:40Z',
    },
  },
  members: {
    [fixtureIds.alice]: { id: fixtureIds.alice, displayName: 'Alice', roles: [], joinedAt: '2026-05-09T15:58:00Z' },
    [fixtureIds.bob]: { id: fixtureIds.bob, displayName: 'Bob', roles: [], joinedAt: '2026-05-09T15:58:30Z' },
  },
  roles: {},
  messagesByChannel: {
    [fixtureIds.general]: fixtureMessages,
    [fixtureIds.bots]: [],
  },
  botConfigs: {},
  botRuns: {},
}
