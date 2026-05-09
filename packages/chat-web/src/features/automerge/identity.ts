import { newId, type MemberId } from '@autodisco/chat-core'

export interface LocalIdentity {
  memberId: MemberId
  displayName: string
  publicKey: string
  publicKeyFingerprint: string
}

export interface AutodiscoContactCardV1 {
  kind: 'autodisco.contact-card.v1'
  mode: 'mock'
  displayName: string
  agent: {
    id: string
    kind: 'individual'
  }
  publicKey: string
  createdAt: string
}

export function getLocalIdentity(): LocalIdentity {
  const memberKey = 'autodisco.memberId'
  const nameKey = 'autodisco.displayName'
  const publicKeyKey = 'autodisco.publicKey'
  const storedMemberId = typeof localStorage !== 'undefined' ? localStorage.getItem(memberKey) : null
  const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem(nameKey) : null
  const storedPublicKey = typeof localStorage !== 'undefined' ? localStorage.getItem(publicKeyKey) : null
  const publicKey = storedPublicKey ?? generatePublicKeyBase64()
  const identity: LocalIdentity = {
    memberId: (storedMemberId ?? newId('mem')) as MemberId,
    displayName: storedName ?? `Peer ${Math.floor(Math.random() * 900 + 100)}`,
    publicKey,
    publicKeyFingerprint: fingerprintPublicKey(publicKey),
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(memberKey, identity.memberId)
    localStorage.setItem(nameKey, identity.displayName)
    localStorage.setItem(publicKeyKey, identity.publicKey)
  }
  return identity
}

export function createMockContactCard(identity: LocalIdentity): AutodiscoContactCardV1 {
  return {
    kind: 'autodisco.contact-card.v1',
    mode: 'mock',
    displayName: identity.displayName,
    agent: { id: identity.memberId, kind: 'individual' },
    publicKey: identity.publicKey,
    createdAt: new Date().toISOString(),
  }
}

export function stringifyContactCard(identity: LocalIdentity): string {
  return JSON.stringify(createMockContactCard(identity), null, 2)
}

function generatePublicKeyBase64(): string {
  const bytes = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  return bytesToBase64(bytes)
}

function fingerprintPublicKey(publicKey: string): string {
  const compact = publicKey.replace(/[^a-zA-Z0-9]/g, '')
  if (compact.length <= 12) return compact
  return `${compact.slice(0, 6)}…${compact.slice(-6)}`
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}
