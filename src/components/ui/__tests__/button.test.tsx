import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByText('Submit')).toBeInTheDocument()
    // Should have reduced opacity or spinner
    expect(screen.getByRole('button')).toHaveClass('opacity-50')
  })

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-slate-900')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-white')

    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-500')
  })
})
