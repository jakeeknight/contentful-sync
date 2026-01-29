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
