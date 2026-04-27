export type ComponentTag = 'material' | 'labor' | 'assembly' | 'service' | 'overhead'

export type ComponentBehavior = 'leaf' | 'group' | 'choice'

export interface Configuration {
  id: string
  name: string
  choices: Record<string, string>  // { choiceNodeId: activeChildId }
  createdAt: number
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
}

export interface ComponentMap {
  [id: string]: BreakdownComponent
}
