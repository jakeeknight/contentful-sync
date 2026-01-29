import { type ButtonHTMLAttributes, type ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'destructive' | 'info'
  loading?: boolean
}

const variantStyles = {
  primary: `
    bg-[#1a1a1a] text-white
    hover:bg-[#2a2a2a]
    shadow-sm
    border border-transparent
  `,
  secondary: `
    bg-white text-[#1a1a1a]
    border border-[#e8e8e8]
    hover:bg-[#fafafa] hover:border-[#d4d4d4]
    shadow-sm
  `,
  destructive: `
    bg-[#dc2626] text-white
    hover:bg-[#b91c1c]
    shadow-sm
  `,
  info: `
    bg-[#4f46e5] text-white
    hover:bg-[#4338ca]
    shadow-sm
  `
}

const baseStyles = `
  inline-flex items-center justify-center gap-2
  rounded-lg px-4 py-2.5 text-sm font-medium
  transition-all duration-200 ease-out
  focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2
  active:scale-[0.98]
  font-family var(--font-body)
`

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray="32"
            strokeDashoffset="32"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
