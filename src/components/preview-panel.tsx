import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert } from './ui/alert'
import { DependencyTree } from './dependency-tree'

export function PreviewPanel() {
  const { state, executeSync } = useAppContext()

  const canSync = state.dependencyGraph && state.targetEnvironment && !state.isSyncing

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Preview</CardTitle>
          {state.dependencyGraph && (
            <div className="flex gap-2">
              <Badge variant="entry">
                {state.dependencyGraph.entryCount} entries
              </Badge>
              <Badge variant="asset">
                {state.dependencyGraph.assetCount} assets
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!state.dependencyGraph ? (
          <div className="text-center py-8 text-slate-500">
            Search for an entry to preview its dependencies
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-md p-4">
              <DependencyTree root={state.dependencyGraph.root} />
            </div>

            {!state.targetEnvironment && (
              <Alert>Select a target environment to sync</Alert>
            )}

            <div className="flex justify-end">
              <Button
                onClick={executeSync}
                disabled={!canSync}
                loading={state.isSyncing}
              >
                {state.isSyncing ? 'Syncing...' : 'Sync Selected'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
