import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { BreakdownComponent, ComponentMap, ComponentTag, ComponentBehavior, Configuration, Project } from '../types'

const SEED_COMPONENTS: ComponentMap = {
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
  'root-2': {
    id: 'root-2',
    name: 'iOS Development',
    tag: 'labor',
    type: 'leaf',
    staticPrice: 15000,
    quantity: 1,
    childIds: [],
    parentId: null,
  },
}

const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    rootIds: ['root-1'],
    configurations: [],
  },
  {
    id: 'proj-2',
    name: 'Mobile App',
    rootIds: ['root-2'],
    configurations: [],
  },
]

// Guards against circular project references during price calculation
let _calculatingProjects = new Set<string>()

interface AddParams {
  name: string
  tag: ComponentTag
  type: ComponentBehavior
  staticPrice: number
  quantity: number
  parentId: string | null
  projectRefId?: string
}

interface Store {
  projects: Project[]
  activeProjectId: string
  drillStack: string[]
  components: ComponentMap

  addProject: (name: string) => string
  removeProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  setActiveProject: (id: string) => void
  drillInto: (projectId: string) => void
  drillBack: () => void

  addComponent: (params: AddParams) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<BreakdownComponent>) => void
  calculatePrice: (id: string) => number
  calculateProjectTotal: (projectId: string) => number
  setActiveChoice: (nodeId: string, childId: string) => void

  saveConfiguration: (projectId: string, name: string) => void
  loadConfiguration: (projectId: string, configId: string) => void
  deleteConfiguration: (projectId: string, configId: string) => void
}

