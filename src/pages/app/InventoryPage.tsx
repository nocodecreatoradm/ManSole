import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { MsRepuesto } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Package, History, ArrowUpRight, ArrowDownRight, AlertTriangle, Database, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')
  const [selectedPart, setSelectedPart] = useState<MsRepuesto | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)

  // Queries
  const { data: parts = [], isLoading } = useQuery({
    queryKey: ['inventory-parts'],
    queryFn: async () => {
      const { data, error } = await api.inventory.getParts()
      if (error) throw new Error(error)
      return data || []
    }
  })

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['inventory-movements', selectedPart?.id],
    queryFn: async () => {
      if (!selectedPart) return []
      const { data, error } = await api.inventory.getMovements(selectedPart.id)
      if (error) throw new Error(error)
      return data || []
    },
    enabled: !!selectedPart
  })

  // Mutations
  const createPartMutation = useMutation({
    mutationFn: (payload: any) => api.inventory.createPart(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-parts'] })
      toast.success('Repuesto registrado')
      setShowForm(false)
      setForm({ codigo: '', nombre: '', descripcion: '', categoria: '', uom: 'unidades', stock_minimo: 0, costo_unitario: 0, ubicacion: '' })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const recordMovementMutation = useMutation({
    mutationFn: (payload: any) => api.inventory.recordMovement({ ...payload, repuesto_id: selectedPart?.id, usuario_id: profile?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-parts'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements', selectedPart?.id] })
      toast.success('Movimiento registrado')
      setShowMovementForm(false)
      setMovementForm({ tipo: 'entrada', cantidad: 1, referencia_tipo: '', referencia_id: '', notas: '' })
    },
    onError: (err: any) => toast.error(err.message)
  })

  // Form states
  const [form, setForm] = useState({
    codigo: '', nombre: '', descripcion: '', categoria: '', uom: 'unidades', 
    stock_minimo: 0, costo_unitario: 0, ubicacion: ''
  })

  const [movementForm, setMovementForm] = useState({
    tipo: 'entrada' as any, cantidad: 1, referencia_tipo: '', referencia_id: '', notas: ''
  })

  const filtered = parts.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.codigo.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: parts.length,
    lowStock: parts.filter(p => p.stock_actual <= p.stock_minimo).length,
    totalValue: parts.reduce((acc, p) => acc + (p.stock_actual * (p.costo_unitario || 0)), 0)
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Inventario y Repuestos</h1>
          <p className="page-subtitle">Gestión de existencias y materiales para mantenimiento</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nuevo Repuesto
        </button>
      </header>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--brand-primary)' }}>
            <Package size={24} />
          </div>
          <div>
            <p className="stat-label">Total Repuestos</p>
            <h3 className="stat-value">{stats.total}</h3>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: stats.lowStock > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: stats.lowStock > 0 ? '#ef4444' : '#22c55e' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="stat-label">Stock Bajo</p>
            <h3 className="stat-value" style={{ color: stats.lowStock > 0 ? '#ef4444' : 'inherit' }}>{stats.lowStock}</h3>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--brand-primary)' }}>
            <Database size={24} />
          </div>
          <div>
            <p className="stat-label">Valor Total</p>
            <h3 className="stat-value">${stats.totalValue.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por código o nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Repuesto</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Costo Unit.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Cargando inventario...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No se encontraron repuestos.</td></tr>
              ) : filtered.map(part => (
                <tr key={part.id}>
                  <td><code className="code-badge">{part.codigo}</code></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{part.nombre}</div>
                    <div className="text-xs text-muted">{part.ubicacion || 'Sin ubicación'}</div>
                  </td>
                  <td><span className="badge badge-info">{part.categoria || 'N/A'}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: part.stock_actual <= part.stock_minimo ? '#ef4444' : 'inherit' }}>
                        {part.stock_actual} {part.uom}
                      </span>
                      {part.stock_actual <= part.stock_minimo && <AlertTriangle size={14} color="#ef4444" />}
                    </div>
                  </td>
                  <td>${part.costo_unitario?.toFixed(2)}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-btn" title="Movimiento" onClick={() => { setSelectedPart(part); setShowMovementForm(true); }}>
                        <Plus size={16} />
                      </button>
                      <button className="action-btn" title="Historial" onClick={() => setSelectedPart(part)}>
                        <History size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Historial */}
      <AnimatePresence>
        {selectedPart && !showMovementForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="drawer-overlay" onClick={() => setSelectedPart(null)}
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="drawer-content" onClick={e => e.stopPropagation()}
            >
              <div className="drawer-header">
                <h2 className="drawer-title">Historial: {selectedPart.nombre}</h2>
                <button className="btn-icon" onClick={() => setSelectedPart(null)}><X /></button>
              </div>

              <div className="drawer-body">
                <div className="list-container">
                  {isLoadingMovements ? (
                    <p>Cargando historial...</p>
                  ) : movements.length === 0 ? (
                    <p className="text-muted">No hay movimientos registrados.</p>
                  ) : movements.map(m => (
                    <div key={m.id} className="glass-card" style={{ padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ 
                          fontSize: 10, textTransform: 'uppercase', fontWeight: 700,
                          color: m.tipo === 'entrada' ? '#22c55e' : m.tipo === 'salida' ? '#ef4444' : '#f59e0b'
                        }}>
                          {m.tipo}
                        </span>
                        <span className="text-xs text-muted">{new Date(m.fecha_movimiento).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {m.tipo === 'entrada' ? <ArrowDownRight size={16} color="#22c55e" /> : <ArrowUpRight size={16} color="#ef4444" />}
                          <span style={{ fontWeight: 800, fontSize: 16 }}>{m.cantidad} {selectedPart.uom}</span>
                        </div>
                        <div className="text-xs text-muted">Por: {m.usuario_nombre}</div>
                      </div>
                      {m.notas && <p className="text-xs text-muted" style={{ marginTop: 8 }}>Nota: {m.notas}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nuevo Repuesto */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content glass-card" style={{ maxWidth: 600 }}
            >
              <div className="modal-header">
                <h3>Nuevo Repuesto</h3>
                <button className="btn-icon" onClick={() => setShowForm(false)}><X /></button>
              </div>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="input-group">
                    <label>Código *</label>
                    <input className="input-field" placeholder="Ej: RP-001" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Categoría</label>
                    <select className="input-field" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      <option value="Mecánico">Mecánico</option>
                      <option value="Eléctrico">Eléctrico</option>
                      <option value="Lubricantes">Lubricantes</option>
                      <option value="Filtros">Filtros</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Nombre *</label>
                  <input className="input-field" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Descripción</label>
                  <textarea className="input-field" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>UOM *</label>
                    <input className="input-field" value={form.uom} onChange={e => setForm({...form, uom: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Ubicación</label>
                    <input className="input-field" value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Stock Mínimo</label>
                    <input type="number" className="input-field" value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="input-group">
                    <label>Costo Unitario ($)</label>
                    <input type="number" step="0.01" className="input-field" value={form.costo_unitario} onChange={e => setForm({...form, costo_unitario: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => createPartMutation.mutate(form)} disabled={createPartMutation.isPending}>Registrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Movimiento */}
      <AnimatePresence>
        {showMovementForm && selectedPart && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content glass-card" style={{ maxWidth: 450 }}
            >
              <div className="modal-header">
                <h3>Movimiento: {selectedPart.nombre}</h3>
                <button className="btn-icon" onClick={() => setShowMovementForm(false)}><X /></button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label>Tipo de Movimiento</label>
                  <select className="input-field" value={movementForm.tipo} onChange={e => setMovementForm({...movementForm, tipo: e.target.value as any})}>
                    <option value="entrada">Entrada (Compra/Retorno)</option>
                    <option value="salida">Salida (Consumo/Baja)</option>
                    <option value="ajuste">Ajuste de Inventario</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Cantidad ({selectedPart.uom})</label>
                  <input type="number" className="input-field" min={1} value={movementForm.cantidad} onChange={e => setMovementForm({...movementForm, cantidad: parseFloat(e.target.value) || 1})} />
                </div>
                <div className="input-group">
                  <label>Notas</label>
                  <textarea className="input-field" value={movementForm.notas} onChange={e => setMovementForm({...movementForm, notas: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowMovementForm(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => recordMovementMutation.mutate(movementForm)} disabled={recordMovementMutation.isPending}>Registrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
