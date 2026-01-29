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

export interface SyncEntryResult {
  success: boolean
  error?: string
}

export interface SyncAssetResult {
  success: boolean
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
      // Contentful SDK returns errors with message as JSON string
      let message = 'Unknown error'
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message)
          message = parsed.message || error.message
        } catch {
          message = error.message
        }
      }
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
      let message = 'Unknown error'
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message)
          message = parsed.message || error.message
        } catch {
          message = error.message
        }
      }
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
      let message = 'Unknown error'
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message)
          message = parsed.message || error.message
        } catch {
          message = error.message
        }
      }
      return { success: false, error: message }
    }
  }

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
      let message = 'Unknown error'
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message)
          message = parsed.message || error.message
        } catch {
          message = error.message
        }
      }
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newAsset = await this.targetEnv.createAssetWithId(asset.sys.id, {
          fields: asset.fields as any
        })

        // Process the asset (required for Contentful to make it available)
        await newAsset.processForAllLocales()
      }

      return { success: true }
    } catch (error) {
      let message = 'Unknown error'
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message)
          message = parsed.message || error.message
        } catch {
          message = error.message
        }
      }
      return { success: false, error: message }
    }
  }
}
