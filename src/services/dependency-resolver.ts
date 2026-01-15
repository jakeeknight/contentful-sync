import type { ContentfulClient } from './contentful-client'
import type {
  ContentfulEntry,
  ContentfulAsset,
  ContentfulLink,
  DependencyNode,
  DependencyGraph
} from '../types'

/**
 * Resolves dependencies for a Contentful entry by recursively traversing linked entries and assets.
 *
 * NOTE: This resolver is not thread-safe. Do not call resolve() concurrently on the same instance.
 */
export class DependencyResolver {
  private client: ContentfulClient
  private visited: Set<string> = new Set()
  private allNodes: Map<string, DependencyNode> = new Map()
  private entryCount = 0
  private assetCount = 0
  private maxDepth: number = 50

  constructor(client: ContentfulClient, maxDepth: number = 50) {
    this.client = client
    this.maxDepth = maxDepth
  }

  async resolve(entryId: string): Promise<DependencyGraph> {
    this.visited.clear()
    this.allNodes.clear()
    this.entryCount = 0
    this.assetCount = 0

    const root = await this.resolveEntry(entryId, 0)

    if (!root) {
      throw new Error(`Failed to resolve entry: ${entryId}`)
    }

    return {
      root,
      allNodes: this.allNodes,
      entryCount: this.entryCount,
      assetCount: this.assetCount
    }
  }

  private async resolveEntry(entryId: string, depth: number): Promise<DependencyNode | null> {
    if (this.visited.has(`entry:${entryId}`)) {
      return this.allNodes.get(`entry:${entryId}`) || null
    }

    if (depth >= this.maxDepth) {
      return this.allNodes.get(`entry:${entryId}`) || null
    }

    this.visited.add(`entry:${entryId}`)

    const result = await this.client.getEntry(entryId)
    if (!result.success || !result.entry) {
      return null
    }

    const entry = result.entry
    this.entryCount++

    const node: DependencyNode = {
      id: entryId,
      type: 'entry',
      data: entry,
      children: [],
      depth
    }

    this.allNodes.set(`entry:${entryId}`, node)

    // Find all links in fields
    const links = this.extractLinks(entry.fields)

    for (const link of links) {
      if (link.sys.linkType === 'Entry') {
        const childNode = await this.resolveEntry(link.sys.id, depth + 1)
        if (childNode && !node.children.some(c => c.id === childNode.id)) {
          node.children.push(childNode)
        }
      } else if (link.sys.linkType === 'Asset') {
        const assetNode = await this.resolveAsset(link.sys.id, depth + 1)
        if (assetNode && !node.children.some(c => c.id === assetNode.id)) {
          node.children.push(assetNode)
        }
      }
    }

    return node
  }

  private async resolveAsset(assetId: string, depth: number): Promise<DependencyNode | null> {
    if (this.visited.has(`asset:${assetId}`)) {
      return this.allNodes.get(`asset:${assetId}`) || null
    }

    if (depth >= this.maxDepth) {
      return this.allNodes.get(`asset:${assetId}`) || null
    }

    this.visited.add(`asset:${assetId}`)

    const result = await this.client.getAsset(assetId)
    if (!result.success || !result.asset) {
      return null
    }

    this.assetCount++

    const node: DependencyNode = {
      id: assetId,
      type: 'asset',
      data: result.asset,
      children: [],
      depth
    }

    this.allNodes.set(`asset:${assetId}`, node)
    return node
  }

  private extractLinks(obj: unknown): ContentfulLink[] {
    const links: ContentfulLink[] = []

    if (obj === null || obj === undefined) {
      return links
    }

    if (typeof obj === 'object') {
      if (this.isLink(obj)) {
        links.push(obj as ContentfulLink)
      } else if (Array.isArray(obj)) {
        for (const item of obj) {
          links.push(...this.extractLinks(item))
        }
      } else {
        for (const value of Object.values(obj)) {
          links.push(...this.extractLinks(value))
        }
      }
    }

    return links
  }

  private isLink(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) return false
    const sys = (obj as Record<string, unknown>).sys
    if (typeof sys !== 'object' || sys === null) return false
    return (sys as Record<string, unknown>).type === 'Link'
  }
}
