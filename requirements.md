# Product Requirements Document: Contentful Environment Sync Tool

## Executive Summary

A developer tool that enables safe, selective syncing of Contentful entries between environments (e.g., Master → DEV) with full relationship preservation. This tool addresses the critical need to replicate production data for debugging while maintaining data integrity across linked entries and assets.

## Problem Statement

Developers frequently encounter issues in production that cannot be debugged in development environments due to missing or outdated data. Current workarounds are manual, error-prone, and fail to maintain the complex relationship graphs that exist in Contentful entries. This leads to:

- Incomplete data copies missing linked entries or assets
- Time wasted manually reconstructing entry relationships
- Inability to reproduce production bugs in safe environments
- Risk of making changes in production to test fixes

## Goals & Success Metrics

### Primary Goals
1. Enable one-click replication of any Contentful entry with all dependencies
2. Provide visual confirmation of what will be synced before execution
3. Support bidirectional sync between any two environments
4. Maintain 100% data integrity including all linked entries and assets

### Success Metrics
- Sync accuracy: 100% of linked entries and assets copied
- Time savings: Reduce manual sync time from 30+ minutes to <2 minutes
- Developer adoption: 80% of team using tool within first month
- Error reduction: Zero broken references after sync

## User Stories

### Core User Stories

**US-1: Basic Entry Sync**
- As a developer, I want to sync a specific entry by ID from Master to DEV so I can debug production issues safely

**US-2: Dependency Visualization**
- As a developer, I want to see all linked entries and assets before syncing so I understand what will be copied

**US-3: Environment Selection**
- As a developer, I want to choose source and target environments so I can sync between any environment pair

**US-4: Asset Handling**
- As a developer, I want all referenced assets automatically synced so media and files work correctly

**US-5: Batch Selection**
- As a developer, I want to select multiple entries at once so I can sync related content efficiently

## Functional Requirements

### 1. Authentication & Configuration

**REQ-1.1: Contentful API Authentication**
- Support Space ID and Access Token configuration
- Validate credentials on connection
- Store credentials securely in browser session (not localStorage)
- Display connection status for each environment

**REQ-1.2: Environment Management**
- List all available environments from Contentful
- Allow selection of source environment (read-only)
- Allow selection of target environment (write)
- Validate write permissions before sync

### 2. Entry Discovery & Display

**REQ-2.1: Entry Search**
- Search entries by ID (primary use case)
- Display entry metadata: ID, content type, title, last updated
- Show entry status (published/draft)
- Display entry locale

**REQ-2.2: Dependency Graph**
- Automatically detect all linked entries (references)
- Recursively find nested linked entries (full depth)
- Identify all linked assets
- Display dependency tree visually with expandable nodes
- Show total count of entries and assets to be synced

**REQ-2.3: Data Preview**
- Display entry fields in readable format
- Preview asset thumbnails where applicable
- Show locale-specific content
- Highlight missing references in target environment

### 3. Sync Operations

**REQ-3.1: Dependency Resolution**
- Build complete dependency graph before sync
- Determine correct sync order (dependencies first)
- Handle circular references gracefully
- Detect and skip entries that already exist with identical content

**REQ-3.2: Entry Sync**
- Copy entry content with all fields
- Preserve entry metadata (excluding environment-specific IDs)
- Maintain reference integrity
- Support both published and draft states
- Handle locale-specific content

**REQ-3.3: Asset Sync**
- Download assets from source environment
- Upload assets to target environment
- Preserve asset metadata and file properties
- Handle asset processing states
- Support all asset types (images, videos, documents)

**REQ-3.4: Sync Execution**
- Show real-time progress during sync
- Display current operation (e.g., "Syncing entry 3/12")
- Provide detailed error messages on failure
- Support sync cancellation
- Generate sync summary report

### 4. User Interface

**REQ-4.1: Configuration Panel**
- Input fields for Space ID and Access Tokens
- Environment dropdown selectors (From/To)
- Connection status indicators
- Clear configuration option

**REQ-4.2: Search Interface**
- Entry ID input field
- Search button with loading state
- Clear/reset functionality

**REQ-4.3: Preview Panel**
- Entry details display
- Dependency tree visualization
- Expandable/collapsible nodes
- Selection checkboxes for optional filtering
- Summary statistics (X entries, Y assets)

**REQ-4.4: Sync Controls**
- "Sync Selected" primary action button
- Progress indicator during sync
- Cancel button during operation
- Success/error notifications

