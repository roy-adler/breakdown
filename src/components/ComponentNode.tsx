import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Plus,
  Trash2,
  Package,
  Users,
  Layers,
  Zap,
  BarChart2,
  Pencil,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { ComponentType } from '../types'
import { TYPE_CONFIG } from './typeConfig'
import { AddComponentModal } from './AddComponentModal'
import { EditComponentModal } from './EditComponentModal'
import { formatPrice } from '../utils/format'

const TYPE_ICONS: Record<ComponentType, LucideIcon> = {
  material: Package,
  labor: Users,
  assembly: Layers,
  service: Zap,
  overhead: BarChart2,
}

interface Props {
  id: string
  depth?: number
}

export function ComponentNode({ id, depth = 0 }: Props) {
  const components = useStore(s => s.components)
  const removeComponent = useStore(s => s.removeComponent)
  const calculatePrice = useStore(s => s.calculatePrice)

  const [expanded, setExpanded] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const comp = components[id]
  if (!comp) return null

  const price = calculatePrice(id)
  const cfg = TYPE_CONFIG[comp.type]
  const Icon = TYPE_ICONS[comp.type]
  const hasChildren = comp.childIds.length > 0

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
        className="relative"
        style={{ paddingLeft: depth > 0 ? `${depth * 20}px` : 0 }}
      >
        {/* Connector line for children */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none"
            style={{ left: `${(depth - 1) * 20 + 9}px` }}>
            <div className="w-px h-full bg-slate-800" />
          </div>
        )}

        <div
          className={`
            relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5
            border border-slate-800/80 hover:border-slate-700
            transition-all duration-200 group
            ${cfg.bgClass}
            ${hasChildren ? 'cursor-pointer' : ''}
          `}
          onClick={() => hasChildren && setExpanded(v => !v)}
        >
          {/* Left accent stripe */}
          <div
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
            style={{ backgroundColor: cfg.color }}
          />

          {/* Chevron */}
          <motion.div
            animate={{ rotate: hasChildren && expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="w-4 h-4 flex-shrink-0 ml-1"
            style={{ color: hasChildren ? '#94a3b8' : 'transparent' }}
          >
            <ChevronRight size={14} />
          </motion.div>

          {/* Type icon */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${cfg.color}20` }}
          >
            <Icon size={14} style={{ color: cfg.color }} />
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-200 text-sm truncate">{comp.name}</span>
              {comp.quantity > 1 && (
                <span className="text-xs text-slate-500 flex-shrink-0">×{comp.quantity}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
              >
                {cfg.label}
              </span>
              <span className="text-[10px] text-slate-600 capitalize">{comp.priceMode}</span>
            </div>
          </div>

          {/* Animated price */}
          <motion.span
            key={price}
            initial={{ scale: 1.08, color: '#a78bfa' }}
            animate={{ scale: 1, color: '#e2e8f0' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="font-semibold text-sm flex-shrink-0 tabular-nums"
          >
            {formatPrice(price)}
          </motion.span>

          {/* Action buttons — show on hover */}
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAdd(true)}
              title="Add child"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={() => setShowEdit(true)}
              title="Edit"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-blue-400 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => removeComponent(id)}
              title="Delete"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {expanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <AnimatePresence mode="popLayout">
                {comp.childIds.map(childId => (
                  <ComponentNode key={childId} id={childId} depth={depth + 1} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showAdd && <AddComponentModal parentId={id} onClose={() => setShowAdd(false)} />}
        {showEdit && <EditComponentModal componentId={id} onClose={() => setShowEdit(false)} />}
      </AnimatePresence>
    </>
  )
}
