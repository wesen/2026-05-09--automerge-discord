#!/usr/bin/env node
import * as A from '@automerge/automerge'

// Smoke experiment: model Discord-like chat state in one Automerge document and
// verify concurrent channel/message edits merge without central ordering.
function newServer(name) {
  return A.from({
    schemaVersion: 1,
    serverId: `srv_${name.toLowerCase()}`,
    name,
    categories: {},
    channels: {},
    messagesByChannel: {},
    members: {},
    botRuns: {},
  })
}

let base = newServer('Intern Guild')
let alice = A.clone(base)
let bob = A.clone(base)

alice = A.change(alice, d => {
  d.members.alice = { displayName: 'Alice', roles: ['admin'] }
  d.channels.general = { name: 'general', kind: 'text', categoryId: null, createdBy: 'alice' }
  d.messagesByChannel.general = []
  d.messagesByChannel.general.push({ id: 'm1', authorId: 'alice', body: 'hello', createdAt: '2026-05-09T12:00:00Z', reactions: {} })
})

bob = A.change(bob, d => {
  d.members.bot = { displayName: 'Helper Bot', roles: ['bot'] }
  d.channels.bots = { name: 'bots', kind: 'text', categoryId: null, createdBy: 'bob' }
  d.messagesByChannel.bots = []
  d.messagesByChannel.bots.push({ id: 'm2', authorId: 'bot', body: 'ready', createdAt: '2026-05-09T12:00:01Z', reactions: {} })
})

const merged = A.merge(alice, bob)
console.log(JSON.stringify({
  channels: Object.keys(merged.channels).sort(),
  members: Object.keys(merged.members).sort(),
  generalMessages: merged.messagesByChannel.general?.length ?? 0,
  botMessages: merged.messagesByChannel.bots?.length ?? 0,
}, null, 2))
