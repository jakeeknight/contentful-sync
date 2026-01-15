import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigurationPanel } from '../configuration-panel'
import { AppProvider } from '../../context'

// Mock the services
vi.mock('../../services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue({ success: true, environments: [{ sys: { id: 'master' }, name: 'master' }] }),
    setSourceEnvironment: vi.fn().mockResolvedValue(true),
    setTargetEnvironment: vi.fn().mockResolvedValue(true)
  })),
  DependencyResolver: vi.fn(),
  SyncEngine: vi.fn()
}))

describe('ConfigurationPanel', () => {
  it('renders space ID and access token inputs', () => {
    render(
      <AppProvider>
        <ConfigurationPanel />
      </AppProvider>
    )
    expect(screen.getByLabelText(/space id/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/access token/i)).toBeInTheDocument()
  })

  it('renders connect button', () => {
    render(
      <AppProvider>
        <ConfigurationPanel />
      </AppProvider>
    )
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
  })

  it('disables connect button when fields are empty', () => {
    render(
      <AppProvider>
        <ConfigurationPanel />
      </AppProvider>
    )
    expect(screen.getByRole('button', { name: /connect/i })).toBeDisabled()
  })
})
