export type ComponentType = 'material' | 'labor' | 'assembly' | 'service' | 'overhead'

export type PriceMode = 'static' | 'sum' | 'product'

export interface BreakdownComponent {
  id: string
  name: string
  type: ComponentType
  priceMode: PriceMode
  staticPrice: number
  quantity: number
  childIds: string[]
  parentId: string | null
}

export interface ComponentMap {
  [id: string]: BreakdownComponent
}
