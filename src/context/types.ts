import type { ContentfulEnvironment, DependencyGraph, SyncProgress, SyncResult } from "../types";
import { createContext, type Context } from "react";

export interface AppState {
  isInitializing: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  environments: ContentfulEnvironment[];
  sourceEnvironment: string | null;
  targetEnvironment: string | null;
  searchedEntryId: string | null;
  dependencyGraph: DependencyGraph | null;
  isResolving: boolean;
  resolveError: string | null;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  syncResult: SyncResult | null;
  syncError: string | null;
  modalOpen: boolean;
}

export type AppAction =
  | { type: "INIT_START" }
  | { type: "INIT_COMPLETE" }
  | { type: "CONNECT_START" }
  | { type: "CONNECT_SUCCESS"; environments: ContentfulEnvironment[] }
  | { type: "CONNECT_ERROR"; error: string }
  | { type: "SET_SOURCE_ENV"; env: string }
  | { type: "SET_TARGET_ENV"; env: string }
  | { type: "RESOLVE_START"; entryId: string }
  | { type: "RESOLVE_SUCCESS"; graph: DependencyGraph }
  | { type: "RESOLVE_ERROR"; error: string }
  | { type: "SYNC_START" }
  | { type: "SYNC_PROGRESS"; progress: SyncProgress }
  | { type: "SYNC_COMPLETE"; result: SyncResult }
  | { type: "SYNC_ERROR"; error: string }
  | { type: "OPEN_MODAL" }
  | { type: "CLOSE_MODAL" }
  | { type: "RESET" };

export interface AppContextValue {
  state: AppState;
  client: import("../services/contentful-client").ContentfulClient;
  connect: (spaceId: string, accessToken: string) => Promise<boolean>;
  setSourceEnv: (envId: string) => Promise<void>;
  setTargetEnv: (envId: string) => Promise<void>;
  resolveEntry: (entryId: string) => Promise<void>;
  executeSync: () => Promise<void>;
  reset: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export type AppContextType = Context<AppContextValue | null>;

export const AppContext: AppContextType = createContext<AppContextValue | null>(null);
