import { useState } from 'react'
import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Alert } from './ui/alert'

export function SearchPanel() {
  const { state, resolveEntry } = useAppContext()
  const [entryId, setEntryId] = useState('')

  const handleSearch = async () => {
    if (entryId.trim()) {
      await resolveEntry(entryId.trim())
    }
  }

  const canSearch = state.isConnected && state.sourceEnvironment && entryId.trim() !== ''

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSearch) {
      handleSearch()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Entry ID"
                placeholder="Enter Contentful entry ID"
                value={entryId}
                onChange={(e) => setEntryId(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={state.isResolving}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={!canSearch}
                loading={state.isResolving}
              >
                Search
              </Button>
            </div>
          </div>

          {!state.isConnected && (
            <Alert variant="info">Connect to Contentful to search for entries</Alert>
          )}

          {state.isConnected && !state.sourceEnvironment && (
            <Alert variant="info">Select a source environment to search</Alert>
          )}

          {state.resolveError && (
            <Alert variant="error">{state.resolveError}</Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
