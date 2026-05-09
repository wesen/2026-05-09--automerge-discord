import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface MacButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  compact?: boolean
}

export function MacButton({ children, variant = 'secondary', compact = false, className = '', ...props }: MacButtonProps) {
  return (
    <button
      data-widget="autodisco"
      data-part="mac-button"
      data-variant={variant}
      data-density={compact ? 'compact' : 'normal'}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}
