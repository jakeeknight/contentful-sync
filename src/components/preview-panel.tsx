import { useAppContext } from "../context";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
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
