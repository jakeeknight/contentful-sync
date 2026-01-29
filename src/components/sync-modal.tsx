import { useAppContext } from "../context";
import { X } from "lucide-react";
import { useEffect } from "react";
import { SyncConfirmView } from "./sync-confirm-view";
import { SyncProgressView } from "./sync-progress-view";
import { SyncCompleteView } from "./sync-complete-view";

interface SyncModalProps {
  onSyncStart: () => void;
}

export function SyncModal({ onSyncStart }: SyncModalProps) {
  const { state, closeModal, resetSyncState, executeSync } = useAppContext();

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

  useEffect(() => {
    if (state.modalOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [state.modalOpen]);

  const handleConfirmSync = () => {
    onSyncStart();
  };

  const handleNewSync = () => {
    resetSyncState();
  };

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
