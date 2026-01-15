export interface ContentfulEntry {
  sys: {
    id: string
    type: 'Entry'
    contentType: {
      sys: {
        id: string
      }
    }
    createdAt: string
    updatedAt: string
    publishedAt?: string
    version: number
  }
  fields: Record<string, unknown>
}

export interface ContentfulAsset {
  sys: {
    id: string
    type: 'Asset'
    createdAt: string
    updatedAt: string
    publishedAt?: string
    version: number
  }
  fields: {
    title?: Record<string, string>
    description?: Record<string, string>
    file?: Record<string, {
      url: string
      fileName: string
      contentType: string
      details: {
        size: number
        image?: {
          width: number
          height: number
        }
      }
    }>
  }
}

export interface ContentfulLink {
  sys: {
    type: 'Link'
    linkType: 'Entry' | 'Asset'
    id: string
  }
}

export interface ContentfulEnvironment {
  sys: {
    id: string
  }
  name: string
}

export interface ContentfulSpace {
  sys: {
    id: string
  }
  name: string
}

export type ContentfulItem = ContentfulEntry | ContentfulAsset
