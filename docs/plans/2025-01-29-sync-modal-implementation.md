# Sync Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the StatusPanel component with a modal-based sync UI that shows confirmation, progress with a fancy spinner, and results with action buttons.

**Architecture:** Add modalOpen and hasCompletedSync state to AppContext, create SyncModal component with three internal views (confirm/progress/complete), add BottomActionBar component with sync/reset buttons, remove StatusPanel entirely.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS 3.4, existing shadcn-inspired UI components

**Reference:** [docs/plans/2025-01-29-sync-modal-design.md](../plans/2025-01-29-sync-modal-design.md)

---

### Task 1: Add modal state to AppContext

**Files:**
- Modify: `src/context/app-context.tsx`

**Step 1: Add new state properties**

Add `modalOpen` and `hasCompletedSync` to the AppState interface:

```typescript
interface AppState {
  // ... existing state
  modalOpen: boolean;
  hasCompletedSync: boolean;
}
```

**Step 2: Add to initial state**

```typescript
const initialState: AppState = {
  // ... existing
  modalOpen: false,
  hasCompletedSync: false,
};
```

**Step 3: Add new actions**

Add to the `AppAction` type:

```typescript
type AppAction =
  | { type: "INIT_START" }
  // ... existing actions
  | { type: "OPEN_MODAL" }
  | { type: "CLOSE_MODAL" }
  | { type: "RESET_SYNC_STATE" };
```

**Step 4: Handle actions in reducer**

```typescript
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ... existing cases
    case "OPEN_MODAL":
      return { ...state, modalOpen: true };
    case "CLOSE_MODAL":
      return { ...state, modalOpen: false };
    case "RESET_SYNC_STATE":
      return {
        ...state,
        modalOpen: false,
        hasCompletedSync: false,
        dependencyGraph: null,
        searchedEntryId: null,
        syncProgress: null,
        syncResult: null,
        syncError: null,
      };
    default:
      return state;
  }
}
```

**Step 5: Add actions to context value**

```typescript
interface AppContextValue {
  // ... existing
  openModal: () => void;
  closeModal: () => void;
  resetSyncState: () => void;
}
```

**Step 6: Implement action creators**

```typescript
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [client] = useState(() => new ContentfulClient());

  // ... existing functions

  const openModal = () => {
    dispatch({ type: "OPEN_MODAL" });
  };

  const closeModal = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  const resetSyncState = () => {
    dispatch({ type: "RESET_SYNC_STATE" });
  };

  return (
    <AppContext.Provider
      value={{
        // ... existing
        openModal,
        closeModal,
        resetSyncState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
```

**Step 7: Update executeSync to set hasCompletedSync**

Modify the `SYNC_COMPLETE` case in executeSync:

```typescript
case "SYNC_COMPLETE":
  return { ...state, isSyncing: false, syncResult: action.result, hasCompletedSync: true };
```

**Step 8: Commit**

```bash
git add src/context/app-context.tsx
git commit -m "feat: add modal state to AppContext

Add modalOpen and hasCompletedSync state with OPEN_MODAL, CLOSE_MODAL,
and RESET_SYNC_STATE actions. Update executeSync to set hasCompletedSync
on sync completion."
```

---

### Task 2: Create SyncModal component structure

**Files:**
- Create: `src/components/sync-modal.tsx`

**Step 1: Create the modal shell**

```typescript
import { useAppContext } from "../context";
import { X } from "lucide-react";
import type { SyncProgress, SyncResult } from "../types";

interface SyncModalProps {
  onSyncStart: () => void;
}

export function SyncModal({ onSyncStart }: SyncModalProps) {
  const { state, closeModal, resetSyncState } = useAppContext();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
    }
  };

  // Add escape key listener
  useEffect(() => {
    if (state.modalOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [state.modalOpen]);

  if (!state.modalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2 id="modal-title" className="text-lg font-semibold text-[#1a1a1a]">
            Sync Entries
          </h2>
          <button
            onClick={closeModal}
            className="text-[#9b9b9b] hover:text-[#1a1a1a] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Content will be rendered based on state */}
          {state.isSyncing ? (
            <div>Progress view (next task)</div>
          ) : state.syncResult ? (
            <div>Complete view (next task)</div>
          ) : (
            <div>Confirm view (next task)</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add lucide-react dependency if needed**

Check if lucide-react is installed:

```bash
grep "lucide-react" package.json || npm install lucide-react
```

**Step 3: Commit**

```bash
git add src/components/sync-modal.tsx package.json package-lock.json
git commit -m "feat: create SyncModal shell component

