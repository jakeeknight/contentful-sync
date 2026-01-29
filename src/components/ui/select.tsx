import { type SelectHTMLAttributes, forwardRef } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[]
  label?: string
  placeholder?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, label, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#1a1a1a]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full rounded-lg border border-[#e8e8e8] px-3.5 py-2.5 text-sm
            bg-white
            focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 focus:border-[#4f46e5]
            hover:border-[#d4d4d4]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 ease-out
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'
