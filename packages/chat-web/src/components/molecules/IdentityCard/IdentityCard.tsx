import { MacButton } from '../../atoms/MacButton/index.js'
import { StatusPill } from '../../atoms/StatusPill/index.js'

export interface IdentityCardProps {
  displayName: string
  memberId: string
  publicKeyFingerprint: string
  mode?: 'mock' | 'keyhive-experimental'
  onCopyContactCard?: () => void
}

export function IdentityCard({ displayName, memberId, publicKeyFingerprint, mode = 'mock', onCopyContactCard }: IdentityCardProps) {
  return (
    <section data-widget="autodisco" data-part="identity-card">
      <div data-part="identity-card-header">
        <h3>{displayName}</h3>
        <StatusPill tone={mode === 'mock' ? 'warn' : 'ok'}>{mode}</StatusPill>
      </div>
      <dl>
        <dt>Member</dt>
        <dd>{memberId}</dd>
        <dt>Key</dt>
        <dd>{publicKeyFingerprint}</dd>
      </dl>
      <div data-part="identity-actions">
        <MacButton compact disabled={!onCopyContactCard} onClick={onCopyContactCard}>Copy Contact Card</MacButton>
      </div>
    </section>
  )
}
