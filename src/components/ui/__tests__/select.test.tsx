import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '../select'

describe('Select', () => {
  const options = [
    { value: 'master', label: 'Master' },
    { value: 'dev', label: 'Development' }
  ]

  it('renders options', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Master')).toBeInTheDocument()
    expect(screen.getByText('Development')).toBeInTheDocument()
  })

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn()
    render(<Select options={options} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dev' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('renders with label', () => {
    render(<Select options={options} label="Environment" />)
    expect(screen.getByText('Environment')).toBeInTheDocument()
  })

  it('shows placeholder option', () => {
    render(<Select options={options} placeholder="Select environment" />)
    expect(screen.getByText('Select environment')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Select options={options} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
