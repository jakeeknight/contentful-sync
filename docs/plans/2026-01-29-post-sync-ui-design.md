# Post-Sync UI with Reset - Design

## Overview

After a sync completes successfully, the UI transitions to a "results view" that focuses on the sync outcome. The `EnvironmentSelector` remains visible so users can see (and potentially change) which environments were involved, but `SearchPanel` and `PreviewPanel` are hidden since they're no longer relevant after the sync is done.

A Reset button inside `StatusPanel` allows users to start fresh—keeping their connection but clearing all sync-related state (results, dependency graph, searched entry).

## State Changes

The existing `syncResult: SyncResult | null` in `AppState` already indicates when a sync is complete. No new state is needed—we'll use `state.syncResult !== null` as the condition for showing the "sync complete" UI.

## Component Changes

### [App.tsx](../../src/App.tsx)

Add conditional rendering for post-sync state:

- When `state.syncResult` exists: show only `EnvironmentSelector` and `StatusPanel`
- When `state.syncResult` is null: show `EnvironmentSelector`, `SearchPanel`, `PreviewPanel`, and `StatusPanel` (current behavior)

### [StatusPanel.tsx](../../src/components/status-panel.tsx)

Add Reset button:

- Add a Reset button inside the card that appears when `showResults` is true
- Button calls the new `resetSync()` function from `useAppContext()`
- Use the existing `Button` component with appropriate styling (primary or secondary)

## Data Flow

1. User clicks Reset button in `StatusPanel`
2. `resetSync()` from `AppContext` dispatches `RESET_SYNC` action
3. Reducer clears sync-related state while preserving connection
4. All components re-render with cleared state

## New Action Type

Add a `RESET_SYNC` action that clears sync state but preserves connection:

```typescript
type AppAction =
  | { type: "RESET_SYNC" }
  // ... existing actions
```

**Reducer behavior for `RESET_SYNC`:**
- Keep: `isConnected`, `environments`, `sourceEnvironment`, `targetEnvironment`
- Clear: `searchedEntryId`, `dependencyGraph`, `isResolving`, `resolveError`, `isSyncing`, `syncProgress`, `syncResult`, `syncError`

**Context API:** Add `resetSync()` function alongside `reset()`

## Testing Considerations

- **App.tsx**: Test that SearchPanel/PreviewPanel are hidden when syncResult exists
- **StatusPanel**: Test Reset button appears and calls `resetSync()` when clicked
- **AppContext**: Test `RESET_SYNC` action clears sync state but preserves connection state

## Edge Cases

- **Sync error vs. success**: Reset should be available after errors too (syncError also gets cleared)
- **Sync in progress**: Reset button only shows when `!state.isSyncing && state.syncResult` — no conflict
