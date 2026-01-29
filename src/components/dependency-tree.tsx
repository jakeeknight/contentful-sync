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
          flex items-center gap-2 py-2 px-3 rounded-lg
          hover:bg-[#fafafa] cursor-pointer
          transition-colors duration-150 ease-out
          ${level > 0 ? 'ml-6' : ''}
          ${isPruned ? 'opacity-60' : ''}
        `}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className="text-[#9b9b9b] w-4 text-center transition-transform duration-200">
            {expanded ? (
              <svg className="w-3 h-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}

        <span className={`text-lg ${isPruned ? 'text-[#9b9b9b]' : node.type === 'entry' ? 'text-[#4f46e5]' : 'text-[#047857]'}`}>
          {isPruned ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ) : node.type === 'entry' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </span>

        <span className={`font-medium ${isPruned ? 'text-[#6b6b6b]' : 'text-[#1a1a1a]'}`}>
          {title}
        </span>

        <span className="text-[#9b9b9b] text-sm">({contentType})</span>

        {isPruned ? (
          <>
            <Badge variant="skipped">skipped</Badge>
            <span className="text-[#d97706] text-xs font-medium">
              {node.pruneReason === 'entry-loop' ? 'entry loop' : 'content type loop'}
            </span>
          </>
        ) : (
          <Badge variant={node.type === 'entry' ? 'entry' : 'asset'}>
            {node.type}
          </Badge>
        )}

        {!isPruned && <span className="text-[#d4d4d4] text-xs font-mono">{node.id.slice(0, 8)}</span>}
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-[#e8e8e8] ml-5 pl-1">
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
