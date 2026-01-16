import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncResults } from '../sync-results'
import type { SyncResult } from '../../types'

describe('SyncResults', () => {
  it('shows success message when no errors', () => {
    const result: SyncResult = {
      success: true,
      entriesSynced: 5,
      assetsSynced: 2,
      skippedCount: 0,
      errors: [],
      duration: 1500
    }
    render(<SyncResults result={result} />)
    expect(screen.getByText(/success/i)).toBeInTheDocument()
    expect(screen.getByText(/5 entries/i)).toBeInTheDocument()
    expect(screen.getByText(/2 assets/i)).toBeInTheDocument()
  })

  it('shows errors when present', () => {
    const result: SyncResult = {
      success: false,
      entriesSynced: 3,
      assetsSynced: 1,
      skippedCount: 0,
      errors: [
        { itemId: 'entry-1', itemType: 'entry', message: 'Network error' }
      ],
      duration: 2000
    }
    render(<SyncResults result={result} />)
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('shows duration', () => {
    const result: SyncResult = {
      success: true,
      entriesSynced: 1,
      assetsSynced: 0,
      skippedCount: 0,
      errors: [],
      duration: 1500
    }
    render(<SyncResults result={result} />)
    expect(screen.getByText(/1\.5s/i)).toBeInTheDocument()
  })

  it('should display skipped count when entries were skipped', () => {
    const result: SyncResult = {
      success: true,
      entriesSynced: 5,
      assetsSynced: 2,
      skippedCount: 3,
      errors: [],
      duration: 1500
    }

    render(<SyncResults result={result} />)

    expect(screen.getByText('3 skipped')).toBeInTheDocument()
    expect(screen.getByText(/content type loop/i)).toBeInTheDocument()
  })
})
