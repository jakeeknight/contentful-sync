import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { SyncProgressDisplay } from './sync-progress'
import { SyncResults } from './sync-results'

export function StatusPanel() {
  const { state } = useAppContext()

  const showProgress = state.isSyncing && state.syncProgress
  const showResults = !state.isSyncing && state.syncResult

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent>
        {showProgress && state.syncProgress && (
          <SyncProgressDisplay progress={state.syncProgress} />
        )}

        {showResults && state.syncResult && (
          <SyncResults result={state.syncResult} />
        )}

        {!showProgress && !showResults && (
          <div className="text-center py-4 text-slate-500">
            Ready to sync. Search for an entry and click "Sync Selected" to begin.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
