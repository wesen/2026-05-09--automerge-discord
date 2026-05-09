export interface StatusPillProps {
  tone?: 'idle' | 'ok' | 'warn' | 'error'
  children: string
}

export function StatusPill({ tone = 'idle', children }: StatusPillProps) {
  return (
    <span data-widget="autodisco" data-part="status-pill" data-tone={tone}>
      {children}
    </span>
  )
}
