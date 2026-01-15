import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchPanel } from '../search-panel'
import { AppProvider } from '../../context'

vi.mock('../../services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    setSourceEnvironment: vi.fn(),
    setTargetEnvironment: vi.fn(),
    getEntry: vi.fn()
  })),
  DependencyResolver: vi.fn().mockImplementation(() => ({
    resolve: vi.fn()
  })),
  SyncEngine: vi.fn()
}))

describe('SearchPanel', () => {
  it('renders entry ID input', () => {
    render(
      <AppProvider>
        <SearchPanel />
      </AppProvider>
    )
    expect(screen.getByLabelText(/entry id/i)).toBeInTheDocument()
  })

  it('renders search button', () => {
    render(
      <AppProvider>
        <SearchPanel />
      </AppProvider>
    )
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('disables search when not connected or no source environment', () => {
    render(
      <AppProvider>
        <SearchPanel />
      </AppProvider>
    )
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })
})
