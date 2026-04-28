import { useState, useEffect } from 'react'
import { Package, Users, Layers, Zap, BarChart2, Leaf, GitBranch, Radio, FolderOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ComponentTag, ComponentBehavior, BreakdownComponent } from '../types'
import { TYPE_CONFIG } from './typeConfig'

const TAG_ICONS: Record<ComponentTag, LucideIcon> = {
  material: Package,
  labor: Users,
  assembly: Layers,
  service: Zap,
  overhead: BarChart2,
}

const BEHAVIOR_TYPES: { value: ComponentBehavior; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'leaf',       label: 'Leaf',        desc: 'Fixed price item',       icon: Leaf },
  { value: 'group',      label: 'Group',       desc: 'Sums children',          icon: GitBranch },
  { value: 'choice',     label: 'Choice',      desc: 'Pick one child',         icon: Radio },
  { value: 'projectRef', label: 'Project Ref', desc: 'Embed another project',  icon: FolderOpen },
]

interface FormState {
  name: string
  tag: ComponentTag
  type: ComponentBehavior
  staticPrice: string
  quantity: string
  projectRefId: string
}

interface Props {
  initial?: Partial<BreakdownComponent>
  submitLabel: string
  availableProjects?: { id: string; name: string }[]
  onSubmit: (data: {
    name: string
    tag: ComponentTag
    type: ComponentBehavior
    staticPrice: number
    quantity: number
    projectRefId?: string
  }) => void
}

export function ComponentForm({ initial, submitLabel, availableProjects = [], onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    tag: initial?.tag ?? 'material',
    type: initial?.type ?? 'leaf',
    staticPrice: String(initial?.staticPrice ?? 0),
    quantity: String(initial?.quantity ?? 1),
    projectRefId: initial?.projectRefId ?? availableProjects[0]?.id ?? '',
  })

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const handleTypeChange = (value: ComponentBehavior) => {
    setForm(prev => ({
      ...prev,
      type: value,
      projectRefId: value === 'projectRef' && !prev.projectRefId
        ? (availableProjects[0]?.id ?? '')
        : prev.projectRefId,
    }))
  }

  useEffect(() => {
    if (form.type === 'projectRef' && !form.projectRefId && availableProjects.length > 0) {
      set('projectRefId', availableProjects[0].id)
    }
  }, [availableProjects, form.type, form.projectRefId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (form.type === 'projectRef' && !form.projectRefId) return
    onSubmit({
      name: form.name.trim(),
      tag: form.tag,
      type: form.type,
      staticPrice: parseFloat(form.staticPrice) || 0,
      quantity: Math.max(1, parseInt(form.quantity) || 1),
      projectRefId: form.type === 'projectRef' ? form.projectRefId : undefined,
    })
  }

  const priceDisabled = form.type === 'group' || form.type === 'choice' || form.type === 'projectRef'
  const noProjects = form.type === 'projectRef' && availableProjects.length === 0

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">Name</label>
        <input
          autoFocus
          type="text"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Component name…"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Tag */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">Tag</label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(TYPE_CONFIG) as ComponentTag[]).map(t => {
            const { label, color } = TYPE_CONFIG[t]
            const Icon = TAG_ICONS[t]
            const active = form.tag === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => set('tag', t)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                  active ? 'border-current' : 'border-slate-700 hover:border-slate-600'
                }`}
                style={active ? { borderColor: color, backgroundColor: `${color}18` } : {}}
              >
                <Icon size={18} style={{ color: active ? color : '#64748b' }} />
                <span className="text-xs" style={{ color: active ? color : '#64748b' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Behavior Type */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {BEHAVIOR_TYPES.map(({ value, label, desc, icon: BIcon }) => {
            const active = form.type === value
            const disabled = value === 'projectRef' && availableProjects.length === 0
            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => handleTypeChange(value)}
                className={`p-2.5 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  active
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BIcon size={14} style={{ color: active ? '#60a5fa' : '#94a3b8' }} />
                  <div className={`text-sm font-medium ${active ? 'text-blue-400' : 'text-slate-300'}`}>
                    {label}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {disabled ? 'No other projects yet' : desc}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Project selector */}
      {form.type === 'projectRef' && !noProjects && (
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Referenced Project</label>
          <select
            value={form.projectRefId}
            onChange={e => set('projectRefId', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          >
            {availableProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Price + Quantity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.staticPrice}
            onChange={e => set('staticPrice', e.target.value)}
            disabled={priceDisabled}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {form.type === 'group' && <p className="text-xs text-slate-500 mt-1">Sums children</p>}
          {form.type === 'choice' && <p className="text-xs text-slate-500 mt-1">Uses active child</p>}
          {form.type === 'projectRef' && <p className="text-xs text-slate-500 mt-1">Taken from project total</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Quantity</label>
          <input
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!form.name.trim() || noProjects}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
      >
        {submitLabel}
      </button>
    </form>
  )
}
