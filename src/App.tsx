import { AppProvider, useAppContext } from "./context";
import { ConfigurationPanel } from "./components/configuration-panel";
import { EnvironmentSelector } from "./components/environment-selector";
import { SearchPanel } from "./components/search-panel";
import { PreviewPanel } from "./components/preview-panel";
import { SyncModal } from "./components/sync-modal";
import { Button } from "./components/ui/button";

const STORAGE_KEY = "contentful-sync-credentials";

function AppContent() {
  const { state, reset } = useAppContext();

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    reset();
  };

  // Skeleton loader for initialization
  if (state.isInitializing) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <header className="bg-white border-b border-[#e8e8e8] sticky top-0 z-10 backdrop-blur-sm bg-white/95">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#1a1a1a] tracking-tight">
                  Contentful Sync
                </h1>
                <p className="text-xs text-[#6b6b6b]">Environment Sync Tool</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Skeleton cards */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-[#e8e8e8] p-6 animate-pulse"
            >
              <div className="h-6 bg-[#f0f0f0] rounded w-1/4 mb-4" />
              <div className="h-4 bg-[#f0f0f0] rounded w-full mb-2" />
              <div className="h-4 bg-[#f0f0f0] rounded w-3/4" />
            </div>
          ))}
        </main>

        <footer className="border-t border-[#e8e8e8] mt-auto py-6">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-[#9b9b9b]">
            Internal tool for Contentful environment synchronization
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e8e8] sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#1a1a1a] tracking-tight">
                Contentful Sync
              </h1>
              <p className="text-xs text-[#6b6b6b]">Environment Sync Tool</p>
            </div>
          </div>
          {state.isConnected && (
            <Button
              variant="secondary"
              onClick={handleDisconnect}
              className="text-sm"
            >
              Disconnect
            </Button>
          )}
        </div>
      </header>

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

      {/* Sync Modal */}
      <SyncModal />

      {/* Footer */}
      <footer className="border-t border-[#e8e8e8] mt-auto py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-[#9b9b9b]">
          Internal tool for Contentful environment synchronization
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
