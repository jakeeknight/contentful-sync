import { describe, it, expect, vi } from 'vitest'
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
