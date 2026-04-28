export type ComponentTag = 'material' | 'labor' | 'assembly' | 'service' | 'overhead'

export type ComponentBehavior = 'leaf' | 'group' | 'choice' | 'projectRef'

export interface Configuration {
  id: string
  name: string
  choices: Record<string, string>
  createdAt: number
}

export interface Project {
  id: string
  name: string
  rootIds: string[]
  configurations: Configuration[]
}

export interface BreakdownComponent {
  id: string
  name: string
  tag: ComponentTag
  type: ComponentBehavior
  staticPrice: number
  quantity: number
  childIds: string[]
  parentId: string | null
  activeChildId?: string
  projectRefId?: string
}

export interface ComponentMap {
  [id: string]: BreakdownComponent
}
