import { StatusPill } from '../../atoms/StatusPill/index.js'

export interface WorkspaceCardProps {
  name: string
  workspaceDocUrl?: string
  syncUrl?: string
  status?: 'idle' | 'ok' | 'warn' | 'error'
}

export function WorkspaceCard({ name, workspaceDocUrl, syncUrl, status = 'idle' }: WorkspaceCardProps) {
  return (
    <section data-widget="autodisco" data-part="workspace-card">
      <div>
        <h3>{name}</h3>
        <StatusPill tone={status}>{status === 'ok' ? 'created' : status}</StatusPill>
      </div>
      <dl>
        <dt>Doc</dt>
        <dd>{workspaceDocUrl ?? 'not created'}</dd>
        <dt>Sync</dt>
        <dd>{syncUrl ?? 'waiting'}</dd>
      </dl>
    </section>
  )
}
