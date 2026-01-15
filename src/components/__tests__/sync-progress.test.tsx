import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncProgressDisplay } from '../sync-progress'
import type { SyncProgress } from '../../types'

describe('SyncProgressDisplay', () => {
  it('shows progress message', () => {
    const progress: SyncProgress = {
      phase: 'syncing',
      current: 3,
      total: 10,
      currentItem: 'entry-123',
      message: 'Syncing entry: entry-123'
    }
    render(<SyncProgressDisplay progress={progress} />)
    expect(screen.getByText(/syncing entry/i)).toBeInTheDocument()
  })

  it('shows progress bar', () => {
    const progress: SyncProgress = {
      phase: 'syncing',
      current: 5,
      total: 10,
      message: 'Syncing...'
    }
    render(<SyncProgressDisplay progress={progress} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows completion state', () => {
    const progress: SyncProgress = {
      phase: 'complete',
      current: 10,
      total: 10,
      message: 'Sync complete'
    }
    render(<SyncProgressDisplay progress={progress} />)
    expect(screen.getByText(/complete/i)).toBeInTheDocument()
  })
})
