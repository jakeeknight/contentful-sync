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
})
