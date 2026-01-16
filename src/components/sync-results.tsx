import type { SyncResult } from '../types'
import { Alert } from './ui/alert'
import { Badge } from './ui/badge'

interface SyncResultsProps {
  result: SyncResult
}

export function SyncResults({ result }: SyncResultsProps) {
  const durationSeconds = (result.duration / 1000).toFixed(1)

  return (
    <div className="space-y-4">
      <Alert variant={result.success ? 'success' : 'error'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{result.success ? '✓' : '✗'}</span>
            <span className="font-medium">
              {result.success ? 'Sync completed successfully' : 'Sync completed with errors'}
            </span>
          </div>
          <span className="text-sm">{durationSeconds}s</span>
        </div>
      </Alert>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="entry">{result.entriesSynced} entries synced</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="asset">{result.assetsSynced} assets synced</Badge>
        </div>
        {result.skippedCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="skipped">{result.skippedCount} skipped</Badge>
            <span className="text-xs text-slate-500">(content type loops)</span>
          </div>
        )}
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Errors ({result.errors.length})</h4>
          <div className="space-y-1">
            {result.errors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded-md"
              >
                <Badge variant="error">{error.itemType}</Badge>
                <span className="font-mono text-slate-600">{error.itemId}</span>
                <span className="text-red-700">{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
