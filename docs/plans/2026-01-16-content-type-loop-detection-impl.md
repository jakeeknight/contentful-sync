# Content Type Loop Detection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent browser crashes by detecting and pruning entries that create content type loops in dependency chains.

**Architecture:** Add path-based content type tracking to DependencyResolver. When an entry's content type already exists in the current ancestry chain, mark it as "pruned" and skip traversal. Display pruned nodes distinctly in UI and exclude them from sync.

**Tech Stack:** React, TypeScript, Vitest

---

## Task 1: Add Pruned Status to DependencyNode Type

**Files:**
- Modify: `src/types/sync.ts:5-11`
- Test: `src/types/` (type-only change, verified by build)

**Step 1: Update DependencyNode interface**

In `src/types/sync.ts`, update the `DependencyNode` interface:

```typescript
export interface DependencyNode {
  id: string
  type: DependencyType
  data: ContentfulEntry | ContentfulAsset
  children: DependencyNode[]
  depth: number
  status?: 'resolved' | 'pruned'
  pruneReason?: 'content-type-loop'
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no type errors

**Step 3: Run tests to ensure no regressions**

Run: `npm run test:run`
Expected: All 60 tests pass

**Step 4: Commit**

```bash
git add src/types/sync.ts
git commit -m "feat: add pruned status to DependencyNode type"
```

---

## Task 2: Add Skipped Count to SyncResult Type

**Files:**
- Modify: `src/types/sync.ts:28-34`

**Step 1: Update SyncResult interface**

In `src/types/sync.ts`, add `skippedCount` to the `SyncResult` interface:

```typescript
export interface SyncResult {
  success: boolean
  entriesSynced: number
  assetsSynced: number
  skippedCount: number
  errors: SyncError[]
  duration: number
}
```

**Step 2: Update SyncEngine to initialize skippedCount**

In `src/services/sync-engine.ts`, at line 27, add initialization:

```typescript
let entriesSynced = 0
let assetsSynced = 0
let skippedCount = 0
```

And update the return statement around line 94:

```typescript
return {
  success: errors.length === 0,
  entriesSynced,
  assetsSynced,
  skippedCount,
  errors,
  duration
}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Run tests**

Run: `npm run test:run`
Expected: Tests may fail - fix any test expectations for SyncResult shape

**Step 5: Commit**

```bash
git add src/types/sync.ts src/services/sync-engine.ts
git commit -m "feat: add skippedCount to SyncResult type"
```

---

## Task 3: Add Content Type Loop Detection to DependencyResolver

**Files:**
- Modify: `src/services/dependency-resolver.ts`
- Test: `src/services/__tests__/dependency-resolver.test.ts`

**Step 1: Write the failing test for content type loop detection**

Add to `src/services/__tests__/dependency-resolver.test.ts`:

```typescript
it('should detect and prune content type loops', async () => {
  // Offer -> OfferHomePage -> Offer (different ID, same type)
  const offer1: ContentfulEntry = {
    sys: {
      id: 'offer-1',
      type: 'Entry',
      contentType: { sys: { id: 'offer' } },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
      version: 1
    },
    fields: {
      title: { 'en-US': 'Summer Sale' },
      parentCategory: {
        'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'homepage-1' } }
      }
    }
  }

  const homepage: ContentfulEntry = {
    sys: {
      id: 'homepage-1',
      type: 'Entry',
      contentType: { sys: { id: 'offerHomePage' } },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
      version: 1
    },
    fields: {
      title: { 'en-US': 'Offers Landing' },
      featuredOffer: {
        'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'offer-2' } }
      }
    }
  }

  const offer2: ContentfulEntry = {
    sys: {
      id: 'offer-2',
      type: 'Entry',
      contentType: { sys: { id: 'offer' } },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
      version: 1
    },
    fields: {
      title: { 'en-US': 'Winter Sale' }
    }
  }

  const mockClient = createMockClient()
  mockClient.getEntry.mockImplementation(async (id: string) => {
    if (id === 'offer-1') return { success: true, entry: offer1 }
    if (id === 'homepage-1') return { success: true, entry: homepage }
    if (id === 'offer-2') return { success: true, entry: offer2 }
    return { success: false, error: 'Not found' }
  })

  const resolver = new DependencyResolver(mockClient as unknown as ContentfulClient)
  const graph = await resolver.resolve('offer-1')

  // Should have 3 entries total (offer-1, homepage-1, offer-2)
  expect(graph.entryCount).toBe(3)

  // offer-2 should be marked as pruned
  const homepageNode = graph.root.children.find(c => c.id === 'homepage-1')
  expect(homepageNode).toBeDefined()

  const offer2Node = homepageNode?.children.find(c => c.id === 'offer-2')
  expect(offer2Node).toBeDefined()
  expect(offer2Node?.status).toBe('pruned')
  expect(offer2Node?.pruneReason).toBe('content-type-loop')
  expect(offer2Node?.children).toHaveLength(0) // No further traversal
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- --reporter=verbose`
Expected: FAIL - status is undefined

