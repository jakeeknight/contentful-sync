import { AppProvider, useAppContext } from "./context";
import { ConfigurationPanel } from "./components/configuration-panel";
import { EnvironmentSelector } from "./components/environment-selector";
import { SearchPanel } from "./components/search-panel";
import { PreviewPanel } from "./components/preview-panel";
import { StatusPanel } from "./components/status-panel";
import { Button } from "./components/ui/button";

const STORAGE_KEY = "contentful-sync-credentials";

function AppContent() {
  const { state, reset } = useAppContext();

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    reset();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">
            Contentful Sync Tool
          </h1>
          {state.isConnected && (
            <Button variant="info" onClick={handleDisconnect}>
              Disconnect
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {!state.isConnected && <ConfigurationPanel />}
        {state.isConnected && (
          <>
            <EnvironmentSelector />
            <SearchPanel />
            <PreviewPanel />
            <StatusPanel />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-slate-500"></div>
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
