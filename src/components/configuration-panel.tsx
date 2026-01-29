import { useState, useEffect } from 'react'
import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Alert } from './ui/alert'

const STORAGE_KEY = 'contentful-sync-credentials'

export function ConfigurationPanel() {
  const { state, connect } = useAppContext()
  const [spaceId, setSpaceId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  // Load saved credentials from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { spaceId: savedSpaceId, accessToken: savedAccessToken } = JSON.parse(saved)
        if (savedSpaceId) setSpaceId(savedSpaceId)
        if (savedAccessToken) setAccessToken(savedAccessToken)
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, [])

  const handleConnect = async () => {
    await connect(spaceId, accessToken)
    // Save to localStorage on successful connection
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ spaceId, accessToken }))
  }

  const canConnect = spaceId.trim() !== '' && accessToken.trim() !== ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect to Contentful</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Space ID"
              placeholder="Enter your Contentful Space ID"
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              disabled={state.isConnecting}
            />
            <Input
              label="Access Token"
              type="password"
              placeholder="Content Management API Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={state.isConnecting}
            />
          </div>
          <Button
            onClick={handleConnect}
            disabled={!canConnect}
            loading={state.isConnecting}
          >
            Connect
          </Button>
          {state.connectionError && (
            <Alert variant="error">{state.connectionError}</Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