**Step 3: Update resolveEntry signature to accept contentTypeChain**

In `src/services/dependency-resolver.ts`, update the `resolveEntry` method signature:

```typescript
private async resolveEntry(
  entryId: string,
  depth: number,
  contentTypeChain: Set<string> = new Set()
): Promise<DependencyNode | null> {
```

**Step 4: Add content type loop detection logic**

In `resolveEntry`, after fetching the entry (around line 62), add:

```typescript
const entry = result.entry
const contentType = entry.sys.contentType.sys.id

// Check for content type loop
if (contentTypeChain.has(contentType)) {
  this.entryCount++
  const node: DependencyNode = {
    id: entryId,
    type: 'entry',
    data: entry,
    children: [],
    depth,
    status: 'pruned',
    pruneReason: 'content-type-loop'
  }
  this.allNodes.set(`entry:${entryId}`, node)
  return node
}

// Add this content type to the chain for child resolution
const newChain = new Set(contentTypeChain)
newChain.add(contentType)
```

**Step 5: Update the normal node creation to include status**

Update the node creation (around line 65) to include status:

```typescript
const node: DependencyNode = {
  id: entryId,
  type: 'entry',
  data: entry,
  children: [],
  depth,
  status: 'resolved'
}
```

**Step 6: Pass newChain to recursive calls**

Update the recursive `resolveEntry` call (around line 80) to pass the chain:

```typescript
const childNode = await this.resolveEntry(link.sys.id, depth + 1, newChain)
```

**Step 7: Update the resolve() method to initialize the chain with root's content type**

In the `resolve` method (around line 32), pass an empty set (root entry adds itself):

```typescript
const root = await this.resolveEntry(entryId, 0, new Set())
```

**Step 8: Run test to verify it passes**

Run: `npm run test:run -- --reporter=verbose`
Expected: All tests pass

**Step 9: Commit**

```bash
git add src/services/dependency-resolver.ts src/services/__tests__/dependency-resolver.test.ts
git commit -m "feat: add content type loop detection to DependencyResolver"
```

---

## Task 4: Add Skipped Badge Variant

**Files:**
- Modify: `src/components/ui/badge.tsx`
- Test: `src/components/ui/__tests__/badge.test.tsx`

**Step 1: Write the failing test**

Add to `src/components/ui/__tests__/badge.test.tsx`:

```typescript
it('should render skipped variant with amber colors', () => {
  render(<Badge variant="skipped">skipped</Badge>)
  const badge = screen.getByText('skipped')
  expect(badge).toHaveClass('bg-amber-100', 'text-amber-700')
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/ui/__tests__/badge.test.tsx`
Expected: FAIL - type error or missing class

**Step 3: Add skipped variant**

In `src/components/ui/badge.tsx`, update the type and styles:

