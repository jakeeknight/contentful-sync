import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>test badge</Badge>)
    expect(screen.getByText('test badge')).toBeInTheDocument()
  })

  it('applies default variant styles', () => {
    render(<Badge>default</Badge>)
    const badge = screen.getByText('default')
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-700')
  })

  it('applies entry variant styles', () => {
    render(<Badge variant="entry">entry</Badge>)
    const badge = screen.getByText('entry')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
  })

  it('applies asset variant styles', () => {
    render(<Badge variant="asset">asset</Badge>)
    const badge = screen.getByText('asset')
    expect(badge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('applies success variant styles', () => {
    render(<Badge variant="success">success</Badge>)
    const badge = screen.getByText('success')
    expect(badge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('applies error variant styles', () => {
    render(<Badge variant="error">error</Badge>)
    const badge = screen.getByText('error')
    expect(badge).toHaveClass('bg-red-100', 'text-red-700')
  })

  it('should render skipped variant with amber colors', () => {
    render(<Badge variant="skipped">skipped</Badge>)
    const badge = screen.getByText('skipped')
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-700')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">custom</Badge>)
    const badge = screen.getByText('custom')
    expect(badge).toHaveClass('custom-class')
  })
})
