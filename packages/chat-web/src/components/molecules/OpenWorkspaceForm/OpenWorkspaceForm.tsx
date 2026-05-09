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
    const parsed = parseWorkspaceInput(workspaceDocUrl.trim())
    const trimmedDocUrl = parsed.workspaceDocUrl
    const trimmedSyncUrl = (parsed.syncUrl ?? syncUrl).trim()
    if (!trimmedDocUrl || !trimmedSyncUrl) return
    onOpen({ workspaceDocUrl: trimmedDocUrl, syncUrl: trimmedSyncUrl })
  }

  function updateWorkspaceInput(value: string) {
    setWorkspaceDocUrl(value)
    const parsed = parseWorkspaceInput(value.trim())
    if (parsed.syncUrl) setSyncUrl(parsed.syncUrl)
  }

  return (
    <form data-widget="autodisco" data-part="open-workspace-form" onSubmit={submit}>
      <MacTextField label="Automerge URL or Join Link" value={workspaceDocUrl} onChange={(event) => updateWorkspaceInput(event.currentTarget.value)} helperText="Paste an automerge: document URL, or paste a copied Join Link; join links auto-fill the relay URL." />
      <MacTextField label="Sync URL" value={syncUrl} onChange={(event) => setSyncUrl(event.currentTarget.value)} helperText="Use the relay WebSocket URL, for example ws://localhost:3030/sync." />
      <MacButton type="submit" disabled={!workspaceDocUrl.trim() || !syncUrl.trim()}>Open Workspace</MacButton>
    </form>
  )
}

function parseWorkspaceInput(value: string): { workspaceDocUrl: string; syncUrl?: string } {
  if (!value) return { workspaceDocUrl: '' }
  if (value.startsWith('automerge:')) return { workspaceDocUrl: value }
  try {
    const url = new URL(value)
    const workspaceDocUrl = url.searchParams.get('doc') ?? url.searchParams.get('workspace') ?? ''
    const syncUrl = url.searchParams.get('sync') ?? undefined
    return workspaceDocUrl ? { workspaceDocUrl, syncUrl } : { workspaceDocUrl: value }
  } catch {
    return { workspaceDocUrl: value }
  }
}
