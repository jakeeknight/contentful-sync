import { type HTMLAttributes, type ReactNode } from 'react'

type BadgeVariant = 'default' | 'entry' | 'asset' | 'success' | 'error' | 'skipped'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#f5f5f5] text-[#6b6b6b] border border-[#e8e8e8]',
  entry: 'bg-[#eef2ff] text-[#4f46e5] border border-[#e0e7ff]',
  asset: 'bg-[#ecfdf3] text-[#047857] border border-[#d1fae5]',
  success: 'bg-[#ecfdf3] text-[#047857] border border-[#d1fae5]',
  error: 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]',
  skipped: 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        rounded-full px-2.5 py-1
        text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </span>
  )
}