```typescript
type BadgeVariant = 'default' | 'entry' | 'asset' | 'success' | 'error' | 'skipped'

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  entry: 'bg-blue-100 text-blue-700',
  asset: 'bg-green-100 text-green-700',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  skipped: 'bg-amber-100 text-amber-700'
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/ui/__tests__/badge.test.tsx`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/ui/badge.tsx src/components/ui/__tests__/badge.test.tsx
git commit -m "feat: add skipped variant to Badge component"
```

---

## Task 5: Update DependencyTree to Display Pruned Nodes

**Files:**
- Modify: `src/components/dependency-tree.tsx`
- Test: `src/components/__tests__/dependency-tree.test.tsx`

**Step 1: Write the failing test**

Add to `src/components/__tests__/dependency-tree.test.tsx`:

```typescript
it('should display pruned nodes with skip indicator', () => {
  const prunedNode: DependencyNode = {
    id: 'pruned-1',
    type: 'entry',
    data: {
      sys: {
        id: 'pruned-1',
        type: 'Entry',
        contentType: { sys: { id: 'offer' } },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        version: 1
      },
      fields: { title: { 'en-US': 'Pruned Offer' } }
    } as ContentfulEntry,
    children: [],
    depth: 1,
    status: 'pruned',
    pruneReason: 'content-type-loop'
  }

  const root: DependencyNode = {
    id: 'root-1',
    type: 'entry',
    data: {
      sys: {
        id: 'root-1',
        type: 'Entry',
        contentType: { sys: { id: 'page' } },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        version: 1
      },
      fields: { title: { 'en-US': 'Root Page' } }
    } as ContentfulEntry,
    children: [prunedNode],
    depth: 0,
    status: 'resolved'
  }

  render(<DependencyTree root={root} />)

  expect(screen.getByText('Pruned Offer')).toBeInTheDocument()
  expect(screen.getByText('skipped')).toBeInTheDocument()
  expect(screen.getByText(/content type loop/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/__tests__/dependency-tree.test.tsx`
Expected: FAIL - "skipped" text not found

**Step 3: Update TreeNode to handle pruned status**

In `src/components/dependency-tree.tsx`, update the `TreeNode` component:

```typescript
function TreeNode({ node, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isPruned = node.status === 'pruned'

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
          ${isPruned ? 'opacity-60' : ''}
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
          {isPruned ? '⊘' : node.type === 'entry' ? '📄' : '🖼️'}
        </span>

        <span className={`font-medium ${isPruned ? 'text-slate-500' : 'text-slate-900'}`}>
          {title}
        </span>

        <span className="text-slate-500 text-sm">({contentType})</span>

        {isPruned ? (
          <>
            <Badge variant="skipped">skipped</Badge>
            <span className="text-amber-600 text-xs">content type loop</span>
          </>
        ) : (
          <Badge variant={node.type === 'entry' ? 'entry' : 'asset'}>
            {node.type}
          </Badge>
        )}

        {!isPruned && <span className="text-slate-400 text-xs">{node.id}</span>}
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
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/__tests__/dependency-tree.test.tsx`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/dependency-tree.tsx src/components/__tests__/dependency-tree.test.tsx
git commit -m "feat: display pruned nodes with skip indicator in DependencyTree"
```

---

## Task 6: Update SyncEngine to Skip Pruned Nodes

**Files:**
- Modify: `src/services/sync-engine.ts`
- Test: `src/services/__tests__/sync-engine.test.ts`

**Step 1: Write the failing test**

Add to `src/services/__tests__/sync-engine.test.ts`:

```typescript
it('should skip pruned nodes and track skipped count', async () => {
  const prunedNode: DependencyNode = {
    id: 'pruned-1',
    type: 'entry',
    data: {
      sys: {
        id: 'pruned-1',
        type: 'Entry',
        contentType: { sys: { id: 'offer' } },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        version: 1
      },
      fields: {}
    } as ContentfulEntry,
    children: [],
    depth: 1,
    status: 'pruned',
    pruneReason: 'content-type-loop'
  }

  const rootNode: DependencyNode = {
    id: 'root-1',
    type: 'entry',
    data: {
      sys: {
        id: 'root-1',
        type: 'Entry',
        contentType: { sys: { id: 'page' } },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        version: 1
      },
      fields: {}
    } as ContentfulEntry,
    children: [prunedNode],
    depth: 0,
    status: 'resolved'
  }

  const graph: DependencyGraph = {
    root: rootNode,
    allNodes: new Map([
      ['entry:root-1', rootNode],
      ['entry:pruned-1', prunedNode]
    ]),
    entryCount: 2,
    assetCount: 0
  }

  const mockClient = {
    syncEntryToTarget: vi.fn().mockResolvedValue({ success: true }),
    syncAssetToTarget: vi.fn().mockResolvedValue({ success: true })
  }

  const engine = new SyncEngine(mockClient as unknown as ContentfulClient)
  const result = await engine.execute(graph)

  // Should only sync the root, not the pruned node
  expect(mockClient.syncEntryToTarget).toHaveBeenCalledTimes(1)
  expect(result.entriesSynced).toBe(1)
  expect(result.skippedCount).toBe(1)
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/services/__tests__/sync-engine.test.ts`
Expected: FAIL - syncEntryToTarget called twice or skippedCount undefined

**Step 3: Update buildExecutionOrder to exclude pruned nodes**

In `src/services/sync-engine.ts`, update the `visit` function in `buildExecutionOrder`:

```typescript
const visit = (node: DependencyNode) => {
  const key = `${node.type}:${node.id}`
  if (visited.has(key)) return
  visited.add(key)

  // Skip pruned nodes - don't add to execution order
  if (node.status === 'pruned') {
    return
  }

  // Sort children so assets are visited before entries at each level
  const sortedChildren = [...node.children].sort((a, b) => {
    if (a.type === 'asset' && b.type !== 'asset') return -1
    if (a.type !== 'asset' && b.type === 'asset') return 1
    return 0
  })

  // Visit children first (dependencies)
  for (const child of sortedChildren) {
    visit(child)
  }

  order.push(node)
}
```

**Step 4: Add separate pass to count pruned nodes**

After `buildExecutionOrder`, calculate skipped count. Update the `execute` method:

```typescript
async execute(
  graph: DependencyGraph,
  onProgress?: ProgressCallback
): Promise<SyncResult> {
  const startTime = Date.now()
  const errors: SyncError[] = []
  let entriesSynced = 0
  let assetsSynced = 0

  // Count pruned nodes
  let skippedCount = 0
  for (const node of graph.allNodes.values()) {
    if (node.status === 'pruned') {
      skippedCount++
    }
  }

  // Build execution order: deepest dependencies first, assets before entries at same depth
  const executionOrder = this.buildExecutionOrder(graph)
  // ... rest of method
```

And update the return statement:

```typescript
return {
  success: errors.length === 0,
  entriesSynced,
  assetsSynced,
  skippedCount,
  errors,
  duration
}
```

**Step 5: Run test to verify it passes**

Run: `npm run test:run -- src/services/__tests__/sync-engine.test.ts`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/services/sync-engine.ts src/services/__tests__/sync-engine.test.ts
git commit -m "feat: skip pruned nodes in SyncEngine and track skipped count"
```

---

## Task 7: Update SyncResults to Display Skipped Count

**Files:**
- Modify: `src/components/sync-results.tsx`
- Test: `src/components/__tests__/sync-results.test.tsx`

**Step 1: Write the failing test**

Add to `src/components/__tests__/sync-results.test.tsx`:

```typescript
it('should display skipped count when entries were skipped', () => {
  const result: SyncResult = {
    success: true,
    entriesSynced: 5,
    assetsSynced: 2,
    skippedCount: 3,
    errors: [],
    duration: 1500
  }

  render(<SyncResults result={result} />)

  expect(screen.getByText('3 skipped')).toBeInTheDocument()
  expect(screen.getByText(/content type loop/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/__tests__/sync-results.test.tsx`
Expected: FAIL - "3 skipped" not found

**Step 3: Update SyncResults component**

In `src/components/sync-results.tsx`, add the skipped display:

```typescript
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
        {result.skippedCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="skipped">{result.skippedCount} skipped</Badge>
            <span className="text-xs text-slate-500">(content type loops)</span>
          </div>
        )}
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

Run: `npm run test:run -- src/components/__tests__/sync-results.test.tsx`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/sync-results.tsx src/components/__tests__/sync-results.test.tsx
git commit -m "feat: display skipped count in SyncResults component"
```

---

## Task 8: Final Verification

**Step 1: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any linting or test issues"
```

---

## Summary

**Files modified:**
1. `src/types/sync.ts` - Add pruned status and skippedCount
2. `src/services/dependency-resolver.ts` - Content type loop detection
3. `src/services/sync-engine.ts` - Skip pruned nodes, track skipped count
4. `src/components/ui/badge.tsx` - Add skipped variant
5. `src/components/dependency-tree.tsx` - Visual treatment for pruned nodes
6. `src/components/sync-results.tsx` - Display skipped count

**Tests added:**
1. `src/services/__tests__/dependency-resolver.test.ts` - Content type loop test
2. `src/services/__tests__/sync-engine.test.ts` - Skip pruned nodes test
3. `src/components/ui/__tests__/badge.test.tsx` - Skipped variant test
4. `src/components/__tests__/dependency-tree.test.tsx` - Pruned node display test
5. `src/components/__tests__/sync-results.test.tsx` - Skipped count display test