Add modal shell with backdrop click and escape key handling.
Placeholder views for confirm/progress/complete phases."
```

---

### Task 3: Create SyncConfirmView component

**Files:**
- Create: `src/components/sync-confirm-view.tsx`

**Step 1: Create confirm view component**

```typescript
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { DependencyGraph } from "../types";

interface SyncConfirmViewProps {
  dependencyGraph: DependencyGraph | null;
  sourceEnvironment: string | null;
  targetEnvironment: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SyncConfirmView({
  dependencyGraph,
  sourceEnvironment,
  targetEnvironment,
  onConfirm,
  onCancel,
}: SyncConfirmViewProps) {
  const canStart = dependencyGraph && targetEnvironment;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#6b6b6b] mb-1">Summary</h3>
        <p className="text-[#1a1a1a]">
          Ready to sync {dependencyGraph?.entryCount || 0} entries and{" "}
          {dependencyGraph?.assetCount || 0} assets from{" "}
          <span className="font-medium">{sourceEnvironment || "unknown"}</span> to{" "}
          <span className="font-medium">{targetEnvironment || "unknown"}</span>
        </p>
      </div>

      {dependencyGraph && (
        <div className="flex gap-2">
          <Badge variant="entry">
            {dependencyGraph.entryCount} entries
          </Badge>
          <Badge variant="asset">
            {dependencyGraph.assetCount} assets
          </Badge>
        </div>
      )}

      <div className="bg-[#fafafa] rounded-lg p-4 border border-[#e8e8e8]">
        <h4 className="text-sm font-medium text-[#1a1a1a] mb-2">
          What happens next:
        </h4>
        <ul className="text-sm text-[#6b6b6b] space-y-1">
          <li>• Assets will be synced first</li>
          <li>• Entries will be synced in dependency order</li>
          <li>• Circular references will be skipped</li>
        </ul>
      </div>

      {!targetEnvironment && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
          Please select a target environment before syncing.
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={!canStart}>
          Confirm Sync
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sync-confirm-view.tsx
git commit -m "feat: add SyncConfirmView component

Shows sync summary with entry/asset counts, source/target environments,
and confirmation buttons. Includes validation for target environment."
```

---

### Task 4: Create SyncProgressView with fancy spinner

**Files:**
- Create: `src/components/sync-progress-view.tsx`

**Step 1: Create progress view component**

```typescript
import type { SyncProgress } from "../types";

interface SyncProgressViewProps {
  progress: SyncProgress;
}

export function SyncProgressView({ progress }: SyncProgressViewProps) {
  const percentage =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Fancy Spinner */}
      <div className="flex flex-col items-center py-8">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer ring - slow */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" style={{ animationDuration: "3s" }}></div>
          {/* Middle ring - medium */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDuration: "2s" }}></div>
          {/* Inner ring - fast */}
          <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin" style={{ animationDuration: "1.5s" }}></div>
          {/* Center dot */}
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 animate-pulse"></div>
        </div>
      </div>

      {/* Progress Info */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-[#1a1a1a]">{progress.message}</p>
        <p className="text-sm text-[#6b6b6b]">
          {progress.current} / {progress.total}
        </p>
      </div>

      {/* Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 bg-slate-100 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Current Item */}
      {progress.currentItem && (
        <div className="text-xs text-[#9b9b9b] font-mono text-center bg-[#fafafa] rounded-lg p-2 border border-[#e8e8e8]">
          {progress.currentItem}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sync-progress-view.tsx
git commit -m "feat: add SyncProgressView with fancy spinner

Multi-ring animated spinner with gradient colors matching app theme.
Includes progress bar, current/total count, and current item display."
```

---

### Task 5: Create SyncCompleteView component

**Files:**
- Create: `src/components/sync-complete-view.tsx`

**Step 1: Create complete view component**

```typescript
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { SyncResult } from "../types";

interface SyncCompleteViewProps {
  result: SyncResult;
  onClose: () => void;
  onNewSync: () => void;
}

export function SyncCompleteView({
  result,
  onClose,
  onNewSync,
}: SyncCompleteViewProps) {
  const durationSeconds = (result.duration / 1000).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      <div
        className={`flex items-center justify-between p-4 rounded-lg ${
          result.success
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-800"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{result.success ? "✓" : "✗"}</span>
          <span className="font-medium">
            {result.success
              ? "Sync completed successfully"
              : "Sync completed with errors"}
          </span>
        </div>
        <span className="text-sm">{durationSeconds}s</span>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="entry">{result.entriesSynced} entries synced</Badge>
        <Badge variant="asset">{result.assetsSynced} assets synced</Badge>
        {result.skippedCount > 0 && (
          <Badge variant="skipped">{result.skippedCount} skipped</Badge>
        )}
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[#1a1a1a]">
            Errors ({result.errors.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {result.errors.map((error, index) => (
              <div
                key={index}
                className="text-sm p-2 bg-red-50 rounded-md border border-red-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="error" className="text-xs">
                    {error.itemType}
                  </Badge>
                  <span className="font-mono text-xs text-slate-600">
                    {error.itemId}
                  </span>
                </div>
                <p className="text-red-700 text-xs">{error.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onNewSync}>New Sync</Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sync-complete-view.tsx
git commit -m "feat: add SyncCompleteView component

Shows sync result with success/error message, stats badges, errors list,
and Close/New Sync action buttons."
```

---

### Task 6: Wire up all views in SyncModal

**Files:**
- Modify: `src/components/sync-modal.tsx`

**Step 1: Update imports and add views**

```typescript
import { useAppContext } from "../context";
import { X } from "lucide-react";
import { SyncConfirmView } from "./sync-confirm-view";
import { SyncProgressView } from "./sync-progress-view";
import { SyncCompleteView } from "./sync-complete-view";

interface SyncModalProps {
  onSyncStart: () => void;
}

export function SyncModal({ onSyncStart }: SyncModalProps) {
  const { state, closeModal, resetSyncState, executeSync } = useAppContext();

  // ... existing handleBackdropClick, handleEscape, useEffect

  const handleConfirmSync = () => {
    onSyncStart();
  };

  const handleNewSync = () => {
    resetSyncState();
  };

  // ... rest of component

  return (
    // ... modal wrapper
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* ... header */}

        {/* Content */}
        <div className="px-6 py-6">
          {state.isSyncing && state.syncProgress ? (
            <SyncProgressView progress={state.syncProgress} />
          ) : state.syncResult ? (
            <SyncCompleteView
              result={state.syncResult}
              onClose={closeModal}
              onNewSync={handleNewSync}
            />
          ) : (
            <SyncConfirmView
              dependencyGraph={state.dependencyGraph}
              sourceEnvironment={state.sourceEnvironment}
              targetEnvironment={state.targetEnvironment}
              onConfirm={handleConfirmSync}
              onCancel={closeModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sync-modal.tsx
git commit -m "feat: wire up all views in SyncModal

Connect SyncConfirmView, SyncProgressView, and SyncCompleteView
with proper state-based rendering and action handlers."
```

---

### Task 7: Create BottomActionBar component

**Files:**
- Create: `src/components/bottom-action-bar.tsx`

**Step 1: Create bottom action bar component**

```typescript
import { useAppContext } from "../context";
import { Button } from "./ui/button";

export function BottomActionBar() {
  const {
    state,
    openModal,
    resetSyncState,
    executeSync,
  } = useAppContext();

  // Don't render if not connected or no dependency graph
  if (!state.isConnected || !state.dependencyGraph) {
    return null;
  }

  const canSync =
    state.dependencyGraph && state.targetEnvironment && !state.isSyncing;

  const handleSyncClick = () => {
    if (state.hasCompletedSync) {
      // Re-open modal to view results
      openModal();
    } else {
      // Open modal to confirm sync
      openModal();
    }
  };

  const handleReset = () => {
    resetSyncState();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e8e8e8] backdrop-blur-sm bg-white/95">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={state.modalOpen}
        >
          Reset
        </Button>

        <Button
          onClick={handleSyncClick}
          disabled={!canSync}
          loading={state.isSyncing && state.modalOpen}
        >
          {state.hasCompletedSync ? "View Results" : "Start Sync"}
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/bottom-action-bar.tsx
git commit -m "feat: add BottomActionBar component

Fixed bottom bar with Reset and Start Sync/View Results buttons.
Sync button text changes based on hasCompletedSync state.
Both buttons disabled appropriately."
```

---

### Task 8: Update App.tsx to use new components

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update imports**

```typescript
import { AppProvider, useAppContext } from "./context";
import { ConfigurationPanel } from "./components/configuration-panel";
import { EnvironmentSelector } from "./components/environment-selector";
import { SearchPanel } from "./components/search-panel";
import { PreviewPanel } from "./components/preview-panel";
import { SyncModal } from "./components/sync-modal";
import { BottomActionBar } from "./components/bottom-action-bar";
import { Button } from "./components/ui/button";
```

**Step 2: Remove StatusPanel import**

Remove: `import { StatusPanel } from "./components/status-panel";`

**Step 3: Update AppContent to use SyncModal**

```typescript
function AppContent() {
  const { state, reset, executeSync } = useAppContext();

  // ... existing handleDisconnect

  // ... existing skeleton loader

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* ... existing header */}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {!state.isConnected && <ConfigurationPanel />}
        {state.isConnected && (
          <>
            <EnvironmentSelector />
            <SearchPanel />
            <PreviewPanel />
          </>
        )}
      </main>

      {/* Bottom Action Bar */}
      {state.isConnected && <BottomActionBar />}

      {/* Sync Modal */}
      <SyncModal onSyncStart={executeSync} />

      {/* ... existing footer */}
    </div>
  );
}
```

**Step 4: Add bottom padding to main container**

Added `pb-20` to the main div to account for the fixed bottom bar.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate SyncModal and BottomActionBar

Replace StatusPanel with SyncModal and BottomActionBar.
Add bottom padding to account for fixed bottom bar.
Remove StatusPanel from render tree."
```

---

### Task 9: Remove sync button from PreviewPanel

**Files:**
- Modify: `src/components/preview-panel.tsx`

**Step 1: Remove sync button code**

Remove the sync button section at the bottom:

```typescript
import { useAppContext } from "../context";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert } from "./ui/alert";
import { DependencyTree } from "./dependency-tree";

export function PreviewPanel() {
  const { state } = useAppContext();

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
          <div className="text-center py-12 text-[#9b9b9b]">
            <svg className="w-12 h-12 mx-auto mb-3 text-[#d4d4d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search for an entry to preview its dependencies
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto scrollbar-thin border border-[#e8e8e8] rounded-lg p-4 bg-[#fafafa]">
            <DependencyTree root={state.dependencyGraph.root} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/preview-panel.tsx
git commit -m "refactor: remove sync button from PreviewPanel

Sync button moved to BottomActionBar. PreviewPanel now only
displays the dependency tree."
```

---

### Task 10: Delete StatusPanel and related components

**Files:**
- Delete: `src/components/status-panel.tsx`
- Delete: `src/components/sync-progress.tsx` (if still exists after refactor)
- Delete: `src/components/sync-results.tsx` (if still exists after refactor)

**Step 1: Delete old components**

```bash
rm src/components/status-panel.tsx
rm src/components/sync-progress.tsx
rm src/components/sync-results.tsx
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: delete StatusPanel and old sync components

Remove StatusPanel, SyncProgressDisplay, and SyncResults
as functionality moved to SyncModal."
```

---

### Task 11: Verify implementation and run tests

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 2: Run linting**

```bash
npm run lint
```

Expected: No lint errors

**Step 3: Run tests**

```bash
npm run test:run
```

Expected: All tests pass (23 tests)

**Step 4: Build the application**

```bash
npm run build
```

Expected: Clean build

**Step 5: Start dev server and test manually**

```bash
npm run dev
```

Manual testing checklist:
- [ ] Click "Start Sync" opens modal with confirm view
- [ ] Modal shows correct entry/asset counts
- [ ] Confirm button disabled when no target env
- [ ] Clicking confirm starts sync
- [ ] Progress view shows fancy spinner and progress
- [ ] Complete view shows results
- [ ] "New Sync" resets state
- [ ] "Close" closes modal
- [ ] "View Results" re-opens modal
- [ ] Reset button works
- [ ] Reset disabled when modal open
- [ ] Backdrop click closes modal
- [ ] Escape key closes modal
- [ ] Modal closes during sync, continues in background

**Step 6: Commit final implementation**

```bash
git add .
git commit -m "feat: complete sync modal implementation

All functionality implemented and tested manually.
Modal-based sync UI replaces StatusPanel component."
```

---

## Summary

This plan creates a complete modal-based sync UI with:

1. **State management** - New modalOpen and hasCompletedSync state
2. **Modal component** - Three-phase modal (confirm/progress/complete)
3. **Bottom action bar** - Fixed bar with sync/reset buttons
4. **Fancy spinner** - Multi-ring animated spinner with gradient colors
5. **Clean integration** - Removes StatusPanel, integrates with existing components

**Total commits:** ~11 commits following TDD principles with frequent commits.