**REQ-4.5: Results Display**
- Success confirmation with counts
- List of synced entries
- Error details for failed operations
- Copy log functionality

## Non-Functional Requirements

### Performance
- NFR-1: Search results displayed within 2 seconds
- NFR-2: Dependency graph calculated within 5 seconds for typical entries (<50 dependencies)
- NFR-3: Sync rate of at least 5 entries per second
- NFR-4: Support entries with up to 500 dependencies

### Reliability
- NFR-5: Handle API rate limits gracefully with retry logic
- NFR-6: Atomic operations - rollback on partial failure
- NFR-7: 99% sync accuracy (all dependencies copied)

### Usability
- NFR-8: Zero-learning time for developers familiar with Contentful
- NFR-9: Clear error messages with actionable guidance
- NFR-10: Responsive UI supporting desktop viewports (1280px+)

### Security
- NFR-11: No credential storage in localStorage/sessionStorage
- NFR-12: All API calls over HTTPS
- NFR-13: Input validation for all user inputs

## Technical Specifications

### Technology Stack
- **Frontend Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with shadcn-inspired design system (see Design System below)
- **Contentful SDK**: contentful.js (Content Delivery API) and contentful-management (Content Management API)
- **State Management**: React hooks (useState, useReducer)
- **Type Safety**: Full TypeScript coverage

### Architecture Components

**1. ContentfulClient Service**
```typescript
- authenticateEnvironment(spaceId, accessToken, environment)
- getEntry(entryId)
- getAsset(assetId)
- resolveLinks(entry, depth)
- syncEntry(entry, targetEnvironment)
- syncAsset(asset, targetEnvironment)
```

**2. DependencyResolver**
```typescript
- buildDependencyGraph(rootEntryId)
- getExecutionOrder(graph)
- validateGraph(graph)
```

**3. SyncEngine**
```typescript
- executeSyncPlan(graph, sourceEnv, targetEnv)
- handleProgress(callback)
- handleErrors(errorHandler)
```

### Data Models

**Entry**
```typescript
{
  id: string;
  contentType: string;
  fields: Record<string, any>;
  metadata: {
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
  locale: string;
  status: 'published' | 'draft';
}
```

**Asset**
```typescript
{
  id: string;
  title: string;
  file: {
    url: string;
    fileName: string;
    contentType: string;
    size: number;
  };
  metadata: Record<string, any>;
}
```

**DependencyNode**
```typescript
{
  id: string;
  type: 'entry' | 'asset';
  data: Entry | Asset;
  children: DependencyNode[];
  parent?: DependencyNode;
}
```

## UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header: Contentful Environment Sync Tool       │
├─────────────────────────────────────────────────┤
│ Configuration Panel                             │
│  [Space ID] [Access Token] [Connect]           │
│  From: [Master ▼]  To: [DEV ▼]                 │
├─────────────────────────────────────────────────┤
│ Search                                          │
│  Entry ID: [_________] [Search]                │
├─────────────────────────────────────────────────┤
│ Preview Panel                                   │
│  Entry: Homepage (ID: abc123)                  │
│  ├─ 📄 Hero Section (entry)                    │
│  │  └─ 🖼️ Hero Image (asset)                   │
│  ├─ 📄 Featured Products (entry)               │
│  └─ 📄 Footer (entry)                          │
│                                                 │
│  Summary: 4 entries, 1 asset                   │
│  [Sync Selected →]                             │
├─────────────────────────────────────────────────┤
│ Status/Results                                  │
│  ✓ Synced 4 entries, 1 asset successfully     │
└─────────────────────────────────────────────────┘
```

### Visual Design Principles
- Clean, minimal interface focused on functionality
- Clear visual hierarchy: Configuration → Search → Preview → Action
- Color coding: Blue for entries, Green for assets, Red for errors
- Progressive disclosure: Show details on demand
- Immediate feedback for all actions

### Design System (shadcn-inspired, Tailwind-only)

The UI should match the shadcn/ui aesthetic using pure Tailwind CSS classes - no shadcn package dependency. Light theme only (no dark mode).

**Color Palette:**
- Background: `bg-white` (primary), `bg-slate-50` (secondary/muted)
- Borders: `border-slate-200` (subtle, 1px)
- Text: `text-slate-900` (primary), `text-slate-500` (muted), `text-slate-400` (placeholder)
- Primary accent: `bg-slate-900` / `text-white` (buttons)
- Destructive: `bg-red-500` / `text-white`
- Success: `text-green-600`

**Typography:**
- Font: System font stack (`font-sans`)
- Headings: `font-semibold`, sized appropriately
- Body: `text-sm` (14px) as default
- Labels: `text-sm font-medium text-slate-700`

**Component Patterns:**
- **Buttons**: Rounded (`rounded-md`), subtle shadow on primary (`shadow-sm`), hover states
- **Inputs**: `border border-slate-200 rounded-md px-3 py-2 text-sm`, focus ring (`focus:ring-2 focus:ring-slate-400 focus:ring-offset-2`)
- **Cards**: `bg-white border border-slate-200 rounded-lg shadow-sm`
- **Dropdowns/Selects**: Match input styling with chevron indicator

**Spacing:**
- Consistent padding: `p-4` for cards, `p-6` for larger panels
- Gap between elements: `gap-2` (tight), `gap-4` (normal), `gap-6` (loose)

**Interaction States:**
- Hover: Subtle background shift (`hover:bg-slate-100`)
- Focus: Ring-based focus indicators
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: Spinner or skeleton states

## Implementation Phases

### Phase 1: MVP
- Basic authentication and environment selection
- Entry search by ID
- Dependency graph calculation (1 level deep)
- Simple entry sync (no assets)
- Basic UI with configuration, search, and preview

### Phase 2: Full Feature Set
- Multi-level dependency resolution (full depth)
- Asset sync implementation
- Enhanced UI with tree visualization
- Progress tracking and error handling
- Circular reference detection

### Phase 3: Polish & Optimization 
- Batch operations
- Performance optimization
- Comprehensive error handling
- UI refinements and accessibility
- Documentation

## Edge Cases & Error Handling

### Edge Cases
1. **Circular References**: Entry A links to B, B links to A
   - Solution: Detect cycles, sync each entry once

2. **Missing References**: Target environment missing intermediate entries
   - Solution: Include full dependency chain automatically

3. **Large Dependency Trees**: 100+ linked entries
   - Solution: Show warning, allow batch processing, implement pagination

4. **Asset Processing**: Assets in "processing" state
   - Solution: Poll until ready or skip with warning

5. **Locale Variations**: Entry exists in multiple locales
   - Solution: Sync all locales or allow selection

### Error Scenarios
1. **Authentication Failure**: Invalid credentials
   - Display clear error, highlight credential fields

2. **Network Errors**: API timeout or connection loss
   - Retry with exponential backoff, show retry option

3. **Rate Limiting**: Exceeded API rate limits
   - Queue operations, implement delay, show estimated time

4. **Insufficient Permissions**: Cannot write to target environment
   - Validate permissions upfront, show clear permission error

5. **Entry Conflicts**: Entry exists in target with different content
   - Show diff, allow overwrite or skip options

## Future Enhancements

### Post-MVP Features
- **Diff View**: Compare entry content between environments before sync
- **Sync History**: Log of all sync operations with rollback capability
- **Scheduled Syncs**: Automate regular environment syncing
- **Selective Field Sync**: Choose specific fields to sync
- **Bulk Operations**: Upload CSV of entry IDs for batch sync
- **Environment Templates**: Save common sync configurations
- **Webhook Integration**: Trigger syncs on specific Contentful events
- **CLI Version**: Command-line tool for CI/CD integration

## Success Criteria

The tool will be considered successful when:
1. ✅ Developers can sync a production entry to DEV in under 2 minutes
2. ✅ 100% of linked entries and assets are copied correctly
3. ✅ Zero manual intervention required for dependency resolution
4. ✅ Tool is used at least 20 times per week by the team
5. ✅ Debugging cycle time reduced by 50%

## Appendix

### Glossary
- **Entry**: A content item in Contentful with structured fields
- **Asset**: Media file (image, video, document) in Contentful
- **Link**: Reference from one entry to another entry or asset
- **Dependency**: Entry or asset required by another entry
- **Environment**: Isolated content instance (e.g., Master, DEV, Staging)

### References
- [Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/)
- [Contentful.js SDK](https://github.com/contentful/contentful.js)
- [Contentful Links and References](https://www.contentful.com/developers/docs/concepts/links/)

### Open Questions
1. Should we support syncing entire content types at once?
2. Do we need audit logging for compliance?
3. Should deleted entries be synced as deleted or ignored?
4. Multi-user collaboration needed or single-user tool sufficient?