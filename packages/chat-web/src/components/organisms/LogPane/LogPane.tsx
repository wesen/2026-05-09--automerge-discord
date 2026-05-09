import { MacButton } from '../../atoms/MacButton/index.js'
import { StatusPill } from '../../atoms/StatusPill/index.js'

export type LogLevel = 'info' | 'ok' | 'warn' | 'error'

export interface LogEntry {
  id: string
  at: string
  level: LogLevel
  message: string
  detail?: string
}

export interface LogPaneProps {
  entries: LogEntry[]
  open: boolean
  onToggle: () => void
  onClear: () => void
}

export function LogPane({ entries, open, onToggle, onClear }: LogPaneProps) {
  const latest = entries[0]
  return (
    <section data-widget="autodisco" data-part="log-pane" data-open={open ? 'true' : 'false'} aria-label="Debug log">
      <header data-part="log-pane-header">
        <div>
          <strong>Debug Log</strong>
          {latest ? <small>{latest.message}</small> : <small>No events yet.</small>}
        </div>
        <div data-part="log-pane-actions">
          <StatusPill tone={entries.some((entry) => entry.level === 'error') ? 'error' : entries.some((entry) => entry.level === 'warn') ? 'warn' : 'ok'}>{`${entries.length} events`}</StatusPill>
          <MacButton compact onClick={onToggle}>{open ? 'Hide' : 'Show'}</MacButton>
          {open ? <MacButton compact onClick={onClear}>Clear</MacButton> : null}
        </div>
      </header>
      {open ? (
        <ol data-part="log-list">
          {entries.length ? entries.map((entry) => (
            <li key={entry.id} data-part="log-entry" data-level={entry.level}>
              <time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
              <span data-role="level">{entry.level}</span>
              <span>{entry.message}</span>
              {entry.detail ? <code>{entry.detail}</code> : null}
            </li>
          )) : <li data-part="log-empty">No debug events have been recorded.</li>}
        </ol>
      ) : null}
    </section>
  )
}
