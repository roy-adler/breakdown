import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calculator } from 'lucide-react'
import { useStore } from './store/useStore'
import { ComponentNode } from './components/ComponentNode'
import { AddComponentModal } from './components/AddComponentModal'
import { formatPrice } from './utils/format'

export default function App() {
  const components = useStore(s => s.components)
  const rootIds = useStore(s => s.rootIds)
  const calculatePrice = useStore(s => s.calculatePrice)
  const [showAdd, setShowAdd] = useState(false)

  const total = rootIds.reduce((sum, id) => sum + calculatePrice(id), 0)
  const componentCount = Object.keys(components).length

  return (
    <div className="min-h-screen bg-[#080812] text-slate-200 flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-[#0a0a18]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Calculator size={17} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-100 leading-none tracking-tight">
                Breakdown Calculator
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {componentCount} component{componentCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Total</p>
              <motion.p
                key={total}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="font-bold text-xl text-slate-100 tabular-nums"
              >
                {formatPrice(total)}
              </motion.p>
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.97]"
            >
              <Plus size={15} />
              Add Component
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-1">
        {rootIds.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <AnimatePresence mode="popLayout">
            {rootIds.map(id => (
              <ComponentNode key={id} id={id} />
            ))}
          </AnimatePresence>
        )}
      </main>

      {/* ── Legend ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 py-4">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center gap-4">
          {(
            [
              { label: 'Material', color: '#3b82f6' },
              { label: 'Labor', color: '#10b981' },
              { label: 'Assembly', color: '#8b5cf6' },
              { label: 'Service', color: '#06b6d4' },
              { label: 'Overhead', color: '#f59e0b' },
            ] as const
          ).map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
          <span className="ml-auto text-xs text-slate-600">Hover a card for actions</span>
        </div>
      </footer>

      <AnimatePresence>
        {showAdd && <AddComponentModal parentId={null} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-5"
      >
        <Calculator size={26} className="text-slate-500" />
      </motion.div>
      <h2 className="text-lg font-semibold text-slate-400 mb-1">No components yet</h2>
      <p className="text-slate-600 text-sm mb-6 max-w-xs">
        Build your cost breakdown by adding root components, then nest children inside them.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.97]"
      >
        <Plus size={15} />
        Add your first component
      </button>
    </motion.div>
  )
}
