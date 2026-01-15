# Contentful Environment Sync Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React application that enables developers to sync Contentful entries between environments with full dependency resolution.

**Architecture:** Single-page React app using Vite. Three core services (ContentfulClient, DependencyResolver, SyncEngine) handle API interactions, graph building, and sync orchestration. UI follows shadcn-inspired design with Tailwind CSS.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, contentful.js, contentful-management

---

## Phase 1: Project Setup

### Task 1.1: Initialize Vite Project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Step 1: Create Vite React TypeScript project**

Run:
```bash
cd /Users/jakeknight/Development/contentful-sync/.worktrees/implementation
npm create vite@latest . -- --template react-ts
```

Select: Overwrite existing files if prompted

**Step 2: Install dependencies**

Run:
```bash
npm install
```

**Step 3: Verify dev server starts**

Run:
```bash
npm run dev &
sleep 3
curl -s http://localhost:5173 | head -20
pkill -f "vite"
```

Expected: HTML response with Vite app

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize Vite React TypeScript project"
```

---

### Task 1.2: Configure Tailwind CSS

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/index.css`

**Step 1: Install Tailwind and dependencies**

Run:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 2: Configure tailwind.config.js**

Replace `tailwind.config.js` with:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 3: Replace src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Verify Tailwind works**

Replace `src/App.tsx` temporarily:
```tsx
function App() {
  return (
    <div className="bg-slate-900 text-white p-4">
      Tailwind working
    </div>
  )
}
export default App
```

Run:
```bash
npm run dev &
sleep 3
curl -s http://localhost:5173
pkill -f "vite"
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure Tailwind CSS"
```

---

### Task 1.3: Install Contentful SDKs

**Files:**
- Modify: `package.json`

**Step 1: Install Contentful packages**

Run:
```bash
npm install contentful contentful-management
```

**Step 2: Verify installation**

Run:
```bash
npm ls contentful contentful-management
```

Expected: Both packages listed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Contentful SDKs"
```

---

### Task 1.4: Set Up Testing Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json`

**Step 1: Install testing dependencies**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/jest
```

**Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

**Step 3: Create src/test/setup.ts**

```typescript
import '@testing-library/jest-dom'
```

**Step 4: Add test script to package.json**

Add to scripts section:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 5: Create a smoke test**

Create `src/App.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeInTheDocument()
  })
})
```

**Step 6: Run tests**

Run:
```bash
npm run test:run
```

Expected: 1 test passing

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: set up Vitest testing infrastructure"
```

---

## Phase 2: Core Types and Services

### Task 2.1: Define Core Types

**Files:**
- Create: `src/types/contentful.ts`
- Create: `src/types/sync.ts`

**Step 1: Create src/types/contentful.ts**

```typescript
export interface ContentfulEntry {
  sys: {
    id: string
    type: 'Entry'
    contentType: {
      sys: {
        id: string
      }
    }
    createdAt: string
    updatedAt: string
    publishedAt?: string
    version: number
  }
  fields: Record<string, unknown>
}

export interface ContentfulAsset {
  sys: {
    id: string
    type: 'Asset'
    createdAt: string
    updatedAt: string
    publishedAt?: string
    version: number
  }
  fields: {
    title?: Record<string, string>
    description?: Record<string, string>
    file?: Record<string, {
      url: string
      fileName: string
      contentType: string
      details: {
        size: number
        image?: {
          width: number
          height: number
        }
      }
    }>
  }
}

export interface ContentfulLink {
  sys: {
    type: 'Link'
    linkType: 'Entry' | 'Asset'
    id: string
  }
}

export interface ContentfulEnvironment {
  sys: {
    id: string
  }
  name: string
}

export interface ContentfulSpace {
  sys: {
    id: string
  }
  name: string
}

export type ContentfulItem = ContentfulEntry | ContentfulAsset
```

**Step 2: Create src/types/sync.ts**

```typescript
import type { ContentfulEntry, ContentfulAsset } from './contentful'

export type DependencyType = 'entry' | 'asset'

export interface DependencyNode {
  id: string
  type: DependencyType
  data: ContentfulEntry | ContentfulAsset
  children: DependencyNode[]
  depth: number
}

export interface DependencyGraph {
  root: DependencyNode
  allNodes: Map<string, DependencyNode>
  entryCount: number
  assetCount: number
}

export interface SyncProgress {
  phase: 'resolving' | 'syncing' | 'complete' | 'error'
  current: number
  total: number
  currentItem?: string
  message: string
}

export interface SyncResult {
  success: boolean
  entriesSynced: number
  assetsSynced: number
  errors: SyncError[]
  duration: number
}

export interface SyncError {
  itemId: string
  itemType: DependencyType
  message: string
}

export interface SyncPlan {
  entries: ContentfulEntry[]
  assets: ContentfulAsset[]
  order: string[]
}
```

**Step 3: Create index exports**

Create `src/types/index.ts`:
```typescript
export * from './contentful'
export * from './sync'
```

**Step 4: Verify types compile**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: define core TypeScript types for Contentful and sync"
```

---

### Task 2.2: Create ContentfulClient Service - Connection

**Files:**
- Create: `src/services/contentful-client.ts`
- Create: `src/services/__tests__/contentful-client.test.ts`

**Step 1: Write failing test for connection validation**

Create `src/services/__tests__/contentful-client.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContentfulClient } from '../contentful-client'

// Mock contentful-management
vi.mock('contentful-management', () => ({
  createClient: vi.fn()
}))

