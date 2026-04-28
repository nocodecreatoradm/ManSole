import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { MsPlanPreventivo } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Calendar, X, Edit3, Trash2, Clock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

export default function PreventivePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<MsPlanPreventivo | null>(null)

  // Form state
  const [form, setForm] = useState({
    activo_id: '',
    nombre: '',
    descripcion: '',
    frecuencia_dias: 30,
    proxima_fecha: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    prioridad: 'media'
  })

  // Queries
  const { data: planes = [], isLoading } = useQuery({
    queryKey: ['preventive-plans'],
    queryFn: async () => {
      const { data, error } = await api.preventive.getAll()
      if (error) throw new Error(error)
      return data || []
    }
  })

  const { data: activos = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await api.assets.getAll()
      if (error) throw new Error(error)
      return data || []
    }
  })

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditing && selectedPlan) {
        const { error } = await api.preventive.update(selectedPlan.id, payload)
        if (error) throw new Error(error)
      } else {
        const { error } = await api.preventive.create(payload)
        if (error) throw new Error(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preventive-plans'] })
      toast.success(isEditing ? 'Plan actualizado' : 'Plan creado')
      setShowDrawer(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.preventive.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preventive-plans'] })
      toast.success('Plan eliminado')
    }
  })

  const handleSave = () => {
    if (!form.activo_id || !form.nombre || !form.frecuencia_dias) {
      toast.error('Completa los campos obligatorios')
      return
    }
    saveMutation.mutate(form)
  }

  const openNew = () => {
    setIsEditing(false)
    setForm({
      activo_id: '',
      nombre: '',
      descripcion: '',
      frecuencia_dias: 30,
      proxima_fecha: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      prioridad: 'media'
    })
    setShowDrawer(true)
  }

  const openEdit = (plan: MsPlanPreventivo) => {
    setSelectedPlan(plan)
    setIsEditing(true)
    setForm({
      activo_id: plan.activo_id,
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      frecuencia_dias: plan.frecuencia_dias,
      proxima_fecha: plan.proxima_fecha ? format(new Date(plan.proxima_fecha), 'yyyy-MM-dd') : '',
      prioridad: plan.prioridad
    })
    setShowDrawer(true)
  }

  const filtered = planes.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.activo_nombre?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Mantenimiento Preventivo</h1>
          <p>Programación de rutinas y planes de mantenimiento recurrente</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Nuevo Plan
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={18} />
          <input 
            className="input-field" 
            placeholder="Buscar por plan o activo..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Calendar size={28} /></div>
            <h3>No hay planes preventivos</h3>
            <p>Crea un plan para que el sistema genere órdenes de trabajo automáticas.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Plan</th>
                <th>Frecuencia</th>
                <th>Próxima Fecha</th>
                <th>Prioridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plan) => (
                <tr key={plan.id} className="row-hover">
                  <td>
                    <div style={{ fontWeight: 600 }}>{plan.activo_nombre}</div>
                    <div className="text-xs text-muted">{plan.activo_codigo}</div>
                  </td>
                  <td>{plan.nombre}</td>
                  <td>
                    <div className="flex-center" style={{ gap: 4 }}>
                      <Clock size={14} className="text-muted" />
                      cada {plan.frecuencia_dias} días
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: new Date(plan.proxima_fecha) < new Date() ? 'var(--error)' : 'inherit' }}>
                      {format(new Date(plan.proxima_fecha), 'dd MMM yyyy')}
                      {new Date(plan.proxima_fecha) < new Date() && (
                        <AlertTriangle size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${plan.prioridad}`}>
                      {plan.prioridad}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(plan)}>
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm btn-icon text-error" 
                        onClick={() => {
                          if (confirm('¿Eliminar este plan preventivo?')) deleteMutation.mutate(plan.id)
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showDrawer && (
          <motion.div className="drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDrawer(false)}>
            <motion.div className="drawer-content slide-in-right" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h2>{isEditing ? 'Editar Plan Preventivo' : 'Nuevo Plan Preventivo'}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
              </div>

              <div className="drawer-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="input-group">
                    <label>Activo *</label>
                    <select 
                      className="input-field" 
                      value={form.activo_id} 
                      onChange={(e) => setForm({ ...form, activo_id: e.target.value })}
                      disabled={isEditing}
                    >
                      <option value="">Seleccionar activo</option>
                      {activos.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Nombre del Plan *</label>
                    <input 
                      className="input-field" 
                      placeholder="Ej: Mantenimiento Trimestral" 
                      value={form.nombre} 
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
                    />
                  </div>

                  <div className="input-group">
                    <label>Descripción</label>
                    <textarea 
                      className="input-field" 
                      placeholder="Detalle de las actividades a realizar..." 
                      value={form.descripcion} 
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })} 
                      style={{ minHeight: 100 }}
                    />
                  </div>

                  <div className="grid-2">
                    <div className="input-group">
                      <label>Frecuencia (días) *</label>
                      <input 
                        type="number"
                        className="input-field" 
                        value={form.frecuencia_dias} 
                        onChange={(e) => setForm({ ...form, frecuencia_dias: parseInt(e.target.value) })} 
                      />
                    </div>
                    <div className="input-group">
                      <label>Prioridad</label>
                      <select 
                        className="input-field" 
                        value={form.prioridad} 
                        onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                      >
                        <option value="critica">Crítica</option>
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Próxima Fecha de Ejecución *</label>
                    <input 
                      type="date"
                      className="input-field" 
                      value={form.proxima_fecha} 
                      onChange={(e) => setForm({ ...form, proxima_fecha: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div className="drawer-footer">
                <button className="btn btn-secondary" onClick={() => setShowDrawer(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave}>
                  {isEditing ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
