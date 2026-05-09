import { useEffect, useState, type FormEvent } from 'react'
import { MacButton } from '../../atoms/MacButton/index.js'
import { MacTextField } from '../../atoms/MacTextField/index.js'

export interface OpenWorkspaceFormValue {
  workspaceDocUrl: string
  syncUrl: string
}

export interface OpenWorkspaceFormProps {
  defaultSyncUrl: string
  onOpen: (value: OpenWorkspaceFormValue) => void
}

export function OpenWorkspaceForm({ defaultSyncUrl, onOpen }: OpenWorkspaceFormProps) {
  const [workspaceDocUrl, setWorkspaceDocUrl] = useState('')
  const [syncUrl, setSyncUrl] = useState(defaultSyncUrl)

  useEffect(() => setSyncUrl(defaultSyncUrl), [defaultSyncUrl])

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmedDocUrl = workspaceDocUrl.trim()
    const trimmedSyncUrl = syncUrl.trim()
    if (!trimmedDocUrl || !trimmedSyncUrl) return
    onOpen({ workspaceDocUrl: trimmedDocUrl, syncUrl: trimmedSyncUrl })
  }

  return (
    <form data-widget="autodisco" data-part="open-workspace-form" onSubmit={submit}>
      <MacTextField label="Automerge URL" value={workspaceDocUrl} onChange={(event) => setWorkspaceDocUrl(event.currentTarget.value)} helperText="Paste a workspace URL or open a copied join link from another session." />
      <MacTextField label="Sync URL" value={syncUrl} onChange={(event) => setSyncUrl(event.currentTarget.value)} helperText="Use the relay WebSocket URL, for example ws://localhost:3030/sync." />
      <MacButton type="submit" disabled={!workspaceDocUrl.trim() || !syncUrl.trim()}>Open Workspace</MacButton>
    </form>
  )
}
