import { newId, type MemberId } from '@autodisco/chat-core'

export interface LocalIdentity {
  memberId: MemberId
  displayName: string
}

export function getLocalIdentity(): LocalIdentity {
  const memberKey = 'autodisco.memberId'
  const nameKey = 'autodisco.displayName'
  const storedMemberId = typeof localStorage !== 'undefined' ? localStorage.getItem(memberKey) : null
  const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem(nameKey) : null
  const identity: LocalIdentity = {
    memberId: (storedMemberId ?? newId('mem')) as MemberId,
    displayName: storedName ?? `Peer ${Math.floor(Math.random() * 900 + 100)}`,
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(memberKey, identity.memberId)
    localStorage.setItem(nameKey, identity.displayName)
  }
  return identity
}
