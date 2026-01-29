import { type HTMLAttributes, type ReactNode } from 'react'

type AlertVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: AlertVariant
}

const variantStyles: Record<AlertVariant, string> = {
  default: 'bg-[#fafafa] border-[#e8e8e8] text-[#1a1a1a]',
  success: 'bg-[#ecfdf3] border-[#d1fae5] text-[#047857]',
  error: 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]',
  warning: 'bg-[#fffbeb] border-[#fde68a] text-[#d97706]',
  info: 'bg-[#f0f9ff] border-[#bae6fd] text-[#0284c7]'
}

export function Alert({ children, variant = 'default', className = '', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={`
        rounded-lg border p-4 text-sm
        ${variantStyles[variant]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </div>
  )
}
