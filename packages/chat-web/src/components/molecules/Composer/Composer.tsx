import { useState, type FormEvent } from 'react'
import { MacButton } from '../../atoms/MacButton/index.js'

export interface ComposerProps {
  disabled?: boolean
  placeholder?: string
  onSend: (body: string) => void
}

export function Composer({ disabled = false, placeholder = 'Type a message…', onSend }: ComposerProps) {
  const [body, setBody] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    onSend(trimmed)
    setBody('')
  }
  return (
    <form data-widget="autodisco" data-part="composer" onSubmit={submit}>
      <input data-part="composer-input" value={body} placeholder={placeholder} disabled={disabled} onChange={(event) => setBody(event.currentTarget.value)} />
      <MacButton type="submit" variant="primary" disabled={disabled || !body.trim()}>Send</MacButton>
    </form>
  )
}
