import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { MsOrdenTrabajo } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, FileText, X, Filter, Eye, Edit3, User, Calendar, Tag, Wrench, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'



export default function WorkOrdersPage() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  // Queries
  const { data: ordenes = [], isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const { data, error } = await api.workOrders.getAll()
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

  const { data: tecnicos = [] } = useQuery({
    queryKey: ['profiles-tecnicos'],
    queryFn: async () => {
      const { data, error } = await api.profiles.getAll()
      if (error) throw new Error(error)
      return (data || []).filter((p: any) => p.role === 'tecnico' || p.role === 'supervisor' || p.role === 'admin')
    }
  })

  const { data: repuestos = [] } = useQuery({
    queryKey: ['inventory-parts'],
    queryFn: async () => {
      const { data, error } = await api.inventory.getParts()
      if (error) throw new Error(error)
      return data || []
    }
  })

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditing && selectedOT) {
        const { error } = await api.workOrders.update(selectedOT.id, payload)
        if (error) throw new Error(error)
      } else {
        const { error } = await api.workOrders.create(payload)
        if (error) throw new Error(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      toast.success(isEditing ? 'Orden actualizada' : 'Orden creada')
      setShowDrawer(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'detail' | 'form'>('detail')
  const [selectedOT, setSelectedOT] = useState<MsOrdenTrabajo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'activities' | 'materials'>('summary')
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityForm, setActivityForm] = useState({
    descripcion: '', parte_id: '', tipo_actividad: 'reparacion' as any
  })
  const [showComponentForm, setShowComponentForm] = useState(false)
  const [componentForm, setComponentForm] = useState({
    componente_id: '', cantidad: 1, accion: 'reemplazo'
  })
  const [availableComponents, setAvailableComponents] = useState<any[]>([])

  // Sub-queries
  const { data: actividades = [], refetch: refetchActividades } = useQuery({
    queryKey: ['ot-activities', selectedOT?.id],
    queryFn: async () => {
      if (!selectedOT) return []
      const { data, error } = await api.workOrders.getActivities(selectedOT.id)
      if (error) throw new Error(error)
      
      const withComps = await Promise.all((data || []).map(async (act) => {
        const { data: comps } = await api.workOrders.getActivityComponents(act.id)
        return { ...act, componentes: comps || [] }
      }))
      
      return withComps
    },
    enabled: !!selectedOT && showDrawer && drawerMode === 'detail'
  })

  // We need parts of the asset of the OT
  const { data: assetParts = [] } = useQuery({
    queryKey: ['asset-parts-for-ot', (selectedOT as any)?.activo_id],
    queryFn: async () => {
      if (!(selectedOT as any)?.activo_id) return []
      const { data, error } = await api.assets.getParts((selectedOT as any).activo_id)
      if (error) throw new Error(error)
      return data || []
    },
    enabled: !!selectedOT && showDrawer
  })

  const { data: otParts = [], refetch: refetchOTParts } = useQuery({
    queryKey: ['ot-parts', selectedOT?.id],
    queryFn: async () => {
      if (!selectedOT) return []
      const { data, error } = await api.workOrders.getParts(selectedOT.id)
      if (error) throw new Error(error)
      return data || []
    },
    enabled: !!selectedOT && showDrawer && drawerMode === 'detail'
  })

  // Sub-mutations
  const createActivityMutation = useMutation({
    mutationFn: (payload: any) => api.workOrders.createActivity(selectedOT!.id, payload),
    onSuccess: () => {
      refetchActividades()
      toast.success('Actividad registrada')
      setShowActivityForm(false)
      setActivityForm({ descripcion: '', parte_id: '', tipo_actividad: 'reparacion' })
    }
  })

  const addComponentToActivityMutation = useMutation({
    mutationFn: (payload: any) => api.workOrders.addActivityComponent(selectedActivityId!, payload),
    onSuccess: () => {
      refetchActividades()
      toast.success('Componente agregado a la solución')
      setShowComponentForm(false)
      setComponentForm({ componente_id: '', cantidad: 1, accion: 'reemplazo' })
    }
  })

  const addPartToOTMutation = useMutation({
    mutationFn: (payload: { repuesto_id: string, cantidad: number }) => 
      api.workOrders.addPart(selectedOT!.id, { ...payload, usuario_id: profile?.id }),
    onSuccess: () => {
      refetchOTParts()
      queryClient.invalidateQueries({ queryKey: ['inventory-parts'] })
      toast.success('Repuesto asignado correctamente')
      setShowPartForm(false)
      setPartForm({ repuesto_id: '', cantidad: 1 })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al asignar repuesto')
    }
  })

  const [showPartForm, setShowPartForm] = useState(false)
  const [partForm, setPartForm] = useState({ repuesto_id: '', cantidad: 1 })

  // Form state
  const [form, setForm] = useState({
    codigo_ot: '', titulo: '', descripcion: '', activo_id: '',
    prioridad: 'media' as string, tipo: 'preventivo' as string,
    tecnico_asignado_id: '', estado: 'abierta' as string
  })

  const filtered = useMemo(() => {
    return ordenes.filter(o => {
      const matchSearch = !search || o.titulo.toLowerCase().includes(search.toLowerCase()) || o.codigo_ot.toLowerCase().includes(search.toLowerCase())
      const matchEstado = !filterEstado || o.estado === filterEstado
      return matchSearch && matchEstado
    })
  }, [ordenes, search, filterEstado])

  const handleSave = () => {
    if (!form.titulo || !form.activo_id) { toast.error('Completa los campos obligatorios'); return }
    saveMutation.mutate(form)
  }

  const openNew = () => {
    setForm({
      codigo_ot: `OT-${Date.now().toString().slice(-6)}`,
      titulo: '', descripcion: '', activo_id: '',
      prioridad: 'media', tipo: 'preventivo',
      tecnico_asignado_id: '', estado: 'abierta'
    })
    setIsEditing(false)
    setDrawerMode('form')
    setShowDrawer(true)
  }

  const openDetail = (ot: MsOrdenTrabajo) => {
    setSelectedOT(ot)
    setDrawerMode('detail')
    setActiveTab('summary')
    setShowDrawer(true)
  }

  const openEditFromDetail = () => {
    if (!selectedOT) return
    setForm({
      codigo_ot: selectedOT.codigo_ot,
      titulo: selectedOT.titulo,
      descripcion: selectedOT.descripcion || '',
      activo_id: selectedOT.activo_id,
      prioridad: selectedOT.prioridad,
      tipo: (selectedOT as any).tipo || 'preventivo',
      tecnico_asignado_id: selectedOT.tecnico_asignado_id || '',
      estado: selectedOT.estado
    })
    setIsEditing(true)
    setDrawerMode('form')
  }

  const handleRegisterActivity = () => {
    if (!activityForm.descripcion || !activityForm.parte_id) {
      toast.error('Completa los datos de la actividad')
      return
    }
    createActivityMutation.mutate({
      ...activityForm,
      estado: 'completada'
    })
  }

  const handleAddComponent = () => {
    if (!componentForm.componente_id) {
      toast.error('Selecciona un componente')
      return
    }
    addComponentToActivityMutation.mutate(componentForm)
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  if (isLoading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Ordenes de Trabajo</h1>
          <p>Gestión y seguimiento de mantenimientos — <strong>Inline / Detail / Form</strong></p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={18} /> Nueva OT
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={18} />
          <input className="input-field" placeholder="Buscar OT por título o código..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="input-field" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ width: 200 }}>
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileText size={28} /></div>
            <h3>No hay ordenes de trabajo</h3>
            <p>Crea una nueva orden para comenzar el mantenimiento de tus activos.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Activo</th>
                <th>Técnico</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ot: any) => (
                <tr key={ot.id} className="row-hover" onClick={() => openDetail(ot)} style={{ cursor: 'pointer' }}>
                  <td><span className="font-mono">{ot.codigo_ot}</span></td>
                  <td style={{ fontWeight: 600 }}>{ot.titulo}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{ot.activo_nombre || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{ot.tecnico_asignado || 'Sin asignar'}</td>
                  <td><span className={`badge badge-${ot.estado.replace(/_/g, '-')}`}>{ot.estado.replace(/_/g, ' ')}</span></td>
                  <td><span className={`badge badge-${ot.prioridad}`}>{ot.prioridad}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openDetail(ot) }}>
                      <Eye size={16} />
                    </button>
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
            <motion.div className="drawer-content slide-in-right" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} onClick={(e) => e.stopPropagation()}>
              
              <div className="drawer-header">
                <div>
                  <h2 style={{ fontSize: 20 }}>{drawerMode === 'detail' ? 'Detalle de OT' : (isEditing ? 'Editar OT' : 'Nueva OT')}</h2>
                  {drawerMode === 'detail' && selectedOT && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{selectedOT.codigo_ot}</p>}
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
              </div>

              <div className="drawer-body">
                {drawerMode === 'detail' && selectedOT ? (
                  <>
                    <div className="tabs-container" style={{ marginBottom: 24 }}>
                      <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Resumen</button>
                      <button className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}>Ejecución (Actividades)</button>
                      <button className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>Materiales / Repuestos</button>
                    </div>

                    {activeTab === 'summary' && (
                      <>
                        <div className="drawer-section">
                      <div className="drawer-section-title"><FileText size={14} /> Información de la Tarea</div>
                      <h3 style={{ fontSize: 18, marginBottom: 8 }}>{selectedOT.titulo}</h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedOT.descripcion || 'Sin descripción detallada.'}</p>
                    </div>

                    <div className="drawer-section">
                      <div className="drawer-section-title"><Tag size={14} /> Clasificación</div>
                      <div className="detail-row">
                        <span className="detail-label">Estado</span>
                        <span className={`badge badge-${selectedOT.estado.replace(/_/g, '-')}`}>{selectedOT.estado.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Prioridad</span>
                        <span className={`badge badge-${selectedOT.prioridad}`}>{selectedOT.prioridad}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Tipo</span>
                        <span style={{ textTransform: 'capitalize' }}>{(selectedOT as any).tipo || 'preventivo'}</span>
                      </div>
                    </div>

                    <div className="drawer-section">
                      <div className="drawer-section-title"><User size={14} /> Responsables</div>
                      <div className="detail-row">
                        <span className="detail-label">Activo</span>
                        <span style={{ fontWeight: 600 }}>{(selectedOT as any).activo_nombre || '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Técnico</span>
                        <span>{(selectedOT as any).tecnico_asignado || 'No asignado'}</span>
                      </div>
                    </div>

                    <div className="drawer-section">
                      <div className="drawer-section-title"><Calendar size={14} /> Tiempos</div>
                      <div className="detail-row">
                        <span className="detail-label">F. Creación</span>
                        <span>{new Date(selectedOT.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    </>
                    )}

                    {activeTab === 'activities' && (
                      <div className="drawer-section">
                        <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span><Wrench size={14} /> Actividades de Mantenimiento</span>
                          {!showActivityForm && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowActivityForm(true)}>+ Registrar Actividad</button>
                          )}
                        </div>

                        {showActivityForm && (
                          <div className="glass-card" style={{ padding: 16, marginBottom: 20, border: '1px solid var(--primary-color)' }}>
                            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Nueva Actividad</h4>
                            <div className="input-group" style={{ marginBottom: 12 }}>
                              <label>Parte de la Máquina</label>
                              <select className="input-field" value={activityForm.parte_id} onChange={(e) => setActivityForm({ ...activityForm, parte_id: e.target.value })}>
                                <option value="">Seleccionar parte...</option>
                                {assetParts.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                              </select>
                            </div>
                            <div className="input-group" style={{ marginBottom: 12 }}>
                              <label>Descripción</label>
                              <textarea className="input-field" placeholder="¿Qué se hizo?" value={activityForm.descripcion} onChange={(e) => setActivityForm({ ...activityForm, descripcion: e.target.value })} style={{ minHeight: 60 }} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 16 }}>
                              <label>Tipo</label>
                              <select className="input-field" value={activityForm.tipo_actividad} onChange={(e) => setActivityForm({ ...activityForm, tipo_actividad: e.target.value as any })}>
                                <option value="inspeccion">Inspección</option>
                                <option value="reparacion">Reparación</option>
                                <option value="reemplazo">Reemplazo</option>
                                <option value="lubricacion">Lubricación</option>
                                <option value="ajuste">Ajuste</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-primary btn-sm" onClick={handleRegisterActivity} disabled={createActivityMutation.isPending}>Guardar</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setShowActivityForm(false)}>Cancelar</button>
                            </div>
                          </div>
                        )}

                        <div className="list-container" style={{ marginTop: 12 }}>
                          {actividades.length === 0 ? <p className="text-muted">No se han registrado actividades aún.</p> : (
                            actividades.map((act: any) => (
                              <div key={act.id} className="activity-card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-default)', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                  <span className="badge badge-completada" style={{ fontSize: 10, textTransform: 'uppercase' }}>{act.tipo_actividad}</span>
                                  <span className="text-xs" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{act.parte_nombre}</span>
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>{act.descripcion}</p>
                                
                                <div style={{ borderTop: '1px dashed var(--border-default)', paddingTop: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>REPUSTOS / SOLUCIÓN</span>
                                    {!showComponentForm || selectedActivityId !== act.id ? (
                                      <button className="btn btn-ghost btn-sm" style={{ height: 'auto', padding: '2px 8px', fontSize: 11 }} onClick={async () => {
                                        setSelectedActivityId(act.id)
                                        const { data: comps } = await api.assets.getPartComponents(act.parte_id)
                                        setAvailableComponents(comps || [])
                                        setShowComponentForm(true)
                                      }}>+ Añadir Repuesto</button>
                                    ) : null}
                                  </div>

                                  {showComponentForm && selectedActivityId === act.id && (
                                    <div className="component-form" style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                                      <div className="input-group" style={{ marginBottom: 8 }}>
                                        <select className="input-field text-sm" value={componentForm.componente_id} onChange={(e) => setComponentForm({ ...componentForm, componente_id: e.target.value })}>
                                          <option value="">Seleccionar repuesto...</option>
                                          {availableComponents.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>)}
                                        </select>
                                      </div>
                                      <div className="grid-2" style={{ gap: 8, marginBottom: 12 }}>
                                        <input type="number" className="input-field text-sm" placeholder="Cant." value={componentForm.cantidad} onChange={(e) => setComponentForm({ ...componentForm, cantidad: parseInt(e.target.value) || 1 })} />
                                        <select className="input-field text-sm" value={componentForm.accion} onChange={(e) => setComponentForm({ ...componentForm, accion: e.target.value })}>
                                          <option value="reemplazo">Reemplazo</option>
                                          <option value="reparacion">Reparación</option>
                                          <option value="ajuste">Ajuste</option>
                                        </select>
                                      </div>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-primary btn-sm" style={{ padding: '2px 10px' }} onClick={handleAddComponent} disabled={addComponentToActivityMutation.isPending}>Agregar</button>
                                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 10px' }} onClick={() => setShowComponentForm(false)}>Cancelar</button>
                                      </div>
                                    </div>
                                  )}

                                  <div className="used-components">
                                    {(act.componentes || []).length === 0 ? (
                                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin repuestos registrados.</p>
                                    ) : (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {act.componentes.map((c: any) => (
                                          <div key={c.id} style={{ background: 'rgba(var(--primary-rgb), 0.1)', border: '1px solid rgba(var(--primary-rgb), 0.2)', borderRadius: 4, padding: '4px 8px', fontSize: 11, display: 'flex', gap: 6 }}>
                                            <span style={{ fontWeight: 600 }}>{c.cantidad}x</span>
                                            <span>{c.componente_nombre}</span>
                                            <span style={{ opacity: 0.6 }}>| {c.accion}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'materials' && (
                      <div className="drawer-section">
                        <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span><Package size={14} /> Materiales y Repuestos Utilizados</span>
                          {!showPartForm && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowPartForm(true)}>+ Añadir Repuesto</button>
                          )}
                        </div>

                        {showPartForm && (
                          <div className="glass-card" style={{ padding: 16, marginBottom: 20, border: '1px solid var(--primary-color)' }}>
                            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Consumir Repuesto</h4>
                            <div className="input-group" style={{ marginBottom: 12 }}>
                              <label>Seleccionar Repuesto (Stock Disp.)</label>
                              <select className="input-field" value={partForm.repuesto_id} onChange={(e) => setPartForm({ ...partForm, repuesto_id: e.target.value })}>
                                <option value="">Seleccionar...</option>
                                {repuestos.map((r: any) => (
                                  <option key={r.id} value={r.id} disabled={r.stock_actual <= 0}>
                                    {r.nombre} — {r.codigo} (Disp: {r.stock_actual} {r.uom})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="input-group" style={{ marginBottom: 16 }}>
                              <label>Cantidad a Utilizar</label>
                              <input type="number" className="input-field" min={1} value={partForm.cantidad} onChange={(e) => setPartForm({ ...partForm, cantidad: parseFloat(e.target.value) || 1 })} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-primary btn-sm" onClick={() => addPartToOTMutation.mutate(partForm)} disabled={addPartToOTMutation.isPending}>Asignar</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setShowPartForm(false)}>Cancelar</button>
                            </div>
                          </div>
                        )}

                        <div className="list-container" style={{ marginTop: 12 }}>
                          {otParts.length === 0 ? (
                            <div className="empty-state-small">
                              <Package size={20} style={{ opacity: 0.3 }} />
                              <p className="text-muted" style={{ fontSize: 13 }}>No hay materiales registrados en esta OT.</p>
                            </div>
                          ) : (
                            <table className="data-table text-sm">
                              <thead>
                                <tr>
                                  <th>Repuesto</th>
                                  <th>Cant.</th>
                                  <th>Costo Unit.</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {otParts.map((p: any) => (
                                  <tr key={p.id}>
                                    <td>
                                      <div style={{ fontWeight: 600 }}>{p.repuesto_nombre}</div>
                                      <div className="text-xs text-muted">{p.repuesto_codigo}</div>
                                    </td>
                                    <td>{p.cantidad} {p.uom}</td>
                                    <td>${p.costo_unitario_aplicado?.toFixed(2)}</td>
                                    <td style={{ fontWeight: 600 }}>${(p.cantidad * (p.costo_unitario_aplicado || 0)).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                        
                        {otParts.length > 0 && (
                          <div style={{ marginTop: 20, padding: 16, background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL MATERIALES</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--brand-primary)' }}>
                              ${otParts.reduce((acc: number, curr: any) => acc + (curr.cantidad * (curr.costo_unitario_aplicado || 0)), 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="input-group">
                      <label>Título de la Orden *</label>
                      <input className="input-field" placeholder="Ej: Mantenimiento preventivo motor #1" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                    </div>
                    
                    <div className="input-group">
                      <label>Descripción</label>
                      <textarea className="input-field" placeholder="Detalles de la tarea..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={{ minHeight: 100 }} />
                    </div>

                    <div className="grid-2">
                      <div className="input-group">
                        <label>Activo *</label>
                        <select className="input-field" value={form.activo_id} onChange={(e) => setForm({ ...form, activo_id: e.target.value })}>
                          <option value="">Seleccionar activo</option>
                          {activos.map((a: any) => <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Técnico Asignado</label>
                        <select className="input-field" value={form.tecnico_asignado_id} onChange={(e) => setForm({ ...form, tecnico_asignado_id: e.target.value })}>
                          <option value="">Sin asignar</option>
                          {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid-3">
                      <div className="input-group">
                        <label>Prioridad</label>
                        <select className="input-field" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value as any })}>
                          <option value="critica">Crítica</option>
                          <option value="alta">Alta</option>
                          <option value="media">Media</option>
                          <option value="baja">Baja</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Tipo</label>
                        <select className="input-field" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                          <option value="preventivo">Preventivo</option>
                          <option value="correctivo">Correctivo</option>
                          <option value="predictivo">Predictivo</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Estado</label>
                        <select className="input-field" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                          <option value="abierta">Abierta</option>
                          <option value="en_progreso">En Progreso</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="drawer-footer">
                <button className="btn btn-secondary" onClick={() => setShowDrawer(false)}>Cerrar</button>
                {drawerMode === 'detail' ? (
                  isAdmin && <button className="btn btn-primary" onClick={openEditFromDetail}><Edit3 size={16} /> Editar</button>
                ) : (
                  <button className="btn btn-primary" onClick={handleSave}>{isEditing ? 'Guardar Cambios' : 'Crear Orden'}</button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