describe('ContentfulClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('connect', () => {
    it('should connect successfully with valid credentials', async () => {
      const mockSpace = {
        getEnvironments: vi.fn().mockResolvedValue({
          items: [{ sys: { id: 'master' }, name: 'master' }]
        }),
        getEnvironment: vi.fn().mockResolvedValue({
          sys: { id: 'master' },
          name: 'master'
        })
      }

      const { createClient } = await import('contentful-management')
      vi.mocked(createClient).mockReturnValue({
        getSpace: vi.fn().mockResolvedValue(mockSpace)
      } as any)

      const client = new ContentfulClient()
      const result = await client.connect('space-id', 'access-token')

      expect(result.success).toBe(true)
      expect(result.environments).toHaveLength(1)
    })

    it('should return error for invalid credentials', async () => {
      const { createClient } = await import('contentful-management')
      vi.mocked(createClient).mockReturnValue({
        getSpace: vi.fn().mockRejectedValue(new Error('Invalid access token'))
      } as any)

      const client = new ContentfulClient()
      const result = await client.connect('space-id', 'bad-token')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/services/__tests__/contentful-client.test.ts
```

Expected: FAIL - ContentfulClient not defined

**Step 3: Create src/services/contentful-client.ts**

```typescript
import { createClient, type ClientAPI, type Space, type Environment } from 'contentful-management'
import type { ContentfulEntry, ContentfulAsset, ContentfulEnvironment } from '../types'

export interface ConnectResult {
  success: boolean
  environments?: ContentfulEnvironment[]
  error?: string
}

export interface GetEntryResult {
  success: boolean
  entry?: ContentfulEntry
  error?: string
}

export interface GetAssetResult {
  success: boolean
  asset?: ContentfulAsset
  error?: string
}

export class ContentfulClient {
  private client: ClientAPI | null = null
  private space: Space | null = null
  private sourceEnv: Environment | null = null
  private targetEnv: Environment | null = null

  async connect(spaceId: string, accessToken: string): Promise<ConnectResult> {
    try {
      this.client = createClient({ accessToken })
      this.space = await this.client.getSpace(spaceId)

      const environmentsResponse = await this.space.getEnvironments()
      const environments: ContentfulEnvironment[] = environmentsResponse.items.map(env => ({
        sys: { id: env.sys.id },
        name: env.name
      }))

      return { success: true, environments }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  async setSourceEnvironment(environmentId: string): Promise<boolean> {
    if (!this.space) return false
    try {
      this.sourceEnv = await this.space.getEnvironment(environmentId)
      return true
    } catch {
      return false
    }
  }

  async setTargetEnvironment(environmentId: string): Promise<boolean> {
    if (!this.space) return false
    try {
      this.targetEnv = await this.space.getEnvironment(environmentId)
      return true
    } catch {
      return false
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.space !== null
  }

  getSourceEnvironment(): Environment | null {
    return this.sourceEnv
  }

  getTargetEnvironment(): Environment | null {
    return this.targetEnv
  }
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/services/__tests__/contentful-client.test.ts
```

Expected: 2 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ContentfulClient service with connection handling"
```

---

### Task 2.3: ContentfulClient - Entry and Asset Fetching

**Files:**
- Modify: `src/services/contentful-client.ts`
- Modify: `src/services/__tests__/contentful-client.test.ts`

**Step 1: Add failing tests for getEntry and getAsset**

Add to `src/services/__tests__/contentful-client.test.ts`:
```typescript
describe('getEntry', () => {
  it('should fetch entry by ID from source environment', async () => {
    const mockEntry = {
      sys: {
        id: 'entry-123',
        type: 'Entry',
        contentType: { sys: { id: 'page' } },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        version: 1
      },
      fields: { title: { 'en-US': 'Test' } }
    }

    const mockEnv = {
      sys: { id: 'master' },
      name: 'master',
      getEntry: vi.fn().mockResolvedValue(mockEntry)
    }

    const mockSpace = {
      getEnvironments: vi.fn().mockResolvedValue({ items: [mockEnv] }),
      getEnvironment: vi.fn().mockResolvedValue(mockEnv)
    }

    const { createClient } = await import('contentful-management')
    vi.mocked(createClient).mockReturnValue({
      getSpace: vi.fn().mockResolvedValue(mockSpace)
    } as any)

    const client = new ContentfulClient()
    await client.connect('space-id', 'token')
    await client.setSourceEnvironment('master')

    const result = await client.getEntry('entry-123')

    expect(result.success).toBe(true)
    expect(result.entry?.sys.id).toBe('entry-123')
  })

  it('should return error when entry not found', async () => {
    const mockEnv = {
      sys: { id: 'master' },
      name: 'master',
      getEntry: vi.fn().mockRejectedValue(new Error('Not found'))
    }

    const mockSpace = {
      getEnvironments: vi.fn().mockResolvedValue({ items: [mockEnv] }),
      getEnvironment: vi.fn().mockResolvedValue(mockEnv)
    }

    const { createClient } = await import('contentful-management')
    vi.mocked(createClient).mockReturnValue({
      getSpace: vi.fn().mockResolvedValue(mockSpace)
    } as any)

    const client = new ContentfulClient()
    await client.connect('space-id', 'token')
    await client.setSourceEnvironment('master')

    const result = await client.getEntry('nonexistent')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('getAsset', () => {
  it('should fetch asset by ID from source environment', async () => {
    const mockAsset = {
      sys: {
        id: 'asset-123',
        type: 'Asset',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        version: 1
      },
      fields: {
        title: { 'en-US': 'Image' },
        file: { 'en-US': { url: '//images.ctfassets.net/test.jpg', fileName: 'test.jpg', contentType: 'image/jpeg', details: { size: 1000 } } }
      }
    }

    const mockEnv = {
      sys: { id: 'master' },
      name: 'master',
      getAsset: vi.fn().mockResolvedValue(mockAsset)
    }

    const mockSpace = {
      getEnvironments: vi.fn().mockResolvedValue({ items: [mockEnv] }),
      getEnvironment: vi.fn().mockResolvedValue(mockEnv)
    }

    const { createClient } = await import('contentful-management')
    vi.mocked(createClient).mockReturnValue({
      getSpace: vi.fn().mockResolvedValue(mockSpace)
    } as any)

    const client = new ContentfulClient()
    await client.connect('space-id', 'token')
    await client.setSourceEnvironment('master')

    const result = await client.getAsset('asset-123')

    expect(result.success).toBe(true)
    expect(result.asset?.sys.id).toBe('asset-123')
  })
})
```

**Step 2: Run tests to verify they fail**

Run:
```bash
npm run test:run -- src/services/__tests__/contentful-client.test.ts
```

Expected: New tests fail

**Step 3: Add getEntry and getAsset methods**

Add to `ContentfulClient` class in `src/services/contentful-client.ts`:
```typescript
async getEntry(entryId: string): Promise<GetEntryResult> {
  if (!this.sourceEnv) {
    return { success: false, error: 'Source environment not set' }
  }

  try {
    const entry = await this.sourceEnv.getEntry(entryId)
    return {
      success: true,
      entry: {
        sys: {
          id: entry.sys.id,
          type: 'Entry',
          contentType: { sys: { id: entry.sys.contentType.sys.id } },
          createdAt: entry.sys.createdAt,
          updatedAt: entry.sys.updatedAt,
          publishedAt: entry.sys.publishedAt,
          version: entry.sys.version
        },
        fields: entry.fields
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

async getAsset(assetId: string): Promise<GetAssetResult> {
  if (!this.sourceEnv) {
    return { success: false, error: 'Source environment not set' }
  }

  try {
    const asset = await this.sourceEnv.getAsset(assetId)
    return {
      success: true,
      asset: {
        sys: {
          id: asset.sys.id,
          type: 'Asset',
          createdAt: asset.sys.createdAt,
          updatedAt: asset.sys.updatedAt,
          publishedAt: asset.sys.publishedAt,
          version: asset.sys.version
        },
        fields: asset.fields as ContentfulAsset['fields']
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
npm run test:run -- src/services/__tests__/contentful-client.test.ts
```

Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add getEntry and getAsset methods to ContentfulClient"
```

---

### Task 2.4: DependencyResolver Service

**Files:**
- Create: `src/services/dependency-resolver.ts`
- Create: `src/services/__tests__/dependency-resolver.test.ts`

**Step 1: Write failing test for dependency resolution**

Create `src/services/__tests__/dependency-resolver.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DependencyResolver } from '../dependency-resolver'
import type { ContentfulClient } from '../contentful-client'
import type { ContentfulEntry, ContentfulAsset } from '../../types'

describe('DependencyResolver', () => {
  const createMockClient = () => ({
    getEntry: vi.fn(),
    getAsset: vi.fn()
  })

  describe('resolve', () => {
    it('should resolve a single entry with no dependencies', async () => {
      const mockEntry: ContentfulEntry = {
        sys: {
          id: 'entry-1',
          type: 'Entry',
          contentType: { sys: { id: 'page' } },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: {
          title: { 'en-US': 'Test Page' }
        }
      }

      const mockClient = createMockClient()
      mockClient.getEntry.mockResolvedValue({ success: true, entry: mockEntry })

      const resolver = new DependencyResolver(mockClient as unknown as ContentfulClient)
      const graph = await resolver.resolve('entry-1')

      expect(graph.root.id).toBe('entry-1')
      expect(graph.entryCount).toBe(1)
      expect(graph.assetCount).toBe(0)
    })

    it('should resolve entry with linked entries', async () => {
      const parentEntry: ContentfulEntry = {
        sys: {
          id: 'parent',
          type: 'Entry',
          contentType: { sys: { id: 'page' } },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: {
          title: { 'en-US': 'Parent' },
          child: {
            'en-US': {
              sys: { type: 'Link', linkType: 'Entry', id: 'child-1' }
            }
          }
        }
      }

      const childEntry: ContentfulEntry = {
        sys: {
          id: 'child-1',
          type: 'Entry',
          contentType: { sys: { id: 'section' } },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: {
          title: { 'en-US': 'Child' }
        }
      }

      const mockClient = createMockClient()
      mockClient.getEntry
        .mockResolvedValueOnce({ success: true, entry: parentEntry })
        .mockResolvedValueOnce({ success: true, entry: childEntry })

      const resolver = new DependencyResolver(mockClient as unknown as ContentfulClient)
      const graph = await resolver.resolve('parent')

      expect(graph.entryCount).toBe(2)
      expect(graph.root.children).toHaveLength(1)
      expect(graph.root.children[0].id).toBe('child-1')
    })

    it('should resolve entry with linked assets', async () => {
      const entry: ContentfulEntry = {
        sys: {
          id: 'entry-1',
          type: 'Entry',
          contentType: { sys: { id: 'page' } },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: {
          image: {
            'en-US': {
              sys: { type: 'Link', linkType: 'Asset', id: 'asset-1' }
            }
          }
        }
      }

      const asset: ContentfulAsset = {
        sys: {
          id: 'asset-1',
          type: 'Asset',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: {
          title: { 'en-US': 'Image' },
          file: { 'en-US': { url: '//test.jpg', fileName: 'test.jpg', contentType: 'image/jpeg', details: { size: 1000 } } }
        }
      }

      const mockClient = createMockClient()
      mockClient.getEntry.mockResolvedValue({ success: true, entry })
      mockClient.getAsset.mockResolvedValue({ success: true, asset })

      const resolver = new DependencyResolver(mockClient as unknown as ContentfulClient)
      const graph = await resolver.resolve('entry-1')

      expect(graph.entryCount).toBe(1)
      expect(graph.assetCount).toBe(1)
    })

    it('should handle circular references', async () => {
      const entryA: ContentfulEntry = {
        sys: {
          id: 'entry-a',
          type: 'Entry',
          contentType: { sys: { id: 'page' } },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: {
          ref: { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'entry-b' } } }
        }
      }

      const entryB: ContentfulEntry = {
        sys: {
          id: 'entry-b',
          type: 'Entry',
          contentType: { sys: { id: 'page' } },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: {
          ref: { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'entry-a' } } }
        }
      }

      const mockClient = createMockClient()
      mockClient.getEntry
        .mockImplementation(async (id: string) => {
          if (id === 'entry-a') return { success: true, entry: entryA }
          if (id === 'entry-b') return { success: true, entry: entryB }
          return { success: false, error: 'Not found' }
        })

      const resolver = new DependencyResolver(mockClient as unknown as ContentfulClient)
      const graph = await resolver.resolve('entry-a')

      // Should not infinite loop, should have exactly 2 entries
      expect(graph.entryCount).toBe(2)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/services/__tests__/dependency-resolver.test.ts
```

Expected: FAIL - DependencyResolver not defined

**Step 3: Create src/services/dependency-resolver.ts**

```typescript
import type { ContentfulClient } from './contentful-client'
import type {
  ContentfulEntry,
  ContentfulAsset,
  ContentfulLink,
  DependencyNode,
  DependencyGraph
} from '../types'

export class DependencyResolver {
  private client: ContentfulClient
  private visited: Set<string> = new Set()
  private allNodes: Map<string, DependencyNode> = new Map()
  private entryCount = 0
  private assetCount = 0

  constructor(client: ContentfulClient) {
    this.client = client
  }

  async resolve(entryId: string): Promise<DependencyGraph> {
    this.visited.clear()
    this.allNodes.clear()
    this.entryCount = 0
    this.assetCount = 0

    const root = await this.resolveEntry(entryId, 0)

    if (!root) {
      throw new Error(`Failed to resolve entry: ${entryId}`)
    }

    return {
      root,
      allNodes: this.allNodes,
      entryCount: this.entryCount,
      assetCount: this.assetCount
    }
  }

  private async resolveEntry(entryId: string, depth: number): Promise<DependencyNode | null> {
    if (this.visited.has(`entry:${entryId}`)) {
      return this.allNodes.get(`entry:${entryId}`) || null
    }

    this.visited.add(`entry:${entryId}`)

    const result = await this.client.getEntry(entryId)
    if (!result.success || !result.entry) {
      return null
    }

    const entry = result.entry
    this.entryCount++

    const node: DependencyNode = {
      id: entryId,
      type: 'entry',
      data: entry,
      children: [],
      depth
    }

    this.allNodes.set(`entry:${entryId}`, node)

    // Find all links in fields
    const links = this.extractLinks(entry.fields)

    for (const link of links) {
      if (link.sys.linkType === 'Entry') {
        const childNode = await this.resolveEntry(link.sys.id, depth + 1)
        if (childNode && !node.children.some(c => c.id === childNode.id)) {
          node.children.push(childNode)
        }
      } else if (link.sys.linkType === 'Asset') {
        const assetNode = await this.resolveAsset(link.sys.id, depth + 1)
        if (assetNode && !node.children.some(c => c.id === assetNode.id)) {
          node.children.push(assetNode)
        }
      }
    }

    return node
  }

  private async resolveAsset(assetId: string, depth: number): Promise<DependencyNode | null> {
    if (this.visited.has(`asset:${assetId}`)) {
      return this.allNodes.get(`asset:${assetId}`) || null
    }

    this.visited.add(`asset:${assetId}`)

    const result = await this.client.getAsset(assetId)
    if (!result.success || !result.asset) {
      return null
    }

    this.assetCount++

    const node: DependencyNode = {
      id: assetId,
      type: 'asset',
      data: result.asset,
      children: [],
      depth
    }

    this.allNodes.set(`asset:${assetId}`, node)
    return node
  }

  private extractLinks(obj: unknown): ContentfulLink[] {
    const links: ContentfulLink[] = []

    if (obj === null || obj === undefined) {
      return links
    }

    if (typeof obj === 'object') {
      if (this.isLink(obj)) {
        links.push(obj as ContentfulLink)
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          links.push(...this.extractLinks(item))
        }
      } else {
        for (const value of Object.values(obj)) {
          links.push(...this.extractLinks(value))
        }
      }
    }

    return links
  }

  private isLink(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) return false
    const sys = (obj as Record<string, unknown>).sys
    if (typeof sys !== 'object' || sys === null) return false
    return (sys as Record<string, unknown>).type === 'Link'
  }
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
npm run test:run -- src/services/__tests__/dependency-resolver.test.ts
```

Expected: All 4 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add DependencyResolver service for building dependency graphs"
```

---

### Task 2.5: SyncEngine Service

**Files:**
- Create: `src/services/sync-engine.ts`
- Create: `src/services/__tests__/sync-engine.test.ts`

**Step 1: Write failing tests for SyncEngine**

Create `src/services/__tests__/sync-engine.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncEngine } from '../sync-engine'
import type { ContentfulClient } from '../contentful-client'
import type { DependencyGraph, DependencyNode, ContentfulEntry, ContentfulAsset } from '../../types'

describe('SyncEngine', () => {
  const createMockClient = () => ({
    getTargetEnvironment: vi.fn(),
    syncEntryToTarget: vi.fn(),
    syncAssetToTarget: vi.fn()
  })

  const createMockEntry = (id: string): ContentfulEntry => ({
    sys: {
      id,
      type: 'Entry',
      contentType: { sys: { id: 'page' } },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
      version: 1
    },
    fields: { title: { 'en-US': `Entry ${id}` } }
  })

  const createMockAsset = (id: string): ContentfulAsset => ({
    sys: {
      id,
      type: 'Asset',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
      version: 1
    },
    fields: {
      title: { 'en-US': `Asset ${id}` },
      file: { 'en-US': { url: '//test.jpg', fileName: 'test.jpg', contentType: 'image/jpeg', details: { size: 1000 } } }
    }
  })

  describe('execute', () => {
    it('should sync entries in correct order (dependencies first)', async () => {
      const syncOrder: string[] = []

      const mockClient = createMockClient()
      mockClient.getTargetEnvironment.mockReturnValue({ sys: { id: 'dev' } })
      mockClient.syncEntryToTarget.mockImplementation(async (entry: ContentfulEntry) => {
        syncOrder.push(entry.sys.id)
        return { success: true }
      })

      const childNode: DependencyNode = {
        id: 'child',
        type: 'entry',
        data: createMockEntry('child'),
        children: [],
        depth: 1
      }

      const rootNode: DependencyNode = {
        id: 'root',
        type: 'entry',
        data: createMockEntry('root'),
        children: [childNode],
        depth: 0
      }

      const graph: DependencyGraph = {
        root: rootNode,
        allNodes: new Map([
          ['entry:root', rootNode],
          ['entry:child', childNode]
        ]),
        entryCount: 2,
        assetCount: 0
      }

      const engine = new SyncEngine(mockClient as unknown as ContentfulClient)
      const result = await engine.execute(graph)

      expect(result.success).toBe(true)
      expect(result.entriesSynced).toBe(2)
      // Child should be synced before root (dependencies first)
      expect(syncOrder).toEqual(['child', 'root'])
    })

    it('should sync assets before entries that reference them', async () => {
      const syncOrder: string[] = []

      const mockClient = createMockClient()
      mockClient.getTargetEnvironment.mockReturnValue({ sys: { id: 'dev' } })
      mockClient.syncEntryToTarget.mockImplementation(async (entry: ContentfulEntry) => {
        syncOrder.push(`entry:${entry.sys.id}`)
        return { success: true }
      })
      mockClient.syncAssetToTarget.mockImplementation(async (asset: ContentfulAsset) => {
        syncOrder.push(`asset:${asset.sys.id}`)
        return { success: true }
      })

      const assetNode: DependencyNode = {
        id: 'image',
        type: 'asset',
        data: createMockAsset('image'),
        children: [],
        depth: 1
      }

      const entryNode: DependencyNode = {
        id: 'page',
        type: 'entry',
        data: createMockEntry('page'),
        children: [assetNode],
        depth: 0
      }

      const graph: DependencyGraph = {
        root: entryNode,
        allNodes: new Map([
          ['entry:page', entryNode],
          ['asset:image', assetNode]
        ]),
        entryCount: 1,
        assetCount: 1
      }

      const engine = new SyncEngine(mockClient as unknown as ContentfulClient)
      const result = await engine.execute(graph)

      expect(result.success).toBe(true)
      expect(result.assetsSynced).toBe(1)
      expect(result.entriesSynced).toBe(1)
      expect(syncOrder).toEqual(['asset:image', 'entry:page'])
    })

    it('should report errors without stopping', async () => {
      const mockClient = createMockClient()
      mockClient.getTargetEnvironment.mockReturnValue({ sys: { id: 'dev' } })
      mockClient.syncEntryToTarget
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: true })

      const entry1: DependencyNode = {
        id: 'entry-1',
        type: 'entry',
        data: createMockEntry('entry-1'),
        children: [],
        depth: 0
      }

      const entry2: DependencyNode = {
        id: 'entry-2',
        type: 'entry',
        data: createMockEntry('entry-2'),
        children: [],
        depth: 0
      }

      const graph: DependencyGraph = {
        root: entry1,
        allNodes: new Map([
          ['entry:entry-1', entry1],
          ['entry:entry-2', entry2]
        ]),
        entryCount: 2,
        assetCount: 0
      }

      const engine = new SyncEngine(mockClient as unknown as ContentfulClient)
      const result = await engine.execute(graph)

      expect(result.entriesSynced).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].itemId).toBe('entry-1')
    })

    it('should call progress callback', async () => {
      const mockClient = createMockClient()
      mockClient.getTargetEnvironment.mockReturnValue({ sys: { id: 'dev' } })
      mockClient.syncEntryToTarget.mockResolvedValue({ success: true })

      const node: DependencyNode = {
        id: 'entry-1',
        type: 'entry',
        data: createMockEntry('entry-1'),
        children: [],
        depth: 0
      }

      const graph: DependencyGraph = {
        root: node,
        allNodes: new Map([['entry:entry-1', node]]),
        entryCount: 1,
        assetCount: 0
      }

      const progressUpdates: Array<{ current: number; total: number }> = []

      const engine = new SyncEngine(mockClient as unknown as ContentfulClient)
      await engine.execute(graph, (progress) => {
        progressUpdates.push({ current: progress.current, total: progress.total })
      })

      expect(progressUpdates.length).toBeGreaterThan(0)
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run:
```bash
npm run test:run -- src/services/__tests__/sync-engine.test.ts
```

Expected: FAIL - SyncEngine not defined

**Step 3: Create src/services/sync-engine.ts**

```typescript
import type { ContentfulClient } from './contentful-client'
import type {
  DependencyGraph,
  DependencyNode,
  SyncProgress,
  SyncResult,
  SyncError,
  ContentfulEntry,
  ContentfulAsset
} from '../types'

export type ProgressCallback = (progress: SyncProgress) => void

export class SyncEngine {
  private client: ContentfulClient

  constructor(client: ContentfulClient) {
    this.client = client
  }

  async execute(
    graph: DependencyGraph,
    onProgress?: ProgressCallback
  ): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: SyncError[] = []
    let entriesSynced = 0
    let assetsSynced = 0

    // Build execution order: deepest dependencies first, assets before entries at same depth
    const executionOrder = this.buildExecutionOrder(graph)
    const total = executionOrder.length

    onProgress?.({
      phase: 'syncing',
      current: 0,
      total,
      message: 'Starting sync...'
    })

    for (let i = 0; i < executionOrder.length; i++) {
      const node = executionOrder[i]

      onProgress?.({
        phase: 'syncing',
        current: i + 1,
        total,
        currentItem: node.id,
        message: `Syncing ${node.type}: ${node.id}`
      })

      try {
        if (node.type === 'asset') {
          const result = await this.client.syncAssetToTarget(node.data as ContentfulAsset)
          if (result.success) {
            assetsSynced++
          } else {
            errors.push({
              itemId: node.id,
              itemType: 'asset',
              message: result.error || 'Unknown error'
            })
          }
        } else {
          const result = await this.client.syncEntryToTarget(node.data as ContentfulEntry)
          if (result.success) {
            entriesSynced++
          } else {
            errors.push({
              itemId: node.id,
              itemType: 'entry',
              message: result.error || 'Unknown error'
            })
          }
        }
      } catch (error) {
        errors.push({
          itemId: node.id,
          itemType: node.type,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const duration = Date.now() - startTime

    onProgress?.({
      phase: 'complete',
      current: total,
      total,
      message: `Sync complete: ${entriesSynced} entries, ${assetsSynced} assets`
    })

    return {
      success: errors.length === 0,
      entriesSynced,
      assetsSynced,
      errors,
      duration
    }
  }

  private buildExecutionOrder(graph: DependencyGraph): DependencyNode[] {
    const visited = new Set<string>()
    const order: DependencyNode[] = []

    const visit = (node: DependencyNode) => {
      const key = `${node.type}:${node.id}`
      if (visited.has(key)) return
      visited.add(key)

      // Visit children first (dependencies)
      for (const child of node.children) {
        visit(child)
      }

      order.push(node)
    }

    visit(graph.root)

    // Sort so assets come before entries at same position
    // This ensures assets are synced before entries that reference them
    return order.sort((a, b) => {
      if (a.type === 'asset' && b.type === 'entry') return -1
      if (a.type === 'entry' && b.type === 'asset') return 1
      return 0
    })
  }
}
```

**Step 4: Add sync methods to ContentfulClient**

Add to `src/services/contentful-client.ts`:
```typescript
export interface SyncEntryResult {
  success: boolean
  error?: string
}

export interface SyncAssetResult {
  success: boolean
  error?: string
}

// Add these methods to the ContentfulClient class:

async syncEntryToTarget(entry: ContentfulEntry): Promise<SyncEntryResult> {
  if (!this.targetEnv) {
    return { success: false, error: 'Target environment not set' }
  }

  try {
    // Check if entry exists in target
    let targetEntry
    try {
      targetEntry = await this.targetEnv.getEntry(entry.sys.id)
    } catch {
      // Entry doesn't exist, will create new
    }

    if (targetEntry) {
      // Update existing entry
      targetEntry.fields = entry.fields
      await targetEntry.update()
    } else {
      // Create new entry
      await this.targetEnv.createEntryWithId(entry.sys.contentType.sys.id, entry.sys.id, {
        fields: entry.fields
      })
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

async syncAssetToTarget(asset: ContentfulAsset): Promise<SyncAssetResult> {
  if (!this.targetEnv) {
    return { success: false, error: 'Target environment not set' }
  }

  try {
    // Check if asset exists in target
    let targetAsset
    try {
      targetAsset = await this.targetEnv.getAsset(asset.sys.id)
    } catch {
      // Asset doesn't exist, will create new
    }

    if (targetAsset) {
      // Update existing asset
      targetAsset.fields = asset.fields as typeof targetAsset.fields
      await targetAsset.update()
    } else {
      // Create new asset
      const newAsset = await this.targetEnv.createAssetWithId(asset.sys.id, {
        fields: asset.fields as Record<string, unknown>
      })

      // Process the asset (required for Contentful to make it available)
      await newAsset.processForAllLocales()
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
```

**Step 5: Update imports in contentful-client.ts**

Make sure the imports include:
```typescript
import type { ContentfulEntry, ContentfulAsset, ContentfulEnvironment } from '../types'
```

**Step 6: Run tests to verify they pass**

Run:
```bash
npm run test:run -- src/services/__tests__/sync-engine.test.ts
```

Expected: All 4 tests passing

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add SyncEngine service for executing sync operations"
```

---

### Task 2.6: Create Service Index Export

**Files:**
- Create: `src/services/index.ts`

**Step 1: Create index file**

Create `src/services/index.ts`:
```typescript
export { ContentfulClient } from './contentful-client'
export type { ConnectResult, GetEntryResult, GetAssetResult, SyncEntryResult, SyncAssetResult } from './contentful-client'

export { DependencyResolver } from './dependency-resolver'

export { SyncEngine } from './sync-engine'
export type { ProgressCallback } from './sync-engine'
```

**Step 2: Run all service tests**

Run:
```bash
npm run test:run -- src/services
```

Expected: All tests passing

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: add service index exports"
```

---

## Phase 3: UI Components

### Task 3.1: Base UI Components - Button

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/__tests__/button.test.tsx`

**Step 1: Write failing test for Button**

Create `src/components/ui/__tests__/button.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByText('Submit')).toBeInTheDocument()
    // Should have reduced opacity or spinner
    expect(screen.getByRole('button')).toHaveClass('opacity-50')
  })

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-slate-900')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-white')

    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-500')
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/ui/__tests__/button.test.tsx
```

Expected: FAIL - Button not defined

**Step 3: Create src/components/ui/button.tsx**

```typescript
import { type ButtonHTMLAttributes, type ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'destructive'
  loading?: boolean
}

const variantStyles = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
  destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-md px-4 py-2 text-sm font-medium
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
        ${variantStyles[variant]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/ui/__tests__/button.test.tsx
```

Expected: All 5 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Button component with shadcn-inspired styling"
```

---

### Task 3.2: Base UI Components - Input

**Files:**
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/__tests__/input.test.tsx`

**Step 1: Write failing test**

Create `src/components/ui/__tests__/input.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../input'

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('renders with label', () => {
    render(<Input label="Email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(<Input error="Required field" />)
    expect(screen.getByText('Required field')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/ui/__tests__/input.test.tsx
```

Expected: FAIL - Input not defined

**Step 3: Create src/components/ui/input.tsx**

```typescript
import { type InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-md border px-3 py-2 text-sm
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-slate-200'}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/ui/__tests__/input.test.tsx
```

Expected: All 5 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Input component with shadcn-inspired styling"
```

---

### Task 3.3: Base UI Components - Select

**Files:**
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/__tests__/select.test.tsx`

**Step 1: Write failing test**

Create `src/components/ui/__tests__/select.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '../select'

describe('Select', () => {
  const options = [
    { value: 'master', label: 'Master' },
    { value: 'dev', label: 'Development' }
  ]

  it('renders options', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Master')).toBeInTheDocument()
    expect(screen.getByText('Development')).toBeInTheDocument()
  })

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn()
    render(<Select options={options} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dev' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('renders with label', () => {
    render(<Select options={options} label="Environment" />)
    expect(screen.getByText('Environment')).toBeInTheDocument()
  })

  it('shows placeholder option', () => {
    render(<Select options={options} placeholder="Select environment" />)
    expect(screen.getByText('Select environment')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Select options={options} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/ui/__tests__/select.test.tsx
```

Expected: FAIL - Select not defined

**Step 3: Create src/components/ui/select.tsx**

```typescript
import { type SelectHTMLAttributes, forwardRef } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[]
  label?: string
  placeholder?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, label, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full rounded-md border border-slate-200 px-3 py-2 text-sm
            bg-white
            focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/ui/__tests__/select.test.tsx
```

Expected: All 5 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Select component with shadcn-inspired styling"
```

---

### Task 3.4: Base UI Components - Card

**Files:**
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/__tests__/card.test.tsx`

**Step 1: Write failing test**

Create `src/components/ui/__tests__/card.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent } from '../card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies correct styles', () => {
    render(<Card data-testid="card">Content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('bg-white')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('rounded-lg')
  })

  it('renders with header and title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Title</CardTitle>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/ui/__tests__/card.test.tsx
```

Expected: FAIL - Card not defined

**Step 3: Create src/components/ui/card.tsx**

```typescript
import { type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`p-6 pb-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 ${className}`} {...props}>
      {children}
    </h3>
  )
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/ui/__tests__/card.test.tsx
```

Expected: All 3 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Card component with shadcn-inspired styling"
```

---

### Task 3.5: Base UI Components - Alert and Badge

**Files:**
- Create: `src/components/ui/alert.tsx`
- Create: `src/components/ui/badge.tsx`

**Step 1: Create src/components/ui/alert.tsx**

```typescript
import { type HTMLAttributes, type ReactNode } from 'react'

type AlertVariant = 'default' | 'success' | 'error' | 'warning'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: AlertVariant
}

const variantStyles: Record<AlertVariant, string> = {
  default: 'bg-slate-50 border-slate-200 text-slate-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900'
}

export function Alert({ children, variant = 'default', className = '', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-md border p-4 text-sm ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
```

**Step 2: Create src/components/ui/badge.tsx**

```typescript
import { type HTMLAttributes, type ReactNode } from 'react'

type BadgeVariant = 'default' | 'entry' | 'asset' | 'success' | 'error'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  entry: 'bg-blue-100 text-blue-700',
  asset: 'bg-green-100 text-green-700',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700'
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
```

**Step 3: Verify types compile**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Alert and Badge components"
```

---

### Task 3.6: UI Component Index Export

**Files:**
- Create: `src/components/ui/index.ts`

**Step 1: Create index file**

Create `src/components/ui/index.ts`:
```typescript
export { Button } from './button'
export type { ButtonProps } from './button'

export { Input } from './input'
export type { InputProps } from './input'

export { Select } from './select'
export type { SelectProps, SelectOption } from './select'

export { Card, CardHeader, CardTitle, CardContent } from './card'

export { Alert } from './alert'

export { Badge } from './badge'
```

**Step 2: Run all UI component tests**

Run:
```bash
npm run test:run -- src/components/ui
```

Expected: All tests passing

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: add UI component index exports"
```

---

## Phase 4: Application State and Context

### Task 4.1: Create App Context

**Files:**
- Create: `src/context/app-context.tsx`
- Create: `src/context/__tests__/app-context.test.tsx`

**Step 1: Write failing test**

Create `src/context/__tests__/app-context.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useAppContext } from '../app-context'

function TestConsumer() {
  const { state, connect, setSourceEnv, setTargetEnv } = useAppContext()
  return (
    <div>
      <span data-testid="connected">{String(state.isConnected)}</span>
      <span data-testid="source">{state.sourceEnvironment || 'none'}</span>
      <span data-testid="target">{state.targetEnvironment || 'none'}</span>
      <button onClick={() => connect('space', 'token')}>Connect</button>
      <button onClick={() => setSourceEnv('master')}>Set Source</button>
      <button onClick={() => setTargetEnv('dev')}>Set Target</button>
    </div>
  )
}

describe('AppContext', () => {
  it('provides initial state', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    expect(screen.getByTestId('connected')).toHaveTextContent('false')
    expect(screen.getByTestId('source')).toHaveTextContent('none')
    expect(screen.getByTestId('target')).toHaveTextContent('none')
  })

  it('throws when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow()
    consoleError.mockRestore()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/context/__tests__/app-context.test.tsx
```

Expected: FAIL - AppProvider not defined

**Step 3: Create src/context/app-context.tsx**

```typescript
import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { ContentfulClient, DependencyResolver, SyncEngine } from '../services'
import type { ContentfulEnvironment, DependencyGraph, SyncProgress, SyncResult } from '../types'

interface AppState {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  environments: ContentfulEnvironment[]
  sourceEnvironment: string | null
  targetEnvironment: string | null
  searchedEntryId: string | null
  dependencyGraph: DependencyGraph | null
  isResolving: boolean
  resolveError: string | null
  isSyncing: boolean
  syncProgress: SyncProgress | null
  syncResult: SyncResult | null
}

type AppAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; environments: ContentfulEnvironment[] }
  | { type: 'CONNECT_ERROR'; error: string }
  | { type: 'SET_SOURCE_ENV'; env: string }
  | { type: 'SET_TARGET_ENV'; env: string }
  | { type: 'RESOLVE_START'; entryId: string }
  | { type: 'RESOLVE_SUCCESS'; graph: DependencyGraph }
  | { type: 'RESOLVE_ERROR'; error: string }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_PROGRESS'; progress: SyncProgress }
  | { type: 'SYNC_COMPLETE'; result: SyncResult }
  | { type: 'RESET' }

const initialState: AppState = {
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
  syncResult: null
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, isConnecting: true, connectionError: null }
    case 'CONNECT_SUCCESS':
      return { ...state, isConnecting: false, isConnected: true, environments: action.environments }
    case 'CONNECT_ERROR':
      return { ...state, isConnecting: false, connectionError: action.error }
    case 'SET_SOURCE_ENV':
      return { ...state, sourceEnvironment: action.env }
    case 'SET_TARGET_ENV':
      return { ...state, targetEnvironment: action.env }
    case 'RESOLVE_START':
      return { ...state, isResolving: true, resolveError: null, searchedEntryId: action.entryId, dependencyGraph: null }
    case 'RESOLVE_SUCCESS':
      return { ...state, isResolving: false, dependencyGraph: action.graph }
    case 'RESOLVE_ERROR':
      return { ...state, isResolving: false, resolveError: action.error }
    case 'SYNC_START':
      return { ...state, isSyncing: true, syncProgress: null, syncResult: null }
    case 'SYNC_PROGRESS':
      return { ...state, syncProgress: action.progress }
    case 'SYNC_COMPLETE':
      return { ...state, isSyncing: false, syncResult: action.result }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  client: ContentfulClient
  connect: (spaceId: string, accessToken: string) => Promise<boolean>
  setSourceEnv: (envId: string) => Promise<void>
  setTargetEnv: (envId: string) => Promise<void>
  resolveEntry: (entryId: string) => Promise<void>
  executeSync: () => Promise<void>
  reset: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const client = new ContentfulClient()

  const connect = async (spaceId: string, accessToken: string): Promise<boolean> => {
    dispatch({ type: 'CONNECT_START' })
    const result = await client.connect(spaceId, accessToken)
    if (result.success && result.environments) {
      dispatch({ type: 'CONNECT_SUCCESS', environments: result.environments })
      return true
    } else {
      dispatch({ type: 'CONNECT_ERROR', error: result.error || 'Connection failed' })
      return false
    }
  }

  const setSourceEnv = async (envId: string) => {
    await client.setSourceEnvironment(envId)
    dispatch({ type: 'SET_SOURCE_ENV', env: envId })
  }

  const setTargetEnv = async (envId: string) => {
    await client.setTargetEnvironment(envId)
    dispatch({ type: 'SET_TARGET_ENV', env: envId })
  }

  const resolveEntry = async (entryId: string) => {
    dispatch({ type: 'RESOLVE_START', entryId })
    try {
      const resolver = new DependencyResolver(client)
      const graph = await resolver.resolve(entryId)
      dispatch({ type: 'RESOLVE_SUCCESS', graph })
    } catch (error) {
      dispatch({ type: 'RESOLVE_ERROR', error: error instanceof Error ? error.message : 'Resolution failed' })
    }
  }

  const executeSync = async () => {
    if (!state.dependencyGraph) return

    dispatch({ type: 'SYNC_START' })
    const engine = new SyncEngine(client)
    const result = await engine.execute(state.dependencyGraph, (progress) => {
      dispatch({ type: 'SYNC_PROGRESS', progress })
    })
    dispatch({ type: 'SYNC_COMPLETE', result })
  }

  const reset = () => {
    dispatch({ type: 'RESET' })
  }

  return (
    <AppContext.Provider value={{ state, client, connect, setSourceEnv, setTargetEnv, resolveEntry, executeSync, reset }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/context/__tests__/app-context.test.tsx
```

Expected: All 2 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add AppContext for global state management"
```

---

### Task 4.2: Context Index Export

**Files:**
- Create: `src/context/index.ts`

**Step 1: Create index file**

```typescript
export { AppProvider, useAppContext } from './app-context'
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: add context index export"
```

---

## Phase 5: Feature Components

### Task 5.1: ConfigurationPanel Component

**Files:**
- Create: `src/components/configuration-panel.tsx`
- Create: `src/components/__tests__/configuration-panel.test.tsx`

**Step 1: Write failing test**

Create `src/components/__tests__/configuration-panel.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfigurationPanel } from '../configuration-panel'
import { AppProvider } from '../../context'

// Mock the services
vi.mock('../../services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue({ success: true, environments: [{ sys: { id: 'master' }, name: 'master' }] }),
    setSourceEnvironment: vi.fn().mockResolvedValue(true),
    setTargetEnvironment: vi.fn().mockResolvedValue(true)
  })),
  DependencyResolver: vi.fn(),
  SyncEngine: vi.fn()
}))

describe('ConfigurationPanel', () => {
  it('renders space ID and access token inputs', () => {
    render(
      <AppProvider>
        <ConfigurationPanel />
      </AppProvider>
    )
    expect(screen.getByLabelText(/space id/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/access token/i)).toBeInTheDocument()
  })

  it('renders connect button', () => {
    render(
      <AppProvider>
        <ConfigurationPanel />
      </AppProvider>
    )
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
  })

  it('disables connect button when fields are empty', () => {
    render(
      <AppProvider>
        <ConfigurationPanel />
      </AppProvider>
    )
    expect(screen.getByRole('button', { name: /connect/i })).toBeDisabled()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/__tests__/configuration-panel.test.tsx
```

Expected: FAIL - ConfigurationPanel not defined

**Step 3: Create src/components/configuration-panel.tsx**

```typescript
import { useState } from 'react'
import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Select, type SelectOption } from './ui/select'
import { Button } from './ui/button'
import { Alert } from './ui/alert'
import { Badge } from './ui/badge'

export function ConfigurationPanel() {
  const { state, connect, setSourceEnv, setTargetEnv } = useAppContext()
  const [spaceId, setSpaceId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const handleConnect = async () => {
    await connect(spaceId, accessToken)
  }

  const environmentOptions: SelectOption[] = state.environments.map(env => ({
    value: env.sys.id,
    label: env.name
  }))

  const canConnect = spaceId.trim() !== '' && accessToken.trim() !== ''

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Configuration</CardTitle>
          {state.isConnected && (
            <Badge variant="success">Connected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!state.isConnected ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Space ID"
                  placeholder="Enter your Contentful Space ID"
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  disabled={state.isConnecting}
                />
                <Input
                  label="Access Token"
                  type="password"
                  placeholder="Content Management API Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  disabled={state.isConnecting}
                />
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
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Source Environment (From)"
                options={environmentOptions}
                placeholder="Select source"
                value={state.sourceEnvironment || ''}
                onChange={(e) => setSourceEnv(e.target.value)}
              />
              <Select
                label="Target Environment (To)"
                options={environmentOptions}
                placeholder="Select target"
                value={state.targetEnvironment || ''}
                onChange={(e) => setTargetEnv(e.target.value)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/__tests__/configuration-panel.test.tsx
```

Expected: All 3 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ConfigurationPanel component"
```

---

### Task 5.2: SearchPanel Component

**Files:**
- Create: `src/components/search-panel.tsx`
- Create: `src/components/__tests__/search-panel.test.tsx`

**Step 1: Write failing test**

Create `src/components/__tests__/search-panel.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchPanel } from '../search-panel'
import { AppProvider } from '../../context'

vi.mock('../../services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    setSourceEnvironment: vi.fn(),
    setTargetEnvironment: vi.fn(),
    getEntry: vi.fn()
  })),
  DependencyResolver: vi.fn().mockImplementation(() => ({
    resolve: vi.fn()
  })),
  SyncEngine: vi.fn()
}))

describe('SearchPanel', () => {
  it('renders entry ID input', () => {
    render(
      <AppProvider>
        <SearchPanel />
      </AppProvider>
    )
    expect(screen.getByLabelText(/entry id/i)).toBeInTheDocument()
  })

  it('renders search button', () => {
    render(
      <AppProvider>
        <SearchPanel />
      </AppProvider>
    )
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('disables search when not connected or no source environment', () => {
    render(
      <AppProvider>
        <SearchPanel />
      </AppProvider>
    )
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/__tests__/search-panel.test.tsx
```

Expected: FAIL - SearchPanel not defined

**Step 3: Create src/components/search-panel.tsx**

```typescript
import { useState } from 'react'
import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Alert } from './ui/alert'

export function SearchPanel() {
  const { state, resolveEntry } = useAppContext()
  const [entryId, setEntryId] = useState('')

  const handleSearch = async () => {
    if (entryId.trim()) {
      await resolveEntry(entryId.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSearch) {
      handleSearch()
    }
  }

  const canSearch = state.isConnected && state.sourceEnvironment && entryId.trim() !== ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Entry ID"
                placeholder="Enter Contentful entry ID"
                value={entryId}
                onChange={(e) => setEntryId(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={state.isResolving}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={!canSearch}
                loading={state.isResolving}
              >
                Search
              </Button>
            </div>
          </div>

          {!state.isConnected && (
            <Alert>Connect to Contentful to search for entries</Alert>
          )}

          {state.isConnected && !state.sourceEnvironment && (
            <Alert>Select a source environment to search</Alert>
          )}

          {state.resolveError && (
            <Alert variant="error">{state.resolveError}</Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/__tests__/search-panel.test.tsx
```

Expected: All 3 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SearchPanel component"
```

---

### Task 5.3: DependencyTree Component

**Files:**
- Create: `src/components/dependency-tree.tsx`
- Create: `src/components/__tests__/dependency-tree.test.tsx`

**Step 1: Write failing test**

Create `src/components/__tests__/dependency-tree.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DependencyTree } from '../dependency-tree'
import type { DependencyNode, ContentfulEntry, ContentfulAsset } from '../../types'

describe('DependencyTree', () => {
  const createEntryNode = (id: string, title: string, children: DependencyNode[] = []): DependencyNode => ({
    id,
    type: 'entry',
    data: {
      sys: { id, type: 'Entry', contentType: { sys: { id: 'page' } }, createdAt: '', updatedAt: '', version: 1 },
      fields: { title: { 'en-US': title } }
    } as ContentfulEntry,
    children,
    depth: 0
  })

  const createAssetNode = (id: string, title: string): DependencyNode => ({
    id,
    type: 'asset',
    data: {
      sys: { id, type: 'Asset', createdAt: '', updatedAt: '', version: 1 },
      fields: { title: { 'en-US': title } }
    } as ContentfulAsset,
    children: [],
    depth: 1
  })

  it('renders root entry', () => {
    const root = createEntryNode('root', 'Homepage')
    render(<DependencyTree root={root} />)
    expect(screen.getByText('Homepage')).toBeInTheDocument()
  })

  it('renders entry type badge', () => {
    const root = createEntryNode('root', 'Homepage')
    render(<DependencyTree root={root} />)
    expect(screen.getByText('entry')).toBeInTheDocument()
  })

  it('renders nested children', () => {
    const child = createEntryNode('child', 'Hero Section')
    const root = createEntryNode('root', 'Homepage', [child])
    render(<DependencyTree root={root} />)
    expect(screen.getByText('Homepage')).toBeInTheDocument()
    expect(screen.getByText('Hero Section')).toBeInTheDocument()
  })

  it('renders asset nodes with asset badge', () => {
    const asset = createAssetNode('img', 'Hero Image')
    const root = createEntryNode('root', 'Homepage', [asset])
    render(<DependencyTree root={root} />)
    expect(screen.getByText('Hero Image')).toBeInTheDocument()
    expect(screen.getByText('asset')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/__tests__/dependency-tree.test.tsx
```

Expected: FAIL - DependencyTree not defined

**Step 3: Create src/components/dependency-tree.tsx**

```typescript
import { useState } from 'react'
import type { DependencyNode, ContentfulEntry, ContentfulAsset } from '../types'
import { Badge } from './ui/badge'

interface DependencyTreeProps {
  root: DependencyNode
}

interface TreeNodeProps {
  node: DependencyNode
  level: number
}

function getEntryTitle(entry: ContentfulEntry): string {
  const fields = entry.fields
  // Try common title field names
  for (const key of ['title', 'name', 'internalName', 'slug']) {
    const field = fields[key]
    if (field && typeof field === 'object') {
      const localized = field as Record<string, unknown>
      const value = localized['en-US'] || Object.values(localized)[0]
      if (typeof value === 'string') return value
    }
  }
  return entry.sys.id
}

function getAssetTitle(asset: ContentfulAsset): string {
  const title = asset.fields.title
  if (title) {
    return title['en-US'] || Object.values(title)[0] || asset.sys.id
  }
  return asset.sys.id
}

function TreeNode({ node, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  const title = node.type === 'entry'
    ? getEntryTitle(node.data as ContentfulEntry)
    : getAssetTitle(node.data as ContentfulAsset)

  const contentType = node.type === 'entry'
    ? (node.data as ContentfulEntry).sys.contentType.sys.id
    : 'Asset'

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-md
          hover:bg-slate-50 cursor-pointer
          ${level > 0 ? 'ml-6' : ''}
        `}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className="text-slate-400 w-4 text-center">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}

        <span className="text-slate-400">
          {node.type === 'entry' ? '📄' : '🖼️'}
        </span>

        <span className="font-medium text-slate-900">{title}</span>

        <span className="text-slate-500 text-sm">({contentType})</span>

        <Badge variant={node.type === 'entry' ? 'entry' : 'asset'}>
          {node.type}
        </Badge>

        <span className="text-slate-400 text-xs">{node.id}</span>
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-slate-200 ml-4">
          {node.children.map(child => (
            <TreeNode key={`${child.type}:${child.id}`} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function DependencyTree({ root }: DependencyTreeProps) {
  return (
    <div className="font-mono text-sm">
      <TreeNode node={root} level={0} />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/__tests__/dependency-tree.test.tsx
```

Expected: All 4 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add DependencyTree component for visualizing entry relationships"
```

---

### Task 5.4: PreviewPanel Component

**Files:**
- Create: `src/components/preview-panel.tsx`
- Create: `src/components/__tests__/preview-panel.test.tsx`

**Step 1: Write failing test**

Create `src/components/__tests__/preview-panel.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PreviewPanel } from '../preview-panel'
import { AppProvider } from '../../context'

vi.mock('../../services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({})),
  DependencyResolver: vi.fn(),
  SyncEngine: vi.fn()
}))

describe('PreviewPanel', () => {
  it('shows empty state when no graph', () => {
    render(
      <AppProvider>
        <PreviewPanel />
      </AppProvider>
    )
    expect(screen.getByText(/search for an entry/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/__tests__/preview-panel.test.tsx
```

Expected: FAIL - PreviewPanel not defined

**Step 3: Create src/components/preview-panel.tsx**

```typescript
import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert } from './ui/alert'
import { DependencyTree } from './dependency-tree'

export function PreviewPanel() {
  const { state, executeSync } = useAppContext()

  const canSync = state.dependencyGraph && state.targetEnvironment && !state.isSyncing

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
          <div className="text-center py-8 text-slate-500">
            Search for an entry to preview its dependencies
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-md p-4">
              <DependencyTree root={state.dependencyGraph.root} />
            </div>

            {!state.targetEnvironment && (
              <Alert>Select a target environment to sync</Alert>
            )}

            <div className="flex justify-end">
              <Button
                onClick={executeSync}
                disabled={!canSync}
                loading={state.isSyncing}
              >
                {state.isSyncing ? 'Syncing...' : 'Sync Selected'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/__tests__/preview-panel.test.tsx
```

Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add PreviewPanel component"
```

---

### Task 5.5: SyncProgress Component

**Files:**
- Create: `src/components/sync-progress.tsx`
- Create: `src/components/__tests__/sync-progress.test.tsx`

**Step 1: Write failing test**

Create `src/components/__tests__/sync-progress.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncProgressDisplay } from '../sync-progress'
import type { SyncProgress } from '../../types'

describe('SyncProgressDisplay', () => {
  it('shows progress message', () => {
    const progress: SyncProgress = {
      phase: 'syncing',
      current: 3,
      total: 10,
      currentItem: 'entry-123',
      message: 'Syncing entry: entry-123'
    }
    render(<SyncProgressDisplay progress={progress} />)
    expect(screen.getByText(/syncing entry/i)).toBeInTheDocument()
  })

  it('shows progress bar', () => {
    const progress: SyncProgress = {
      phase: 'syncing',
      current: 5,
      total: 10,
      message: 'Syncing...'
    }
    render(<SyncProgressDisplay progress={progress} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows completion state', () => {
    const progress: SyncProgress = {
      phase: 'complete',
      current: 10,
      total: 10,
      message: 'Sync complete'
    }
    render(<SyncProgressDisplay progress={progress} />)
    expect(screen.getByText(/complete/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/__tests__/sync-progress.test.tsx
```

Expected: FAIL - SyncProgressDisplay not defined

**Step 3: Create src/components/sync-progress.tsx**

```typescript
import type { SyncProgress } from '../types'

interface SyncProgressDisplayProps {
  progress: SyncProgress
}

export function SyncProgressDisplay({ progress }: SyncProgressDisplayProps) {
  const percentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{progress.message}</span>
        <span className="text-slate-500">{progress.current}/{progress.total}</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 bg-slate-100 rounded-full overflow-hidden"
      >
        <div
          className={`h-full transition-all duration-300 ${
            progress.phase === 'complete' ? 'bg-green-500' :
            progress.phase === 'error' ? 'bg-red-500' :
            'bg-slate-900'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {progress.currentItem && (
        <div className="text-xs text-slate-500 font-mono">
          Current: {progress.currentItem}
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/__tests__/sync-progress.test.tsx
```

Expected: All 3 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SyncProgressDisplay component"
```

---

### Task 5.6: SyncResults Component

**Files:**
- Create: `src/components/sync-results.tsx`
- Create: `src/components/__tests__/sync-results.test.tsx`

**Step 1: Write failing test**

Create `src/components/__tests__/sync-results.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncResults } from '../sync-results'
import type { SyncResult } from '../../types'

describe('SyncResults', () => {
  it('shows success message when no errors', () => {
    const result: SyncResult = {
      success: true,
      entriesSynced: 5,
      assetsSynced: 2,
      errors: [],
      duration: 1500
    }
    render(<SyncResults result={result} />)
    expect(screen.getByText(/success/i)).toBeInTheDocument()
    expect(screen.getByText(/5 entries/i)).toBeInTheDocument()
    expect(screen.getByText(/2 assets/i)).toBeInTheDocument()
  })

  it('shows errors when present', () => {
    const result: SyncResult = {
      success: false,
      entriesSynced: 3,
      assetsSynced: 1,
      errors: [
        { itemId: 'entry-1', itemType: 'entry', message: 'Network error' }
      ],
      duration: 2000
    }
    render(<SyncResults result={result} />)
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('shows duration', () => {
    const result: SyncResult = {
      success: true,
      entriesSynced: 1,
      assetsSynced: 0,
      errors: [],
      duration: 1500
    }
    render(<SyncResults result={result} />)
    expect(screen.getByText(/1\.5s/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/__tests__/sync-results.test.tsx
```

Expected: FAIL - SyncResults not defined

**Step 3: Create src/components/sync-results.tsx**

```typescript
import type { SyncResult } from '../types'
import { Alert } from './ui/alert'
import { Badge } from './ui/badge'

interface SyncResultsProps {
  result: SyncResult
}

export function SyncResults({ result }: SyncResultsProps) {
  const durationSeconds = (result.duration / 1000).toFixed(1)

  return (
    <div className="space-y-4">
      <Alert variant={result.success ? 'success' : 'error'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{result.success ? '✓' : '✗'}</span>
            <span className="font-medium">
              {result.success ? 'Sync completed successfully' : 'Sync completed with errors'}
            </span>
          </div>
          <span className="text-sm">{durationSeconds}s</span>
        </div>
      </Alert>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="entry">{result.entriesSynced} entries synced</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="asset">{result.assetsSynced} assets synced</Badge>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Errors ({result.errors.length})</h4>
          <div className="space-y-1">
            {result.errors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded-md"
              >
                <Badge variant="error">{error.itemType}</Badge>
                <span className="font-mono text-slate-600">{error.itemId}</span>
                <span className="text-red-700">{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/__tests__/sync-results.test.tsx
```

Expected: All 3 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SyncResults component"
```

---

### Task 5.7: StatusPanel Component

**Files:**
- Create: `src/components/status-panel.tsx`
- Create: `src/components/__tests__/status-panel.test.tsx`

**Step 1: Write failing test**

Create `src/components/__tests__/status-panel.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPanel } from '../status-panel'
import { AppProvider } from '../../context'

vi.mock('../../services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({})),
  DependencyResolver: vi.fn(),
  SyncEngine: vi.fn()
}))

describe('StatusPanel', () => {
  it('shows empty state when no progress or result', () => {
    render(
      <AppProvider>
        <StatusPanel />
      </AppProvider>
    )
    expect(screen.getByText(/status/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/components/__tests__/status-panel.test.tsx
```

Expected: FAIL - StatusPanel not defined

**Step 3: Create src/components/status-panel.tsx**

```typescript
import { useAppContext } from '../context'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { SyncProgressDisplay } from './sync-progress'
import { SyncResults } from './sync-results'

export function StatusPanel() {
  const { state } = useAppContext()

  const showProgress = state.isSyncing && state.syncProgress
  const showResults = !state.isSyncing && state.syncResult

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent>
        {showProgress && state.syncProgress && (
          <SyncProgressDisplay progress={state.syncProgress} />
        )}

        {showResults && state.syncResult && (
          <SyncResults result={state.syncResult} />
        )}

        {!showProgress && !showResults && (
          <div className="text-center py-4 text-slate-500">
            Ready to sync. Search for an entry and click "Sync Selected" to begin.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/components/__tests__/status-panel.test.tsx
```

Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add StatusPanel component"
```

---

### Task 5.8: Feature Components Index Export

**Files:**
- Create: `src/components/index.ts`

**Step 1: Create index file**

```typescript
// UI Components
export * from './ui'

// Feature Components
export { ConfigurationPanel } from './configuration-panel'
export { SearchPanel } from './search-panel'
export { PreviewPanel } from './preview-panel'
export { DependencyTree } from './dependency-tree'
export { SyncProgressDisplay } from './sync-progress'
export { SyncResults } from './sync-results'
export { StatusPanel } from './status-panel'
```

**Step 2: Run all component tests**

Run:
```bash
npm run test:run -- src/components
```

Expected: All tests passing

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: add component index exports"
```

---

## Phase 6: Main Application

### Task 6.1: App Layout and Composition

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Step 1: Update App.test.tsx**

Replace `src/App.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./services', () => ({
  ContentfulClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    setSourceEnvironment: vi.fn(),
    setTargetEnvironment: vi.fn()
  })),
  DependencyResolver: vi.fn(),
  SyncEngine: vi.fn()
}))

describe('App', () => {
  it('renders the application title', () => {
    render(<App />)
    expect(screen.getByText(/contentful environment sync/i)).toBeInTheDocument()
  })

  it('renders configuration panel', () => {
    render(<App />)
    expect(screen.getByText(/configuration/i)).toBeInTheDocument()
  })

  it('renders search panel', () => {
    render(<App />)
    expect(screen.getByText(/search entry/i)).toBeInTheDocument()
  })

  it('renders preview panel', () => {
    render(<App />)
    expect(screen.getByText(/preview/i)).toBeInTheDocument()
  })

  it('renders status panel', () => {
    render(<App />)
    expect(screen.getByText(/status/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test:run -- src/App.test.tsx
```

Expected: FAIL - structure doesn't match

**Step 3: Update src/App.tsx**

```typescript
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
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test:run -- src/App.test.tsx
```

Expected: All 5 tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: compose main App with all panels"
```

---

### Task 6.2: Update Index and Styles

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/index.css`

**Step 1: Update src/main.tsx**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Step 2: Ensure src/index.css has Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
body {
  @apply antialiased;
}
```

**Step 3: Run all tests**

Run:
```bash
npm run test:run
```

Expected: All tests passing

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: finalize index and styles"
```

---

### Task 6.3: Build Verification

**Files:**
- None (verification only)

**Step 1: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 2: Run build**

Run:
```bash
npm run build
```

Expected: Build succeeds, outputs to `dist/`

**Step 3: Run all tests one final time**

Run:
```bash
npm run test:run
```

Expected: All tests passing

**Step 4: Preview the build**

Run:
```bash
npm run preview &
sleep 3
curl -s http://localhost:4173 | head -20
pkill -f "vite preview"
```

Expected: HTML response with built app

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: verify build and all tests pass"
```

---

## Phase 7: Final Touches

### Task 7.1: Add .gitignore entries

**Files:**
- Modify: `.gitignore`

**Step 1: Update .gitignore**

Ensure `.gitignore` contains:
```
# Dependencies
node_modules

# Build output
dist

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage

# Worktrees
.worktrees/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: update gitignore"
```

---

### Task 7.2: Update index.html

**Files:**
- Modify: `index.html`

**Step 1: Update title and meta**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Sync Contentful entries between environments with full dependency resolution" />
    <title>Contentful Environment Sync Tool</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "chore: update page title and meta"
```

---

### Task 7.3: Final Test and Build

**Step 1: Run full test suite**

Run:
```bash
npm run test:run
```

Expected: All tests passing

**Step 2: Run production build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 3: Verify TypeScript**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Contentful Environment Sync Tool implementation"
```

---

## Summary

This plan implements a complete Contentful Environment Sync Tool with:

**Services:**
- `ContentfulClient` - API connection and operations
- `DependencyResolver` - Recursive dependency graph building
- `SyncEngine` - Ordered sync execution with progress tracking

**UI Components (shadcn-inspired):**
- Base: Button, Input, Select, Card, Alert, Badge
- Feature: ConfigurationPanel, SearchPanel, PreviewPanel, DependencyTree, SyncProgress, SyncResults, StatusPanel

**State Management:**
- React Context with useReducer for global app state

**Testing:**
- Full unit test coverage using Vitest and Testing Library
- TDD approach throughout

**Total estimated tasks:** 25 tasks across 7 phases
