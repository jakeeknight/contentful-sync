import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPanel } from '../status-panel'
import { AppProvider } from '../../context'

vi.mock('../../services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({})),
  DependencyResolver: vi.fn(),
  SyncEngine: vi.fn()
}))

describe('StatusPanel', () => {
  it('shows empty state when no progress or result', () => {
    render(
      <AppProvider>
        <StatusPanel />
      </AppProvider>
    )
    expect(screen.getByText(/status/i)).toBeInTheDocument()
  })
})
