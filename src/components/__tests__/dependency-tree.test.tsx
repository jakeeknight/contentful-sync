import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DependencyTree } from '../dependency-tree'
import type { DependencyNode, ContentfulEntry, ContentfulAsset } from '../../types'

describe('DependencyTree', () => {
  const createEntryNode = (id: string, title: string, children: DependencyNode[] = []): DependencyNode => ({
    id,
    type: 'entry',
    data: {
      sys: { id, type: 'Entry', contentType: { sys: { id: 'page' } }, createdAt: '', updatedAt: '', version: 1 },
      fields: { title: { 'en-US': title } }
    } as ContentfulEntry,
    children,
    depth: 0
  })

  const createAssetNode = (id: string, title: string): DependencyNode => ({
    id,
    type: 'asset',
    data: {
      sys: { id, type: 'Asset', createdAt: '', updatedAt: '', version: 1 },
      fields: { title: { 'en-US': title } }
    } as ContentfulAsset,
    children: [],
    depth: 1
  })

  it('renders root entry', () => {
    const root = createEntryNode('root', 'Homepage')
    render(<DependencyTree root={root} />)
    expect(screen.getByText('Homepage')).toBeInTheDocument()
  })

  it('renders entry type badge', () => {
    const root = createEntryNode('root', 'Homepage')
    render(<DependencyTree root={root} />)
    expect(screen.getByText('entry')).toBeInTheDocument()
  })

  it('renders nested children', () => {
    const child = createEntryNode('child', 'Hero Section')
    const root = createEntryNode('root', 'Homepage', [child])
    render(<DependencyTree root={root} />)
    expect(screen.getByText('Homepage')).toBeInTheDocument()
    expect(screen.getByText('Hero Section')).toBeInTheDocument()
  })

  it('renders asset nodes with asset badge', () => {
    const asset = createAssetNode('img', 'Hero Image')
    const root = createEntryNode('root', 'Homepage', [asset])
    render(<DependencyTree root={root} />)
    expect(screen.getByText('Hero Image')).toBeInTheDocument()
    expect(screen.getByText('asset')).toBeInTheDocument()
  })

  it('should display pruned nodes with skip indicator', () => {
    const prunedNode: DependencyNode = {
      id: 'pruned-1',
      type: 'entry',
      data: {
        sys: {
          id: 'pruned-1',
          type: 'Entry',
          contentType: { sys: { id: 'offer' } },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: { title: { 'en-US': 'Pruned Offer' } }
      } as ContentfulEntry,
      children: [],
      depth: 1,
      status: 'pruned',
      pruneReason: 'content-type-loop'
    }

    const root: DependencyNode = {
      id: 'root-1',
      type: 'entry',
      data: {
        sys: {
          id: 'root-1',
          type: 'Entry',
          contentType: { sys: { id: 'page' } },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          version: 1
        },
        fields: { title: { 'en-US': 'Root Page' } }
      } as ContentfulEntry,
      children: [prunedNode],
      depth: 0,
      status: 'resolved'
    }

    render(<DependencyTree root={root} />)

    expect(screen.getByText('Pruned Offer')).toBeInTheDocument()
    expect(screen.getByText('skipped')).toBeInTheDocument()
    expect(screen.getByText(/content type loop/i)).toBeInTheDocument()
  })
})
