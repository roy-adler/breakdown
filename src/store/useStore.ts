import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { BreakdownComponent, ComponentMap, ComponentTag, ComponentBehavior, Configuration } from '../types'

// Seed data — a sample breakdown to show immediately
const SEED: ComponentMap = {
  'root-1': {
    id: 'root-1',
    name: 'Website Redesign',
    tag: 'assembly',
    type: 'group',
    staticPrice: 0,
    quantity: 1,
    childIds: ['comp-2', 'comp-3', 'comp-6'],
    parentId: null,
  },
  'comp-2': {
    id: 'comp-2',
    name: 'Design Phase',
    tag: 'labor',
    type: 'leaf',
    staticPrice: 5000,
    quantity: 1,
    childIds: [],
    parentId: 'root-1',
  },
  'comp-3': {
    id: 'comp-3',
    name: 'Development',
    tag: 'assembly',
    type: 'group',
    staticPrice: 0,
    quantity: 1,
    childIds: ['comp-4', 'comp-5'],
    parentId: 'root-1',
    activeChildId: 'comp-4',
  },
  'comp-4': {
    id: 'comp-4',
    name: 'Frontend',
    tag: 'labor',
    type: 'leaf',
    staticPrice: 8000,
    quantity: 1,
    childIds: [],
    parentId: 'comp-3',
  },
  'comp-5': {
    id: 'comp-5',
    name: 'Backend',
    tag: 'labor',
    type: 'leaf',
    staticPrice: 6000,
    quantity: 1,
    childIds: [],
    parentId: 'comp-3',
  },
  'comp-6': {
    id: 'comp-6',
    name: 'Cloud Hosting',
    tag: 'service',
    type: 'leaf',
    staticPrice: 200,
    quantity: 12,
    childIds: [],
    parentId: 'root-1',
  },
}

interface AddParams {
  name: string
  tag: ComponentTag
  type: ComponentBehavior
  staticPrice: number
  quantity: number
  parentId: string | null
}

interface Store {
  components: ComponentMap
  rootIds: string[]
  rootConfigurations: Record<string, Configuration[]>
  addComponent: (params: AddParams) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<BreakdownComponent>) => void
  calculatePrice: (id: string) => number
  setActiveChoice: (nodeId: string, childId: string) => void
  saveConfiguration: (rootId: string, name: string) => void
  loadConfiguration: (rootId: string, configId: string) => void
  deleteConfiguration: (rootId: string, configId: string) => void
  collectChoices: (nodeId: string) => Record<string, string>
}

export const useStore = create<Store>((set, get) => ({
  components: SEED,
  rootIds: ['root-1'],
  rootConfigurations: { 'root-1': [] },

  addComponent: ({ name, tag, type, staticPrice, quantity, parentId }) => {
    const id = uuidv4()
    const newComp: BreakdownComponent = {
      id,
      name,
      tag,
      type,
      staticPrice,
      quantity,
      childIds: [],
      parentId,
    }

    // For choice nodes, set the first child as active
    if (type === 'choice' && parentId) {
      // activeChildId will be set when first child is added
    }

    set(state => {
      const updated: ComponentMap = { ...state.components, [id]: newComp }

      if (parentId && state.components[parentId]) {
        const parent = state.components[parentId]
        updated[parentId] = {
          ...parent,
          childIds: [...parent.childIds, id],
        }

        // If parent is a choice node and has no active child, set this as active
        if (parent.type === 'choice' && !parent.activeChildId) {
          updated[parentId] = { ...updated[parentId], activeChildId: id }
        }
      }

      return {
        components: updated,
        rootIds: parentId ? state.rootIds : [...state.rootIds, id],
      }
    })
  },

  removeComponent: (id: string) => {
    const collectIds = (cid: string, map: ComponentMap): string[] => {
      const comp = map[cid]
      if (!comp) return []
      return [cid, ...comp.childIds.flatMap(child => collectIds(child, map))]
    }

    set(state => {
      const toRemove = new Set(collectIds(id, state.components))
      const updated: ComponentMap = {}

      for (const [k, v] of Object.entries(state.components)) {
        if (!toRemove.has(k)) {
          const filtered = { ...v, childIds: v.childIds.filter(cid => !toRemove.has(cid)) }
          // If this was a choice node and its active child was removed, clear activeChildId
          if (filtered.type === 'choice' && filtered.activeChildId && toRemove.has(filtered.activeChildId)) {
            filtered.activeChildId = filtered.childIds.length > 0 ? filtered.childIds[0] : undefined
          }
          updated[k] = filtered
        }
      }

      const removedComp = state.components[id]
      const newRootIds = removedComp?.parentId
        ? state.rootIds
        : state.rootIds.filter(rid => rid !== id)

      return { components: updated, rootIds: newRootIds }
    })
  },

  updateComponent: (id, updates) => {
    set(state => ({
      components: { ...state.components, [id]: { ...state.components[id], ...updates } },
    }))
  },

  setActiveChoice: (nodeId: string, childId: string) => {
    set(state => {
      const node = state.components[nodeId]
      if (!node || node.type !== 'choice') return state
      if (!node.childIds.includes(childId)) return state

      return {
        components: {
          ...state.components,
          [nodeId]: { ...node, activeChildId: childId },
        },
      }
    })
  },

  calculatePrice: (id: string): number => {
    const { components, calculatePrice } = get()
    const comp = components[id]
    if (!comp) return 0

    if (comp.type === 'leaf') {
      return comp.staticPrice * comp.quantity
    }

    if (comp.type === 'group') {
      const childPrices = comp.childIds.map(cid => calculatePrice(cid))
      return childPrices.reduce((a, b) => a + b, 0) * comp.quantity
    }

    if (comp.type === 'choice') {
      if (!comp.activeChildId) return comp.staticPrice * comp.quantity
      return calculatePrice(comp.activeChildId) * comp.quantity
    }

    return 0
  },

  collectChoices: (nodeId: string): Record<string, string> => {
    const { components } = get()
    const result: Record<string, string> = {}

    const traverse = (id: string) => {
      const comp = components[id]
      if (!comp) return

      if (comp.type === 'choice' && comp.activeChildId) {
        result[id] = comp.activeChildId
      }

      comp.childIds.forEach(cid => traverse(cid))
    }

    traverse(nodeId)
    return result
  },

  saveConfiguration: (rootId: string, name: string) => {
    set(state => {
      const choices = get().collectChoices(rootId)
      const config: Configuration = {
        id: uuidv4(),
        name,
        choices,
        createdAt: Date.now(),
      }

      const configs = state.rootConfigurations[rootId] || []
      return {
        rootConfigurations: {
          ...state.rootConfigurations,
          [rootId]: [...configs, config],
        },
      }
    })
  },

  loadConfiguration: (rootId: string, configId: string) => {
    set(state => {
      const config = state.rootConfigurations[rootId]?.find(c => c.id === configId)
      if (!config) return state

      const updated = { ...state.components }

      // Apply all choices from the configuration
      for (const [nodeId, childId] of Object.entries(config.choices)) {
        const node = updated[nodeId]
        if (node && node.type === 'choice' && node.childIds.includes(childId)) {
          updated[nodeId] = { ...node, activeChildId: childId }
        }
      }

      return { components: updated }
    })
  },

  deleteConfiguration: (rootId: string, configId: string) => {
    set(state => ({
      rootConfigurations: {
        ...state.rootConfigurations,
        [rootId]: (state.rootConfigurations[rootId] || []).filter(c => c.id !== configId),
      },
    }))
  },
}))