export const useStore = create<Store>((set, get) => ({
  projects: SEED_PROJECTS,
  activeProjectId: 'proj-1',
  drillStack: [],
  components: SEED_COMPONENTS,

  addProject: (name: string) => {
    const id = uuidv4()
    set(state => ({
      projects: [...state.projects, { id, name, rootIds: [], configurations: [] }],
      activeProjectId: id,
      drillStack: [],
    }))
    return id
  },

  removeProject: (id: string) => {
    set(state => {
      const project = state.projects.find(p => p.id === id)
      if (!project) return state

      const collectIds = (cid: string, map: ComponentMap): string[] => {
        const comp = map[cid]
        if (!comp) return []
        return [cid, ...comp.childIds.flatMap(child => collectIds(child, map))]
      }

      const toRemove = new Set(project.rootIds.flatMap(rid => collectIds(rid, state.components)))
      const components: ComponentMap = {}
      for (const [k, v] of Object.entries(state.components)) {
        if (!toRemove.has(k)) components[k] = v
      }

      const projects = state.projects.filter(p => p.id !== id)
      const newActiveId = state.activeProjectId === id
        ? (projects[0]?.id ?? '')
        : state.activeProjectId

      return { projects, components, activeProjectId: newActiveId, drillStack: [] }
    })
  },

  renameProject: (id: string, name: string) => {
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, name } : p),
    }))
  },

  setActiveProject: (id: string) => {
    set({ activeProjectId: id, drillStack: [] })
  },

  drillInto: (projectId: string) => {
    set(state => ({
      drillStack: [...state.drillStack, state.activeProjectId],
      activeProjectId: projectId,
    }))
  },

  drillBack: () => {
    set(state => {
      if (state.drillStack.length === 0) return state
      const stack = [...state.drillStack]
      const prev = stack.pop()!
      return { drillStack: stack, activeProjectId: prev }
    })
  },

  addComponent: ({ name, tag, type, staticPrice, quantity, parentId, projectRefId }) => {
    const id = uuidv4()
    const newComp: BreakdownComponent = {
      id, name, tag, type, staticPrice, quantity,
      childIds: [], parentId, projectRefId,
    }

    set(state => {
      const updated: ComponentMap = { ...state.components, [id]: newComp }

      if (parentId && state.components[parentId]) {
        const parent = state.components[parentId]
        updated[parentId] = { ...parent, childIds: [...parent.childIds, id] }
        if (parent.type === 'choice' && !parent.activeChildId) {
          updated[parentId] = { ...updated[parentId], activeChildId: id }
        }
      }

      const updatedProjects = parentId
        ? state.projects
        : state.projects.map(p =>
            p.id === state.activeProjectId
              ? { ...p, rootIds: [...p.rootIds, id] }
              : p
          )

      return { components: updated, projects: updatedProjects }
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
          if (filtered.type === 'choice' && filtered.activeChildId && toRemove.has(filtered.activeChildId)) {
            filtered.activeChildId = filtered.childIds[0] ?? undefined
          }
          updated[k] = filtered
        }
      }

      const removedComp = state.components[id]
      const updatedProjects = removedComp?.parentId
        ? state.projects
        : state.projects.map(p => ({ ...p, rootIds: p.rootIds.filter(rid => rid !== id) }))

      return { components: updated, projects: updatedProjects }
    })
  },

  updateComponent: (id, updates) => {
    set(state => ({
      components: { ...state.components, [id]: { ...state.components[id], ...updates } },
    }))
  },

  calculateProjectTotal: (projectId: string): number => {
    if (_calculatingProjects.has(projectId)) return 0
    _calculatingProjects.add(projectId)
    try {
      const { projects, calculatePrice } = get()
      const project = projects.find(p => p.id === projectId)
      if (!project) return 0
      return project.rootIds.reduce((sum, id) => sum + calculatePrice(id), 0)
    } finally {
      _calculatingProjects.delete(projectId)
    }
  },

  calculatePrice: (id: string): number => {
    const { components, calculatePrice, calculateProjectTotal } = get()
    const comp = components[id]
    if (!comp) return 0

    if (comp.type === 'projectRef') {
      if (!comp.projectRefId) return 0
      return calculateProjectTotal(comp.projectRefId) * comp.quantity
    }

    if (comp.type === 'leaf') {
      return comp.staticPrice * comp.quantity
    }

    if (comp.type === 'group') {
      return comp.childIds.reduce((sum, cid) => sum + calculatePrice(cid), 0) * comp.quantity
    }

    if (comp.type === 'choice') {
      if (!comp.activeChildId) return 0
      return calculatePrice(comp.activeChildId) * comp.quantity
    }

    return 0
  },

  setActiveChoice: (nodeId: string, childId: string) => {
    set(state => {
      const node = state.components[nodeId]
      if (!node || node.type !== 'choice' || !node.childIds.includes(childId)) return state
      return {
        components: { ...state.components, [nodeId]: { ...node, activeChildId: childId } },
      }
    })
  },

  saveConfiguration: (projectId: string, name: string) => {
    set(state => {
      const project = state.projects.find(p => p.id === projectId)
      if (!project) return state

      const choices: Record<string, string> = {}
      const traverse = (id: string) => {
        const comp = state.components[id]
        if (!comp) return
        if (comp.type === 'choice' && comp.activeChildId) choices[id] = comp.activeChildId
        comp.childIds.forEach(cid => traverse(cid))
      }
      project.rootIds.forEach(rid => traverse(rid))

      const config: Configuration = { id: uuidv4(), name, choices, createdAt: Date.now() }
      return {
        projects: state.projects.map(p =>
          p.id === projectId ? { ...p, configurations: [...p.configurations, config] } : p
        ),
      }
    })
  },

  loadConfiguration: (projectId: string, configId: string) => {
    set(state => {
      const project = state.projects.find(p => p.id === projectId)
      const config = project?.configurations.find(c => c.id === configId)
      if (!config) return state

      const updated = { ...state.components }
      for (const [nodeId, childId] of Object.entries(config.choices)) {
        const node = updated[nodeId]
        if (node && node.type === 'choice' && node.childIds.includes(childId)) {
          updated[nodeId] = { ...node, activeChildId: childId }
        }
      }
      return { components: updated }
    })
  },

  deleteConfiguration: (projectId: string, configId: string) => {
    set(state => ({
      projects: state.projects.map(p =>
        p.id === projectId
          ? { ...p, configurations: p.configurations.filter(c => c.id !== configId) }
          : p
      ),
    }))
  },
}))
