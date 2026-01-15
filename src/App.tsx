import { AppProvider } from './context'
import { ConfigurationPanel } from './components/configuration-panel'
import { SearchPanel } from './components/search-panel'
import { PreviewPanel } from './components/preview-panel'
import { StatusPanel } from './components/status-panel'

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <h1 className="text-xl font-semibold text-slate-900">
              Contentful Environment Sync Tool
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          <ConfigurationPanel />
          <SearchPanel />
          <PreviewPanel />
          <StatusPanel />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto">
          <div className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-slate-500">
            Sync entries between Contentful environments with full dependency resolution
          </div>
        </footer>
      </div>
    </AppProvider>
  )
}

export default App
