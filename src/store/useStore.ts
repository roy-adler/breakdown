import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { BreakdownComponent, ComponentMap, ComponentType, PriceMode } from '../types'

// Seed data — a sample breakdown to show immediately
const SEED: ComponentMap = {
  'root-1': {
    id: 'root-1',
    name: 'Website Redesign',
    type: 'assembly',
    priceMode: 'sum',
    staticPrice: 0,
    quantity: 1,
    childIds: ['comp-2', 'comp-3', 'comp-6'],
    parentId: null,
  },
  'comp-2': {
    id: 'comp-2',
    name: 'Design Phase',
    type: 'labor',
    priceMode: 'static',
    staticPrice: 5000,
    quantity: 1,
    childIds: [],
    parentId: 'root-1',
  },
  'comp-3': {
    id: 'comp-3',
    name: 'Development',
    type: 'assembly',
    priceMode: 'sum',
    staticPrice: 0,
    quantity: 1,
    childIds: ['comp-4', 'comp-5'],
    parentId: 'root-1',
  },
  'comp-4': {
    id: 'comp-4',
    name: 'Frontend',
    type: 'labor',
    priceMode: 'static',
    staticPrice: 8000,
    quantity: 1,
    childIds: [],
    parentId: 'comp-3',
  },
  'comp-5': {
    id: 'comp-5',
    name: 'Backend',
    type: 'labor',
    priceMode: 'static',
    staticPrice: 6000,
    quantity: 1,
    childIds: [],
    parentId: 'comp-3',
  },
  'comp-6': {
    id: 'comp-6',
    name: 'Cloud Hosting',
    type: 'service',
    priceMode: 'static',
    staticPrice: 200,
    quantity: 12,
    childIds: [],
    parentId: 'root-1',
  },
}

interface AddParams {
  name: string
  type: ComponentType
  priceMode: PriceMode
  staticPrice: number
  quantity: number
  parentId: string | null
}

interface Store {
  components: ComponentMap
  rootIds: string[]
  addComponent: (params: AddParams) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<BreakdownComponent>) => void
  calculatePrice: (id: string) => number
}

export const useStore = create<Store>((set, get) => ({
  components: SEED,
  rootIds: ['root-1'],

  addComponent: ({ name, type, priceMode, staticPrice, quantity, parentId }) => {
    const id = uuidv4()
    const newComp: BreakdownComponent = {
      id,
      name,
      type,
      priceMode,
      staticPrice,
      quantity,
      childIds: [],
      parentId,
    }

    set(state => {
      const updated: ComponentMap = { ...state.components, [id]: newComp }

      if (parentId && state.components[parentId]) {
        updated[parentId] = {
          ...state.components[parentId],
          childIds: [...state.components[parentId].childIds, id],
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
          updated[k] = { ...v, childIds: v.childIds.filter(cid => !toRemove.has(cid)) }
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

  calculatePrice: (id: string): number => {
    const { components, calculatePrice } = get()
    const comp = components[id]
    if (!comp) return 0

    if (comp.priceMode === 'static' || comp.childIds.length === 0) {
      return comp.staticPrice * comp.quantity
    }

    const childPrices = comp.childIds.map(cid => calculatePrice(cid))

    if (comp.priceMode === 'sum') {
      return childPrices.reduce((a, b) => a + b, 0) * comp.quantity
    }

    if (comp.priceMode === 'product') {
      return childPrices.reduce((a, b) => a * b, 1) * comp.quantity
    }

    return 0
  },
}))
