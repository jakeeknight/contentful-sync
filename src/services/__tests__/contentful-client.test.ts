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
