import { useAppContext } from "../context";
import { Button } from "./ui/button";

export function BottomActionBar() {
  const {
    state,
    openModal,
    resetSyncState,
  } = useAppContext();

  // Don't render if not connected or no dependency graph
  if (!state.isConnected || !state.dependencyGraph) {
    return null;
  }

  const canSync =
    state.dependencyGraph && state.targetEnvironment && !state.isSyncing;

  const handleSyncClick = () => {
    openModal();
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
