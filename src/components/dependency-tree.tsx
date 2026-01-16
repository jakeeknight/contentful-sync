import { useState } from 'react'
import type { DependencyNode, ContentfulEntry, ContentfulAsset } from '../types'
import { Badge } from './ui/badge'

interface DependencyTreeProps {
  root: DependencyNode
}

interface TreeNodeProps {
  node: DependencyNode
  level: number
}

function getEntryTitle(entry: ContentfulEntry): string {
  const fields = entry.fields
  // Try common title field names
  for (const key of ['title', 'name', 'internalName', 'slug']) {
    const field = fields[key]
    if (field && typeof field === 'object') {
      const localized = field as Record<string, unknown>
      const value = localized['en-US'] || Object.values(localized)[0]
      if (typeof value === 'string') return value
    }
  }
  return entry.sys.id
}

function getAssetTitle(asset: ContentfulAsset): string {
  const title = asset.fields.title
  if (title) {
    return title['en-US'] || Object.values(title)[0] || asset.sys.id
  }
  return asset.sys.id
}

function TreeNode({ node, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isPruned = node.status === 'pruned'

  const title = node.type === 'entry'
    ? getEntryTitle(node.data as ContentfulEntry)
    : getAssetTitle(node.data as ContentfulAsset)

  const contentType = node.type === 'entry'
    ? (node.data as ContentfulEntry).sys.contentType.sys.id
    : 'Asset'

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-md
          hover:bg-slate-50 cursor-pointer
          ${level > 0 ? 'ml-6' : ''}
          ${isPruned ? 'opacity-60' : ''}
        `}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className="text-slate-400 w-4 text-center">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}

        <span className="text-slate-400">
          {isPruned ? '⊘' : node.type === 'entry' ? '📄' : '🖼️'}
        </span>

        <span className={`font-medium ${isPruned ? 'text-slate-500' : 'text-slate-900'}`}>
          {title}
        </span>

        <span className="text-slate-500 text-sm">({contentType})</span>

        {isPruned ? (
          <>
            <Badge variant="skipped">skipped</Badge>
            <span className="text-amber-600 text-xs">content type loop</span>
          </>
        ) : (
          <Badge variant={node.type === 'entry' ? 'entry' : 'asset'}>
            {node.type}
          </Badge>
        )}

        {!isPruned && <span className="text-slate-400 text-xs">{node.id}</span>}
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-slate-200 ml-4">
          {node.children.map(child => (
            <TreeNode key={`${child.type}:${child.id}`} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function DependencyTree({ root }: DependencyTreeProps) {
  return (
    <div className="font-mono text-sm">
      <TreeNode node={root} level={0} />
    </div>
  )
}
