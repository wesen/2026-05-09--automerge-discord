import type { InputHTMLAttributes } from 'react'

export interface MacTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
}

export function MacTextField({ label, helperText, id, className = '', ...props }: MacTextFieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <label data-widget="autodisco" data-part="mac-field" className={className} htmlFor={inputId}>
      <span data-part="mac-field-label">{label}</span>
      <input id={inputId} data-part="mac-input" {...props} />
      {helperText ? <span data-part="mac-field-helper">{helperText}</span> : null}
    </label>
  )
}
