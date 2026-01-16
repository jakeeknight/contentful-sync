import { type HTMLAttributes, type ReactNode } from 'react'

type BadgeVariant = 'default' | 'entry' | 'asset' | 'success' | 'error' | 'skipped'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  entry: 'bg-blue-100 text-blue-700',
  asset: 'bg-green-100 text-green-700',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  skipped: 'bg-amber-100 text-amber-700'
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
