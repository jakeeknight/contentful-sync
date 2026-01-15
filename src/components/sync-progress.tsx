import type { SyncProgress } from '../types'

interface SyncProgressDisplayProps {
  progress: SyncProgress
}

export function SyncProgressDisplay({ progress }: SyncProgressDisplayProps) {
  const percentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{progress.message}</span>
        <span className="text-slate-500">{progress.current}/{progress.total}</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 bg-slate-100 rounded-full overflow-hidden"
      >
        <div
          className={`h-full transition-all duration-300 ${
            progress.phase === 'complete' ? 'bg-green-500' :
            progress.phase === 'error' ? 'bg-red-500' :
            'bg-slate-900'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {progress.currentItem && (
        <div className="text-xs text-slate-500 font-mono">
          Current: {progress.currentItem}
        </div>
      )}
    </div>
  )
}
