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

    // Count pruned nodes
    let skippedCount = 0
    for (const node of graph.allNodes.values()) {
      if (node.status === 'pruned') {
        skippedCount++
      }
    }

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
      skippedCount,
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

      // Skip pruned nodes - don't add to execution order
      if (node.status === 'pruned') {
        return
      }

      // Sort children so assets are visited before entries at each level
      // This ensures assets are synced before entries that reference them
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

    // Visit all nodes from the allNodes map to ensure we sync everything
    // including disconnected nodes
    for (const node of graph.allNodes.values()) {
      visit(node)
    }

    return order
  }
}
