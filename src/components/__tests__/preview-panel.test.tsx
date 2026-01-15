import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PreviewPanel } from '../preview-panel'
import { AppProvider } from '../../context'

vi.mock('../../services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({})),
  DependencyResolver: vi.fn(),
  SyncEngine: vi.fn()
}))

describe('PreviewPanel', () => {
  it('shows empty state when no graph', () => {
    render(
      <AppProvider>
        <PreviewPanel />
      </AppProvider>
    )
    expect(screen.getByText(/search for an entry/i)).toBeInTheDocument()
  })
})
