import type { HTMLAttributes, ReactNode } from 'react'

export interface MacPanelProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  title?: string
  inset?: boolean
}

export function MacPanel({ children, title, inset = false, className = '', ...props }: MacPanelProps) {
  return (
    <section
      data-widget="autodisco"
      data-part="mac-panel"
      data-inset={inset ? 'true' : 'false'}
      className={className}
      {...props}
    >
      {title ? <h2 data-part="mac-panel-title">{title}</h2> : null}
      <div data-part="mac-panel-body">{children}</div>
    </section>
  )
}
