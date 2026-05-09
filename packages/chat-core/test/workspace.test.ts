import * as A from '@automerge/automerge'
import { describe, expect, it } from 'vitest'
import {
  addMember,
  addReaction,
  completeBotRun,
  createBotRun,
  createChannel,
  createWorkspaceDoc,
  editMessage,
  sendMessage,
  stableBotRunId,
  type BotId,
  type ChannelId,
  type MemberId,
  type MessageId,
  type WorkspaceDoc,
  type WorkspaceId,
} from '../src/index.js'

const wk = 'wk_test' as WorkspaceId
const alice = 'mem_alice' as MemberId
const bob = 'mem_bob' as MemberId
const bot = 'bot_helper' as BotId
const general = 'ch_general' as ChannelId
const bots = 'ch_bots' as ChannelId
const m1 = 'msg_1' as MessageId
const m2 = 'msg_2' as MessageId

function baseDoc() {
  return A.from<WorkspaceDoc>(createWorkspaceDoc({ workspaceId: wk, name: 'Intern Guild', createdAt: '2026-05-09T12:00:00Z' }))
}

describe('workspace Automerge model', () => {
  it('merges concurrent channel/member/message creation', () => {
    const base = baseDoc()
    const left = A.change(A.clone(base), (doc) => {
      addMember(doc, { id: alice, displayName: 'Alice', joinedAt: '2026-05-09T12:00:01Z' })
      createChannel(doc, { id: general, name: 'general', createdBy: alice, createdAt: '2026-05-09T12:00:02Z' })
      sendMessage(doc, { id: m1, channelId: general, authorId: alice, body: 'hello', createdAt: '2026-05-09T12:00:03Z' })
    })
    const right = A.change(A.clone(base), (doc) => {
      addMember(doc, { id: bob, displayName: 'Bob', joinedAt: '2026-05-09T12:00:01Z' })
      addMember(doc, { id: bot as unknown as MemberId, displayName: 'Helper Bot', joinedAt: '2026-05-09T12:00:01Z', bot: true })
      createChannel(doc, { id: bots, name: 'bots', createdBy: bob, createdAt: '2026-05-09T12:00:02Z' })
      sendMessage(doc, { id: m2, channelId: bots, authorId: bot, body: 'ready', createdAt: '2026-05-09T12:00:03Z' })
    })

    const merged = A.merge(left, right)

    expect(Object.keys(merged.channels).sort()).toEqual(['ch_bots', 'ch_general'])
    expect(Object.keys(merged.members).sort()).toEqual(['bot_helper', 'mem_alice', 'mem_bob'])
    expect(merged.messagesByChannel[general]).toHaveLength(1)
    expect(merged.messagesByChannel[bots]).toHaveLength(1)
  })

  it('supports message edits and reactions', () => {
    const doc = A.change(baseDoc(), (draft) => {
      addMember(draft, { id: alice, displayName: 'Alice', joinedAt: '2026-05-09T12:00:01Z' })
      createChannel(draft, { id: general, name: 'general', createdBy: alice, createdAt: '2026-05-09T12:00:02Z' })
      sendMessage(draft, { id: m1, channelId: general, authorId: alice, body: 'helo', createdAt: '2026-05-09T12:00:03Z' })
      editMessage(draft, { channelId: general, messageId: m1, body: 'hello', editedAt: '2026-05-09T12:00:04Z' })
      addReaction(draft, { channelId: general, messageId: m1, emoji: '👋', memberId: alice })
    })

    expect(doc.messagesByChannel[general][0]?.body).toBe('hello')
    expect(doc.messagesByChannel[general][0]?.reactions['👋']).toEqual([alice])
  })

  it('uses deterministic bot run IDs for idempotent workers', () => {
    const runId = stableBotRunId(general, m1, bot)
    const doc = A.change(baseDoc(), (draft) => {
      addMember(draft, { id: alice, displayName: 'Alice', joinedAt: '2026-05-09T12:00:01Z' })
      createChannel(draft, { id: general, name: 'general', createdBy: alice, createdAt: '2026-05-09T12:00:02Z' })
      sendMessage(draft, { id: m1, channelId: general, authorId: alice, body: '@bot help', createdAt: '2026-05-09T12:00:03Z' })
      const first = createBotRun(draft, { botId: bot, channelId: general, promptMessageId: m1, startedAt: '2026-05-09T12:00:04Z' })
      const second = createBotRun(draft, { botId: bot, channelId: general, promptMessageId: m1, startedAt: '2026-05-09T12:00:05Z' })
      expect(first.id).toBe(second.id)
      completeBotRun(draft, { botRunId: runId, completedAt: '2026-05-09T12:00:06Z' })
    })

    expect(Object.keys(doc.botRuns)).toEqual([runId])
    expect(doc.botRuns[runId]?.status).toBe('completed')
  })
})
