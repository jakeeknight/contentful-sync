# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Contentful Environment Sync Tool - A React web application for syncing Contentful entries between environments (e.g., Master → DEV) with full dependency preservation. Solves the problem of safely replicating production data for debugging while maintaining data integrity across linked entries and assets.

## Commands

```bash
npm run dev        # Start dev server with HMR
npm run build      # TypeScript compile + Vite production build
npm run lint       # ESLint on TypeScript files
npm test           # Run tests in watch mode
npm run test:run   # Run tests once (CI mode)
```

## Architecture

### Service Layer (`src/services/`)

Three core services handle all business logic:

- **ContentfulClient** - Manages all Contentful API interactions (authentication, fetching entries/assets, syncing operations)
- **DependencyResolver** - Builds dependency graphs recursively with circular reference detection (max depth 50)
- **SyncEngine** - Executes sync with correct ordering (dependencies first, assets before entries at each level)

### State Management (`src/context/`)

Global state via React Context + useReducer pattern in `AppContext`:
- Connection state (credentials, environments list)
- Environment selection (source/target)
- Dependency resolution state (graph, loading, errors)
- Sync execution state (progress, results)

### Component Structure (`src/components/`)

Main panels compose the app in `App.tsx`:
- **ConfigurationPanel** - Space ID, access token, environment selection
- **SearchPanel** - Entry ID search interface
- **PreviewPanel** - Dependency tree visualization via `DependencyTree`
- **StatusPanel** - Overall sync status display
- **SyncProgress/SyncResults** - Progress tracking and results

Reusable UI primitives in `src/components/ui/` (shadcn-inspired, Tailwind-only).

### Data Flow

```
User enters credentials → ConfigurationPanel → AppContext.connect() → ContentfulClient
User searches entry → SearchPanel → AppContext.resolveEntry() → DependencyResolver (recursive)
Dependency graph displayed → PreviewPanel/DependencyTree
User initiates sync → AppContext.executeSync() → SyncEngine → ContentfulClient.syncEntry/Asset
```

## Tech Stack

- React 19 + TypeScript 5.9 (strict mode)
- Vite 7 (build/dev)
- Vitest + Testing Library (tests in `__tests__/` directories)
- Tailwind CSS 3.4 (styling)
- contentful/contentful-management SDKs

## Key Patterns

- **Dependency-first sync ordering**: Assets sync before entries; children sync before parents
- **Circular reference safety**: Visited set prevents infinite loops in dependency resolution
- **Result objects**: Services return `{ success, data?, error? }` pattern for error handling
