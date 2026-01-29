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
