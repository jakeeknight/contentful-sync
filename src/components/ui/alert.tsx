import { type HTMLAttributes, type ReactNode } from 'react'

type AlertVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: AlertVariant
}

const variantStyles: Record<AlertVariant, string> = {
  default: 'bg-slate-50 border-slate-200 text-slate-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-600'
}

export function Alert({ children, variant = 'default', className = '', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-md border p-4 text-sm ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
