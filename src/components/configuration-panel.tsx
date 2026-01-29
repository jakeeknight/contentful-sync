import { useState } from "react";
import { useAppContext } from "../context";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert } from "./ui/alert";

const STORAGE_KEY = "contentful-sync-credentials";

export function ConfigurationPanel() {
  const { state, connect } = useAppContext();
  const [spaceId, setSpaceId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const handleConnect = async () => {
    const success = await connect(spaceId, accessToken);
    // Save to localStorage on successful connection
    if (success) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ spaceId, accessToken }),
      );
    }
  };

  const canConnect = spaceId.trim() !== "" && accessToken.trim() !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect to Contentful</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Space ID"
              placeholder="Enter your Contentful Space ID"
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              disabled={state.isConnecting}
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[#1a1a1a]">
                  Access Token
                </label>
                {spaceId.trim() && (
                  <a
                    href={`https://app.contentful.com/spaces/${spaceId}/api/cma_tokens`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4f46e5] hover:underline"
                  >
                    Get Token
                  </a>
                )}
              </div>
              <input
                type="password"
                placeholder="Content Management API Token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={state.isConnecting}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm placeholder:text-[#9b9b9b] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 focus:border-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out bg-white border-[#e8e8e8] hover:border-[#d4d4d4]"
              />
            </div>
          </div>
          <Button
            onClick={handleConnect}
            disabled={!canConnect}
            loading={state.isConnecting}
          >
            Connect
          </Button>
          {state.connectionError && (
            <Alert variant="error">{state.connectionError}</Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
