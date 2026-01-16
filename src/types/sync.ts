import type { ContentfulEntry, ContentfulAsset } from './contentful'

export type DependencyType = 'entry' | 'asset'

export interface DependencyNode {
  id: string
  type: DependencyType
  data: ContentfulEntry | ContentfulAsset
  children: DependencyNode[]
  depth: number
  status?: 'resolved' | 'pruned'
  pruneReason?: 'content-type-loop'
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
