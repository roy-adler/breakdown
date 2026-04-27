import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calculator, ChevronDown, Save, Trash2 } from 'lucide-react'
import { useStore } from './store/useStore'
import { ComponentNode } from './components/ComponentNode'
import { AddComponentModal } from './components/AddComponentModal'
import { Modal } from './components/Modal'
import { formatPrice } from './utils/format'

export default function App() {
  const components = useStore(s => s.components)
  const rootIds = useStore(s => s.rootIds)
  const rootConfigurations = useStore(s => s.rootConfigurations)
  const calculatePrice = useStore(s => s.calculatePrice)
  const saveConfiguration = useStore(s => s.saveConfiguration)
  const loadConfiguration = useStore(s => s.loadConfiguration)
  const deleteConfiguration = useStore(s => s.deleteConfiguration)

  const [showAdd, setShowAdd] = useState(false)
  const [showSaveConfig, setShowSaveConfig] = useState(false)
  const [configName, setConfigName] = useState('')
  const [showConfigMenu, setShowConfigMenu] = useState(false)
  const [activeRootId] = useState<string>('root-1')

  const total = rootIds.reduce((sum, id) => sum + calculatePrice(id), 0)
  const componentCount = Object.keys(components).length
  const configs = rootConfigurations[activeRootId] || []

  const handleSaveConfig = () => {
    if (configName.trim()) {
      saveConfiguration(activeRootId, configName.trim())
      setConfigName('')
      setShowSaveConfig(false)
    }
  }

  const handleLoadConfig = (configId: string) => {
    loadConfiguration(activeRootId, configId)
    setShowConfigMenu(false)
  }

  const handleDeleteConfig = (configId: string) => {
    deleteConfiguration(activeRootId, configId)
  }

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
            <div className="flex items-center gap-4">
              {/* Total Price */}
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

              {/* Configuration Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowConfigMenu(!showConfigMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-sm text-slate-300 transition-all"
                >
                  <span className="text-xs">Config</span>
                  <ChevronDown size={14} className={`transition-transform ${showConfigMenu ? 'rotate-180' : ''}`} />
                </button>

                {showConfigMenu && (
                  <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg min-w-max z-50">
                    {configs.length > 0 ? (
                      <>
                        {configs.map(config => (
                          <div
                            key={config.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-slate-700 border-b border-slate-700 last:border-b-0"
                          >
                            <button
                              onClick={() => handleLoadConfig(config.id)}
                              className="text-sm text-slate-300 hover:text-slate-100 text-left flex-1"
                            >
                              {config.name}
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteConfig(config.id)
                              }}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-2"
                              title="Delete configuration"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="border-t border-slate-700 pt-1 mt-1" />
                      </>
                    ) : null}
                    <button
                      onClick={() => {
                        setShowSaveConfig(true)
                        setShowConfigMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <Save size={14} />
                      Save Configuration
                    </button>
                  </div>
                )}
              </div>
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

      {/* Modals */}
      <AnimatePresence>
        {showAdd && <AddComponentModal parentId={null} onClose={() => setShowAdd(false)} />}
        {showSaveConfig && (
          <Modal title="Save Configuration" onClose={() => setShowSaveConfig(false)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Configuration Name</label>
                <input
                  autoFocus
                  type="text"
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                  placeholder="e.g., Budget Option, Premium Package…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && handleSaveConfig()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  disabled={!configName.trim()}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveConfig(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium text-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
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
