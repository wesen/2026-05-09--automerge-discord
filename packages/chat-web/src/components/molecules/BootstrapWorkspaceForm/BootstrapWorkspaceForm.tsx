import { useState, type FormEvent } from 'react'
import { MacButton } from '../../atoms/MacButton/index.js'
import { MacTextField } from '../../atoms/MacTextField/index.js'

export interface BootstrapWorkspaceFormProps {
  isLoading?: boolean
  error?: string
  onCreate: (name: string) => void
}

export function BootstrapWorkspaceForm({ isLoading = false, error, onCreate }: BootstrapWorkspaceFormProps) {
  const [name, setName] = useState('Intern Guild')
  function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim()) onCreate(name.trim())
  }
  return (
    <form data-widget="autodisco" data-part="bootstrap-form" onSubmit={submit}>
      <MacTextField label="Workspace" value={name} onChange={(event) => setName(event.currentTarget.value)} helperText="Creates an Automerge workspace document through the relay." />
      {error ? <p data-part="form-error">{error}</p> : null}
      <MacButton type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Creating…' : 'Create Workspace'}</MacButton>
    </form>
  )
}
