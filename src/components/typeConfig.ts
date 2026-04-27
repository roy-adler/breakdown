import type { ComponentType } from '../types'

export const TYPE_CONFIG: Record<
  ComponentType,
  { label: string; color: string; bgClass: string }
> = {
  material: { label: 'Material', color: '#3b82f6', bgClass: 'bg-blue-500/10' },
  labor: { label: 'Labor', color: '#10b981', bgClass: 'bg-emerald-500/10' },
  assembly: { label: 'Assembly', color: '#8b5cf6', bgClass: 'bg-violet-500/10' },
  service: { label: 'Service', color: '#06b6d4', bgClass: 'bg-cyan-500/10' },
  overhead: { label: 'Overhead', color: '#f59e0b', bgClass: 'bg-amber-500/10' },
}
