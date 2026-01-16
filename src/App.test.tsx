import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    setSourceEnvironment: vi.fn(),
    setTargetEnvironment: vi.fn()
  })),
  DependencyResolver: vi.fn(),
  SyncEngine: vi.fn()
}))

describe('App', () => {
  it('renders the application title', () => {
    render(<App />)
    expect(screen.getByText(/contentful sync tool/i)).toBeInTheDocument()
  })

  it('renders configuration panel', () => {
    render(<App />)
    expect(screen.getByText(/configuration/i)).toBeInTheDocument()
  })

  it('renders search panel', () => {
    render(<App />)
    expect(screen.getByText(/search entry/i)).toBeInTheDocument()
  })

  it('renders preview panel', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /preview/i })).toBeInTheDocument()
  })

  it('renders status panel', () => {
    render(<App />)
    expect(screen.getByText(/status/i)).toBeInTheDocument()
  })
})
