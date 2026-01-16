# Content Type Loop Detection Design

**Goal:** Prevent browser crashes when resolving deeply nested Contentful entries that contain circular content type references (e.g., Offer → OfferHomePage → Offer).

**Problem:** The current DependencyResolver only prevents infinite loops by tracking visited entry IDs. This doesn't stop the graph from exploding when different entries of the same content type reference each other through intermediaries.

---

## Solution Overview

Track content types encountered in each dependency path. When traversing dependencies, if we encounter an entry whose content type already exists in the current ancestry chain:
- Skip syncing that entry
- Stop traversing its dependencies
- Mark it as "pruned" in the graph with visual feedback

This is path-based detection, not global. The same content type can appear in different branches - we only skip when it creates a loop in a single chain of ancestry.

---

## DependencyResolver Changes

**File:** `src/services/DependencyResolver.ts`

Add a `contentTypeChain` parameter that tracks content types in the current path. Pass this down through recursive calls.

```typescript
async resolveEntry(
  entryId: string,
  visited: Set<string>,
  contentTypeChain: Set<string> = new Set()
): Promise<DependencyNode> {

  const entry = await this.fetchEntry(entryId)
  const contentType = entry.sys.contentType.sys.id

  // Check for content type loop
  if (contentTypeChain.has(contentType)) {
    return {
      entry,
      status: 'pruned',
      pruneReason: 'content-type-loop',
      children: []
    }
  }

  // Add this content type to the chain for child resolution
  const newChain = new Set(contentTypeChain).add(contentType)

  // Resolve children with updated chain
  for (const linkedEntry of linkedEntries) {
    children.push(await this.resolveEntry(linkedEntry.id, visited, newChain))
  }
}
```

**Key:** The `contentTypeChain` is copied for each branch, not shared globally. This ensures parallel branches can have the same content type independently.

---

## DependencyNode Type Changes

**File:** `src/services/types.ts` (or wherever DependencyNode is defined)

Add new fields to support pruned status:

```typescript
interface DependencyNode {
  entry: Entry
  children: DependencyNode[]
  status: 'pending' | 'synced' | 'failed' | 'pruned'  // Add 'pruned'
  pruneReason?: 'content-type-loop'                    // New field
}
```

---

## DependencyTree UI Changes

**File:** `src/components/DependencyTree.tsx`

Pruned entries appear in the tree but are visually distinct:

- **Icon:** Skip icon (e.g., ⊘)
- **Color:** Muted/greyed out (e.g., `text-slate-400`)
- **Label:** Content type name with reason
- **Non-expandable:** No children rendered

Example display:
```
✓ Offer "Summer Sale"
  ✓ Location "UK"
    ✓ Language "en-GB"
  ✓ ParentCategory "Seasonal"
    ✓ OfferHomePage "Offers Landing"
      ⊘ Offer "Winter Sale" (skipped - content type loop)
      ⊘ Offer "Spring Sale" (skipped - content type loop)
  ✓ Image "banner.jpg"
```

Tooltip on hover: "This entry was not included because another '[ContentType]' already exists in this dependency path."

---

## SyncEngine Changes

**File:** `src/services/SyncEngine.ts`

Skip pruned entries during sync execution:

```typescript
for (const node of dependencyGraph) {
  if (node.status === 'pruned') {
    skippedCount++
    continue
  }
  // ... existing sync logic
}
```

---

## SyncResults UI Changes

**File:** `src/components/SyncResults.tsx`

Add skipped category to results summary:

```
Sync Complete
├── Synced: 12 entries, 3 assets
├── Skipped: 4 entries (content type loops)
└── Failed: 0
```

Expandable detail showing which entries were skipped and why.

---

## Edge Cases

1. **Assets are exempt:** Assets don't have content types - always synced regardless of repetition.

2. **Entry ID deduplication still applies:** The existing `visited` Set remains for same-entry deduplication across branches.

3. **Depth limit remains:** Max depth (50) stays as safety net for unanticipated edge cases.

4. **Root entry starts the chain:** The root entry's content type is added to the chain first, so direct self-references are also caught.

---

## Files to Modify

1. `src/services/DependencyResolver.ts` - Add contentTypeChain tracking
2. `src/services/types.ts` - Add pruned status and pruneReason to DependencyNode
3. `src/components/DependencyTree.tsx` - Visual treatment for pruned nodes
4. `src/services/SyncEngine.ts` - Skip pruned entries during sync
5. `src/components/SyncResults.tsx` - Show skipped count in results
