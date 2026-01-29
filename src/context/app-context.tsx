import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { ContentfulClient, DependencyResolver, SyncEngine } from "../services";
import type {
  ContentfulEnvironment,
  DependencyGraph,
  SyncProgress,
  SyncResult,
} from "../types";

const STORAGE_KEY = "contentful-sync-credentials";

interface AppState {
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
  hasCompletedSync: boolean;
}

type AppAction =
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
  | { type: "RESET_SYNC_STATE" }
  | { type: "RESET" };

const initialState: AppState = {
  isInitializing: true,
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  environments: [],
  sourceEnvironment: null,
  targetEnvironment: null,
  searchedEntryId: null,
  dependencyGraph: null,
  isResolving: false,
  resolveError: null,
  isSyncing: false,
  syncProgress: null,
  syncResult: null,
  syncError: null,
  modalOpen: false,
  hasCompletedSync: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, isInitializing: true };
    case "INIT_COMPLETE":
      return { ...state, isInitializing: false };
    case "CONNECT_START":
      return { ...state, isConnecting: true, connectionError: null };
    case "CONNECT_SUCCESS":
      return {
        ...state,
        isConnecting: false,
        isConnected: true,
        environments: action.environments,
      };
    case "CONNECT_ERROR":
      return { ...state, isConnecting: false, connectionError: action.error };
    case "SET_SOURCE_ENV":
      return { ...state, sourceEnvironment: action.env };
    case "SET_TARGET_ENV":
      return { ...state, targetEnvironment: action.env };
    case "RESOLVE_START":
      return {
        ...state,
        isResolving: true,
        resolveError: null,
        searchedEntryId: action.entryId,
        dependencyGraph: null,
      };
    case "RESOLVE_SUCCESS":
      return { ...state, isResolving: false, dependencyGraph: action.graph };
    case "RESOLVE_ERROR":
      return { ...state, isResolving: false, resolveError: action.error };
    case "SYNC_START":
      return {
        ...state,
        isSyncing: true,
        syncProgress: null,
        syncResult: null,
      };
    case "SYNC_PROGRESS":
      return { ...state, syncProgress: action.progress };
    case "SYNC_COMPLETE":
      return { ...state, isSyncing: false, syncResult: action.result, hasCompletedSync: true };
    case "SYNC_ERROR":
      return { ...state, isSyncing: false, syncError: action.error };
    case "OPEN_MODAL":
      return { ...state, modalOpen: true };
    case "CLOSE_MODAL":
      return { ...state, modalOpen: false };
    case "RESET_SYNC_STATE":
      return {
        ...state,
        modalOpen: false,
        hasCompletedSync: false,
        searchedEntryId: null,
        dependencyGraph: null,
        syncProgress: null,
        syncResult: null,
        syncError: null,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  client: ContentfulClient;
  connect: (spaceId: string, accessToken: string) => Promise<boolean>;
  setSourceEnv: (envId: string) => Promise<void>;
  setTargetEnv: (envId: string) => Promise<void>;
  resolveEntry: (entryId: string) => Promise<void>;
  executeSync: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  resetSyncState: () => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [client] = useState(() => new ContentfulClient());

  const connect = async (
    spaceId: string,
    accessToken: string,
  ): Promise<boolean> => {
    dispatch({ type: "CONNECT_START" });
    const result = await client.connect(spaceId, accessToken);
    if (result.success && result.environments) {
      dispatch({ type: "CONNECT_SUCCESS", environments: result.environments });
      dispatch({ type: "INIT_COMPLETE" });
      return true;
    } else {
      dispatch({
        type: "CONNECT_ERROR",
        error: result.error || "Connection failed",
      });
      dispatch({ type: "INIT_COMPLETE" });
      return false;
    }
  };

  // Check for saved credentials on mount and auto-connect
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { spaceId: savedSpaceId, accessToken: savedAccessToken } =
          JSON.parse(saved);
        if (savedSpaceId && savedAccessToken) {
          connect(savedSpaceId, savedAccessToken);
          return;
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
    // No valid credentials found, complete initialization
    dispatch({ type: "INIT_COMPLETE" });
  }, []);

  const setSourceEnv = async (envId: string) => {
    await client.setSourceEnvironment(envId);
    dispatch({ type: "SET_SOURCE_ENV", env: envId });
  };

  const setTargetEnv = async (envId: string) => {
    await client.setTargetEnvironment(envId);
    dispatch({ type: "SET_TARGET_ENV", env: envId });
  };

  const resolveEntry = async (entryId: string) => {
    dispatch({ type: "RESOLVE_START", entryId });
    try {
      const resolver = new DependencyResolver(client);
      const graph = await resolver.resolve(entryId);
      dispatch({ type: "RESOLVE_SUCCESS", graph });
    } catch (error) {
      dispatch({
        type: "RESOLVE_ERROR",
        error: error instanceof Error ? error.message : "Resolution failed",
      });
    }
  };

  const executeSync = async () => {
    if (!state.dependencyGraph) return;

    dispatch({ type: "SYNC_START" });
    try {
      const engine = new SyncEngine(client);
      const result = await engine.execute(state.dependencyGraph, (progress) => {
        dispatch({ type: "SYNC_PROGRESS", progress });
      });
      dispatch({ type: "SYNC_COMPLETE", result });
    } catch (error) {
      dispatch({
        type: "SYNC_ERROR",
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  };

  const reset = () => {
    dispatch({ type: "RESET" });
  };

  const openModal = () => {
    dispatch({ type: "OPEN_MODAL" });
  };

  const closeModal = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  const resetSyncState = () => {
    dispatch({ type: "RESET_SYNC_STATE" });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        client,
        connect,
        setSourceEnv,
        setTargetEnv,
        resolveEntry,
        executeSync,
        openModal,
        closeModal,
        resetSyncState,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
