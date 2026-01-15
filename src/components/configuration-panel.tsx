import { useState } from 'react'
import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Select, type SelectOption } from './ui/select'
import { Button } from './ui/button'
import { Alert } from './ui/alert'
import { Badge } from './ui/badge'

export function ConfigurationPanel() {
  const { state, connect, setSourceEnv, setTargetEnv } = useAppContext()
  const [spaceId, setSpaceId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const handleConnect = async () => {
    await connect(spaceId, accessToken)
  }

  const environmentOptions: SelectOption[] = state.environments.map(env => ({
    value: env.sys.id,
    label: env.name
  }))

  const canConnect = spaceId.trim() !== '' && accessToken.trim() !== ''

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Configuration</CardTitle>
          {state.isConnected && (
            <Badge variant="success">Connected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!state.isConnected ? (
            <>
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
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Source Environment (From)"
                options={environmentOptions}
                placeholder="Select source"
                value={state.sourceEnvironment || ''}
                onChange={(e) => setSourceEnv(e.target.value)}
              />
              <Select
                label="Target Environment (To)"
                options={environmentOptions}
                placeholder="Select target"
                value={state.targetEnvironment || ''}
                onChange={(e) => setTargetEnv(e.target.value)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
