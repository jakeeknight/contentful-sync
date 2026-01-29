import { type InputHTMLAttributes, forwardRef, useId } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[#1a1a1a]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full rounded-lg border px-3.5 py-2.5 text-sm
            placeholder:text-[#9b9b9b]
            focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 focus:border-[#4f46e5]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 ease-out
            bg-white
            ${error ? 'border-[#dc2626] focus:ring-[#dc2626] focus:border-[#dc2626]' : 'border-[#e8e8e8] hover:border-[#d4d4d4]'}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {error && (
          <p className="text-sm text-[#dc2626]">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
