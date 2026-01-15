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
