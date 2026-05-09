import { useState } from 'react'
import { MacButton } from '../../atoms/MacButton/index.js'

export interface InvitationFormValue {
  contactCardJson: string
  access: 'pull' | 'read' | 'comment' | 'edit' | 'admin'
}

export interface InvitationFormProps {
  disabled?: boolean
  isLoading?: boolean
  workspaceDocumentId?: string
  error?: string
  onCreateInvitation: (value: InvitationFormValue) => void
}

const DEFAULT_CONTACT_CARD = '{\n  "kind": "autodisco.contact-card.v1",\n  "mode": "mock",\n  "agent": { "id": "mem_peer", "kind": "individual" },\n  "publicKey": "paste-peer-public-key"\n}'

export function InvitationForm({ disabled, isLoading, workspaceDocumentId, error, onCreateInvitation }: InvitationFormProps) {
  const [contactCardJson, setContactCardJson] = useState(DEFAULT_CONTACT_CARD)
  const [access, setAccess] = useState<InvitationFormValue['access']>('read')
  const canSubmit = !disabled && !isLoading && !!workspaceDocumentId && contactCardJson.trim().length > 0
  return (
    <form
      data-widget="autodisco"
      data-part="invitation-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onCreateInvitation({ contactCardJson, access })
      }}
    >
      <label htmlFor="invite-access">Invite access</label>
      <select id="invite-access" value={access} disabled={disabled || isLoading} onChange={(event) => setAccess(event.target.value as InvitationFormValue['access'])}>
        <option value="pull">pull</option>
        <option value="read">read</option>
        <option value="comment">comment</option>
        <option value="edit">edit</option>
        <option value="admin">admin</option>
      </select>
      <label htmlFor="invite-contact-card">Peer contact card JSON</label>
      <textarea
        id="invite-contact-card"
        value={contactCardJson}
        disabled={disabled || isLoading}
        rows={7}
        data-part="invite-contact-card"
        onChange={(event) => setContactCardJson(event.target.value)}
      />
      <p data-part="form-hint">Paste a copied AUTODISCO contact-card envelope here. In Keyhive mode it contains an opaque Keyhive card under keyhiveContactCardJson.</p>
      <p data-part="form-hint">Access is the ACL level delegated to the pasted contact card. Use read for viewing, comment/edit for writing, and admin for further delegation.</p>
      <MacButton type="submit" disabled={!canSubmit}>{isLoading ? 'Creating…' : 'Create Invite'}</MacButton>
      {workspaceDocumentId ? <p data-part="form-hint">Target ACL document: {workspaceDocumentId}</p> : <p data-part="form-hint">Create or open a workspace with ACL refs first.</p>}
      {error ? <p data-part="form-error">{error}</p> : null}
    </form>
  )
}
