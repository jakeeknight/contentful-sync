import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProvider } from '../app-context'
import { useAppContext } from '../use-app-context'

function TestConsumer() {
  const { state, connect, setSourceEnv, setTargetEnv } = useAppContext()
  return (
    <div>
      <span data-testid="connected">{String(state.isConnected)}</span>
      <span data-testid="source">{state.sourceEnvironment || 'none'}</span>
      <span data-testid="target">{state.targetEnvironment || 'none'}</span>
      <button onClick={() => connect('space', 'token')}>Connect</button>
      <button onClick={() => setSourceEnv('master')}>Set Source</button>
      <button onClick={() => setTargetEnv('dev')}>Set Target</button>
    </div>
  )
}

describe('AppContext', () => {
  it('provides initial state', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    expect(screen.getByTestId('connected')).toHaveTextContent('false')
    expect(screen.getByTestId('source')).toHaveTextContent('none')
    expect(screen.getByTestId('target')).toHaveTextContent('none')
  })

  it('throws when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow()
    consoleError.mockRestore()
  })
})
