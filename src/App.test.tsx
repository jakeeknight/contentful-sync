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
    expect(screen.getByText(/contentful sync/i)).toBeInTheDocument()
  })

  it('renders connect to contentful panel when not connected', () => {
    render(<App />)
    expect(screen.getByText(/connect to contentful/i)).toBeInTheDocument()
  })
})
