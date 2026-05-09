import { MacButton } from '../../atoms/MacButton/index.js'
import { StatusPill } from '../../atoms/StatusPill/index.js'

export type WorkspaceCopyKind = 'doc' | 'sync' | 'join'

export interface WorkspaceCardProps {
  name: string
  workspaceDocUrl?: string
  syncUrl?: string
  joinUrl?: string
  status?: 'idle' | 'ok' | 'warn' | 'error'
  onCopy?: (kind: WorkspaceCopyKind, value: string) => void
  onResetLocal?: () => void
}

export function WorkspaceCard({ name, workspaceDocUrl, syncUrl, joinUrl, status = 'idle', onCopy, onResetLocal }: WorkspaceCardProps) {
  return (
    <section data-widget="autodisco" data-part="workspace-card">
      <div data-part="workspace-card-header">
        <h3>{name}</h3>
        <StatusPill tone={status}>{status === 'ok' ? 'created' : status}</StatusPill>
      </div>
      <dl>
        <dt>Doc</dt>
        <dd>{workspaceDocUrl ?? 'not created'}</dd>
        <dt>Sync</dt>
        <dd>{syncUrl ?? 'waiting'}</dd>
        <dt>Join</dt>
        <dd>{joinUrl ?? 'not ready'}</dd>
      </dl>
      <div data-part="workspace-actions">
        <MacButton compact disabled={!workspaceDocUrl || !onCopy} onClick={() => workspaceDocUrl && onCopy?.('doc', workspaceDocUrl)}>Copy Doc</MacButton>
        <MacButton compact disabled={!syncUrl || !onCopy} onClick={() => syncUrl && onCopy?.('sync', syncUrl)}>Copy Sync</MacButton>
        <MacButton compact disabled={!joinUrl || !onCopy} onClick={() => joinUrl && onCopy?.('join', joinUrl)}>Copy Join</MacButton>
        {onResetLocal ? <MacButton compact variant="danger" onClick={onResetLocal}>Reset Local</MacButton> : null}
      </div>
    </section>
  )
}
