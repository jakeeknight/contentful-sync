# Sync Modal Design

## Overview

Replace the current StatusPanel with a modal-based sync UI. Users click a "Start Sync" button at the bottom of the page, which opens a modal. The modal shows a confirmation summary first, then progress with a fancy spinner during sync, and finally results with options to close or start a new sync.

## Architecture & State Management

### State Additions

```typescript
interface AppState {
  // ... existing state
  modalOpen: boolean
  hasCompletedSync: boolean
}
```

### New Actions

- `OPEN_MODAL` - Opens the sync modal
- `CLOSE_MODAL` - Closes the sync modal
- `RESET_SYNC_STATE` - Clears sync-related state for "New Sync"

### Modal Phases

1. **Confirm** - Shows summary of what will be synced (entries, assets, source → target env)
2. **Progress** - Shows animated spinner, progress bar, current item, and phase message
3. **Complete** - Shows success/error state, stats, and action buttons (Close / New Sync)

## Component Structure

### New Components

| Component | Purpose |
|-----------|---------|
| `SyncModal` | Main modal with internal state machine for three phases |
| `BottomActionBar` | Fixed bottom bar with sync/reset buttons |
| `SyncConfirmView` | Summary before sync starts |
| `SyncProgressView` | Progress with fancy spinner (refactor existing) |
| `SyncCompleteView` | Results with action buttons (refactor existing) |

### Components to Delete

- `src/components/status-panel.tsx` - Functionality moves to modal

### Components to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Remove StatusPanel, add BottomActionBar |
| `src/components/preview-panel.tsx` | Remove sync button (moved to bottom bar) |
| `src/context/app-context.tsx` | Add modalOpen, hasCompletedSync state and actions |

## Data Flow & State Transitions

```
Initial → Modal Open (Confirm)
  User clicks "Start Sync" → dispatch OPEN_MODAL

Modal Confirm → Syncing
  User clicks "Confirm Sync" → call executeSync() → dispatch SYNC_START

Syncing → Complete
  Sync finishes → dispatch SYNC_COMPLETE + set hasCompletedSync: true

Any State → Modal Closed
  Backdrop click/Escape/close button → dispatch CLOSE_MODAL

Complete → Reset
  User clicks "New Sync" OR "Reset" button → dispatch RESET_SYNC_STATE
```

### Button States

- **"Start Sync"** shown when: `hasCompletedSync === false` AND modal closed
- **"View Results"** shown when: `hasCompletedSync === true` AND modal closed
- **Disabled** when: `isSyncing === true` AND modal closed (defensive)

### Modal View Logic

| View | Condition |
|------|-----------|
| Confirm | `modalOpen && !isSyncing && !syncResult` |
| Progress | `modalOpen && isSyncing` |
| Complete | `modalOpen && !isSyncing && syncResult` |

### Enabling Conditions

- Sync button enabled: `dependencyGraph && targetEnvironment && !isSyncing`
- Reset button enabled: `!modalOpen`

## UI Design

### Fancy Spinner

- 3 concentric circles with indigo-purple gradient border
- `animate-spin` with different durations (3s, 2s, 1.5s)
- Pulsing center dot with `animate-ping`
- Gradient: `bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]`

### Bottom Action Bar

- Fixed position: `fixed bottom-0 left-0 right-0`
- White background with `border-t border-[#e8e8e8]`
- Backdrop blur: `backdrop-blur-sm bg-white/95`
- Padding: `px-6 py-4`
- Max-width wrapper to match main content
- Left: Reset button
- Right: Start Sync / View Results button

### Modal Behavior

- Closes on: backdrop click, Escape key, close button
- Only sync button can re-open it during sync
- Reset disabled while modal is open

## Error Handling

### During Sync

If sync fails, the Complete view shows both success stats AND errors. Users can still close or start a new sync - errors don't trap them.

### Modal Open + External State Change

If dependency graph is cleared externally while modal is open, modal closes automatically.

### Sync Interrupted

If user closes modal during sync (Escape/backdrop), sync continues in background. Clicking "View Results" re-opens modal showing current progress or completed state.

### Race Condition Protection

- Debounce "Start Sync" clicks to prevent multiple modal opens
- `executeSync` checks if already syncing before starting

### Validation Errors

If target environment becomes deselected while modal is in Confirm view, show error and disable "Confirm Sync" button.

### Accessibility

- Trap focus within modal when open
- Escape key closes modal
- ARIA labels for spinner and progress bar
- Announce phase changes to screen readers

## Implementation Notes

- No unit tests required (per requirements)
- Use existing UI components (Button, Alert, Badge, Card)
- Reuse existing `SyncProgress` and `SyncResult` types
- Modal should block interaction with main content (overlay with backdrop)
