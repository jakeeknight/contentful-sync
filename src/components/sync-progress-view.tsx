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
