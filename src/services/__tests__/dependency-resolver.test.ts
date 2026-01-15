import { describe, it, expect, vi } from 'vitest'
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

    it('should throw error when root entry not found', async () => {
      const mockClient = createMockClient()
      mockClient.getEntry.mockResolvedValue({ success: false, error: 'Not found' })

      const resolver = new DependencyResolver(mockClient as unknown as ContentfulClient)

      await expect(resolver.resolve('nonexistent')).rejects.toThrow('Failed to resolve entry')
    })
  })
})
