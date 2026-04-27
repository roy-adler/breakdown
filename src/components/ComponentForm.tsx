import { useState } from 'react'
import { Package, Users, Layers, Zap, BarChart2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ComponentType, PriceMode, BreakdownComponent } from '../types'
import { TYPE_CONFIG } from './typeConfig'

const TYPE_ICONS: Record<ComponentType, LucideIcon> = {
  material: Package,
  labor: Users,
  assembly: Layers,
  service: Zap,
  overhead: BarChart2,
}

const PRICE_MODES: { value: PriceMode; label: string; desc: string }[] = [
  { value: 'static', label: 'Fixed', desc: 'A fixed price value' },
  { value: 'sum', label: 'Sum', desc: 'Sum of child prices' },
  { value: 'product', label: 'Product', desc: 'Product of child prices' },
]

interface FormState {
  name: string
  type: ComponentType
  priceMode: PriceMode
  staticPrice: string
  quantity: string
}

interface Props {
  initial?: Partial<BreakdownComponent>
  submitLabel: string
  onSubmit: (data: {
    name: string
    type: ComponentType
    priceMode: PriceMode
    staticPrice: number
    quantity: number
  }) => void
}

export function ComponentForm({ initial, submitLabel, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    type: initial?.type ?? 'material',
    priceMode: initial?.priceMode ?? 'static',
    staticPrice: String(initial?.staticPrice ?? 0),
    quantity: String(initial?.quantity ?? 1),
  })

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      name: form.name.trim(),
      type: form.type,
      priceMode: form.priceMode,
      staticPrice: parseFloat(form.staticPrice) || 0,
      quantity: Math.max(1, parseInt(form.quantity) || 1),
    })
  }

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

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">Type</label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(TYPE_CONFIG) as ComponentType[]).map(t => {
            const { label, color } = TYPE_CONFIG[t]
            const Icon = TYPE_ICONS[t]
            const active = form.type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
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

      {/* Price Mode */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">Price Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {PRICE_MODES.map(({ value, label, desc }) => {
            const active = form.priceMode === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => set('priceMode', value)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className={`text-sm font-medium ${active ? 'text-blue-400' : 'text-slate-300'}`}>
                  {label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Price + Quantity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            {form.priceMode === 'static' ? 'Price ($)' : 'Fallback ($)'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.staticPrice}
            onChange={e => set('staticPrice', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
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
        disabled={!form.name.trim()}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
      >
        {submitLabel}
      </button>
    </form>
  )
}
