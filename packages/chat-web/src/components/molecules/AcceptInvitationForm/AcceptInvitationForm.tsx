import { useState } from 'react'
import { MacButton } from '../../atoms/MacButton/index.js'

export interface AcceptInvitationFormValue {
  invitationJson: string
}

export interface AcceptInvitationFormProps {
  initialInvitationJson?: string
  isLoading?: boolean
  error?: string
  onAcceptInvitation: (value: AcceptInvitationFormValue) => void
}

export function AcceptInvitationForm({ initialInvitationJson = '', isLoading, error, onAcceptInvitation }: AcceptInvitationFormProps) {
  const [invitationJson, setInvitationJson] = useState(initialInvitationJson)
  const canSubmit = !isLoading && invitationJson.trim().length > 0
  return (
    <form
      data-widget="autodisco"
      data-part="accept-invitation-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onAcceptInvitation({ invitationJson })
      }}
    >
      <label htmlFor="accept-invitation-json">Accept invitation JSON</label>
      <textarea
        id="accept-invitation-json"
        value={invitationJson}
        rows={7}
        data-part="invite-contact-card"
        placeholder="Paste an autodisco.invitation.v1 JSON payload here"
        disabled={isLoading}
        onChange={(event) => setInvitationJson(event.target.value)}
      />
      <p data-part="form-hint">This ingests the invitation membership events into the running ACL adapter. In Keyhive mode this calls real Keyhive event ingestion.</p>
      <MacButton type="submit" disabled={!canSubmit}>{isLoading ? 'Accepting…' : 'Accept Invite'}</MacButton>
      {error ? <p data-part="form-error">{error}</p> : null}
    </form>
  )
}
