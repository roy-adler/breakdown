import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calculator, ChevronRight, X, ArrowLeft } from 'lucide-react'
import { useStore } from './store/useStore'
import { ComponentNode } from './components/ComponentNode'
import { AddComponentModal } from './components/AddComponentModal'
import { formatPrice } from './utils/format'
import { TYPE_CONFIG } from './components/typeConfig'

export default function App() {
  const projects = useStore(s => s.projects)
  const activeProjectId = useStore(s => s.activeProjectId)
  const drillStack = useStore(s => s.drillStack)
  const addProject = useStore(s => s.addProject)
  const removeProject = useStore(s => s.removeProject)
  const renameProject = useStore(s => s.renameProject)
  const setActiveProject = useStore(s => s.setActiveProject)
  const drillBack = useStore(s => s.drillBack)
  const calculateProjectTotal = useStore(s => s.calculateProjectTotal)

  const [showAdd, setShowAdd] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const activeProject = projects.find(p => p.id === activeProjectId)
  const total = calculateProjectTotal(activeProjectId)
  const isDrilling = drillStack.length > 0

  useEffect(() => {
    if (renamingId) renameInputRef.current?.select()
  }, [renamingId])

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameProject(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  const handleNewProject = () => {
    const id = addProject('New Project')
    startRename(id, 'New Project')
  }

  return (
    <div className="min-h-screen bg-[#080812] text-slate-200 flex flex-col">
      <header className="border-b border-slate-800/80 bg-[#0a0a18]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6">

          {/* Top row */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Calculator size={15} className="text-white" />
              </div>
              <h1 className="font-semibold text-slate-100 tracking-tight">Breakdown</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
                <motion.p
                  key={total}
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="font-bold text-lg text-slate-100 tabular-nums"
                >
                  {formatPrice(total)}
                </motion.p>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.97]"
              >
                <Plus size={14} />
                Add Component
              </button>
            </div>
          </div>

          {/* Tabs / Breadcrumb */}
          {isDrilling ? (
            <div className="pb-3 flex items-center gap-2">
              <button
                onClick={drillBack}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <div className="flex items-center gap-1.5 text-sm">
                {[...drillStack, activeProjectId].map((pid, i) => {
                  const p = projects.find(proj => proj.id === pid)
                  const isLast = i === drillStack.length
                  return (
                    <div key={pid} className="flex items-center gap-1.5">
                      {i > 0 && <ChevronRight size={12} className="text-slate-600" />}
                      <span className={isLast ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                        {p?.name ?? 'Unknown'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-0.5">
              {projects.map(project => {
                const isActive = project.id === activeProjectId
                return (
                  <div
                    key={project.id}
                    className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-lg cursor-pointer select-none transition-all border-b-2 ${
                      isActive
                        ? 'bg-slate-800/60 border-blue-500 text-slate-200'
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                    }`}
                    onClick={() => !renamingId && setActiveProject(project.id)}
                  >
                    {renamingId === project.id ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') setRenamingId(null)
                          e.stopPropagation()
                        }}
                        onClick={e => e.stopPropagation()}
                        className="bg-slate-700 text-slate-200 text-sm px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-blue-500 w-28"
                      />
                    ) : (
                      <span
                        className="text-sm font-medium"
                        onDoubleClick={e => {
                          e.stopPropagation()
                          startRename(project.id, project.name)
                        }}
                      >
                        {project.name}
                      </span>
                    )}
                    {isActive && projects.length > 1 && renamingId !== project.id && (
                      <button
                        onClick={e => { e.stopPropagation(); removeProject(project.id) }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-300 transition-all"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )
              })}
              <button
                onClick={handleNewProject}
                title="New project"
                className="flex items-center px-3 py-2.5 text-slate-600 hover:text-slate-300 transition-colors rounded-t-lg"
              >
                <Plus size={15} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1">
        {!activeProject || activeProject.rootIds.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <AnimatePresence mode="popLayout">
            {activeProject.rootIds.map(id => (
              <ComponentNode key={id} id={id} />
            ))}
          </AnimatePresence>
        )}
      </main>

      <footer className="border-t border-slate-800/60 py-4">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center gap-4">
          {(Object.entries(TYPE_CONFIG) as [string, { label: string; color: string }][]).map(([key, { label, color }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
          <span className="ml-auto text-xs text-slate-600">Double-click tab to rename · Double-click project ref to open</span>
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
