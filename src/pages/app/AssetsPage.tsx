import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { MsActivo } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Cog, X, Filter, Eye, Edit3, Info, Wrench, QrCode, Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { QRCodeSVG } from 'qrcode.react'

export default function AssetsPage() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  
  // Queries
  const { data: activos = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await api.assets.getAll()
      if (error) throw new Error(error)
      return data || []
    }
  })

  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await api.areas.getAll()
      if (error) throw new Error(error)
      return data || []
    }
  })

  const { data: categorias = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await api.categorias.getAll()
      if (error) throw new Error(error)
      return data || []
    }
  })

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditing && selectedActivo) {
        const { error } = await api.assets.update(selectedActivo.id, payload)
        if (error) throw new Error(error)
      } else {
        const { error } = await api.assets.create(payload)
        if (error) throw new Error(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      toast.success(isEditing ? 'Activo actualizado' : 'Activo creado')
      setShowDrawer(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'detail' | 'form'>('detail')
  const [selectedActivo, setSelectedActivo] = useState<MsActivo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'parts' | 'components'>('info')
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)

  // Sub-queries
  const { data: partes = [], refetch: refetchPartes } = useQuery({
    queryKey: ['asset-parts', selectedActivo?.id],
    queryFn: async () => {
      if (!selectedActivo) return []
      const { data, error } = await api.assets.getParts(selectedActivo.id)
      if (error) throw new Error(error)
      return data || []
    },
    enabled: !!selectedActivo && showDrawer && drawerMode === 'detail'
  })

  const { data: componentes = [], refetch: refetchComponentes } = useQuery({
    queryKey: ['part-components', selectedPartId],
    queryFn: async () => {
      if (!selectedPartId) return []
      const { data, error } = await api.assets.getPartComponents(selectedPartId)
      if (error) throw new Error(error)
      return data || []
    },
    enabled: !!selectedPartId && showDrawer && activeTab === 'components'
  })

  // Sub-mutations
  const createPartMutation = useMutation({
    mutationFn: (payload: any) => api.assets.createPart(selectedActivo!.id, payload),
    onSuccess: () => {
      refetchPartes()
      toast.success('Parte agregada')
    }
  })

  const createComponentMutation = useMutation({
    mutationFn: (payload: any) => api.assets.createPartComponent(selectedPartId!, payload),
    onSuccess: () => {
      refetchComponentes()
      toast.success('Componente agregado')
    }
  })

  // Form state
  const [form, setForm] = useState({ 
    codigo: '', nombre: '', descripcion: '', area_id: '', categoria_id: '', 
    marca: '', modelo: '', numero_serie: '', estado: 'operativo' as string, 
    prioridad_criticidad: 'media' as string 
  })

  const filtered = useMemo(() => {
    return activos.filter(a => {
      const matchSearch = !search || a.nombre.toLowerCase().includes(search.toLowerCase()) || a.codigo.toLowerCase().includes(search.toLowerCase())
      const matchEstado = !filterEstado || a.estado === filterEstado
      return matchSearch && matchEstado
    })
  }, [activos, search, filterEstado])

  const handleSave = () => {
    if (!form.codigo || !form.nombre || !form.area_id) { toast.error('Completa los campos obligatorios'); return }
    saveMutation.mutate(form)
  }

  const openNew = () => {
    setForm({ 
      codigo: '', nombre: '', descripcion: '', area_id: '', categoria_id: '', 
      marca: '', modelo: '', numero_serie: '', estado: 'operativo', 
      prioridad_criticidad: 'media' 
    })
    setIsEditing(false)
    setDrawerMode('form')
    setShowDrawer(true)
  }

  const openDetail = (activo: MsActivo) => {
    setSelectedActivo(activo)
    setDrawerMode('detail')
    setShowDrawer(true)
  }

  const openEditFromDetail = () => {
    if (!selectedActivo) return
    setForm({
      codigo: selectedActivo.codigo, nombre: selectedActivo.nombre, 
      descripcion: selectedActivo.descripcion || '',
      area_id: selectedActivo.area_id, categoria_id: selectedActivo.categoria_id || '', 
      marca: selectedActivo.marca || '', modelo: selectedActivo.modelo || '', 
      numero_serie: selectedActivo.numero_serie || '',
      estado: selectedActivo.estado, prioridad_criticidad: selectedActivo.prioridad_criticidad,
    })
    setIsEditing(true)
    setDrawerMode('form')
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  if (isLoading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Gestión de Activos</h1>
          <p>Registro y seguimiento de equipos y maquinaria — <strong>Inline / Detail / Form</strong></p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={18} /> Nuevo Activo
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={18} />
          <input className="input-field" placeholder="Buscar por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="input-field" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ width: 200 }}>
            <option value="">Todos los estados</option>
            <option value="operativo">Operativo</option>
            <option value="en_mantenimiento">En Mantenimiento</option>
            <option value="fuera_de_servicio">Fuera de Servicio</option>
            <option value="dado_de_baja">Dado de Baja</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Cog size={28} /></div>
            <h3>No hay activos</h3>
            <p>Registra tu primer equipo o máquina para comenzar la gestión.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Criticidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((activo: any) => (
                <tr key={activo.id} className="row-hover" onClick={() => openDetail(activo)} style={{ cursor: 'pointer' }}>
                  <td><span className="font-mono">{activo.codigo}</span></td>
                  <td style={{ fontWeight: 600 }}>{activo.nombre}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{activo.area_nombre || '—'}</td>
                  <td><span className={`badge badge-${activo.estado.replace(/_/g, '-')}`}>{activo.estado.replace(/_/g, ' ')}</span></td>
                  <td><span className={`badge badge-${activo.prioridad_criticidad}`}>{activo.prioridad_criticidad}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openDetail(activo) }}>
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
                <h2>{drawerMode === 'detail' ? 'Detalle del Activo' : (isEditing ? 'Editar Activo' : 'Nuevo Activo')}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
              </div>

              <div className="drawer-body">
                {drawerMode === 'detail' && selectedActivo ? (
                  <>
                    <div className="tabs-container" style={{ marginBottom: 24 }}>
                      <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Información</button>
                      <button className={`tab-btn ${activeTab === 'parts' ? 'active' : ''}`} onClick={() => setActiveTab('parts')}>Partes</button>
                      <button className={`tab-btn ${activeTab === 'components' ? 'active' : ''}`} onClick={() => setActiveTab('components')} disabled={!selectedPartId}>Componentes</button>
                      <button className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>Código QR</button>
                    </div>

                    {activeTab === 'qr' && (
                      <div className="drawer-section" style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ background: 'white', padding: 24, borderRadius: 16, display: 'inline-block', marginBottom: 20, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                          <QRCodeSVG 
                            id="asset-qr-code"
                            value={selectedActivo.id} 
                            size={200}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <h3 style={{ marginBottom: 8 }}>{selectedActivo.codigo}</h3>
                        <p className="text-muted" style={{ marginBottom: 24 }}>Escanea este código para identificar el activo rápidamente.</p>
                        
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" onClick={() => {
                            const svg = document.getElementById('asset-qr-code');
                            if (svg) {
                              const svgData = new XMLSerializer().serializeToString(svg);
                              const canvas = document.createElement("canvas");
                              const ctx = canvas.getContext("2d");
                              const img = new Image();
                              img.onload = () => {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx?.drawImage(img, 0, 0);
                                const pngFile = canvas.toDataURL("image/png");
                                const downloadLink = document.createElement("a");
                                downloadLink.download = `QR-${selectedActivo.codigo}.png`;
                                downloadLink.href = pngFile;
                                downloadLink.click();
                              };
                              img.src = "data:image/svg+xml;base64," + btoa(svgData);
                            }
                          }}>
                            <Download size={16} /> Descargar PNG
                          </button>
                          <button className="btn btn-secondary" onClick={() => window.print()}>
                            <Printer size={16} /> Imprimir Etiquetas
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'info' && (
                      <>
                        <div className="drawer-section">
                      <div className="drawer-section-title"><Info size={14} /> Información General</div>
                      <div className="detail-row">
                        <span className="detail-label">Código</span>
                        <span className="detail-value font-mono">{selectedActivo.codigo}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Nombre</span>
                        <span className="detail-value">{selectedActivo.nombre}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Descripción</span>
                        <span className="detail-value">{selectedActivo.descripcion || '—'}</span>
                      </div>
                    </div>

                    <div className="drawer-section">
                      <div className="drawer-section-title"><Cog size={14} /> Especificaciones</div>
                      <div className="grid-2">
                        <div className="detail-row">
                          <span className="detail-label">Marca</span>
                          <span className="detail-value">{selectedActivo.marca || '—'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Modelo</span>
                          <span className="detail-value">{selectedActivo.modelo || '—'}</span>
                        </div>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">N° Serie</span>
                        <span className="detail-value">{selectedActivo.numero_serie || '—'}</span>
                      </div>
                    </div>

                    <div className="drawer-section">
                      <div className="drawer-section-title"><Filter size={14} /> Clasificación</div>
                      <div className="detail-row">
                        <span className="detail-label">Estado</span>
                        <span className={`badge badge-${selectedActivo.estado.replace(/_/g, '-')}`}>{selectedActivo.estado.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Criticidad</span>
                        <span className={`badge badge-${selectedActivo.prioridad_criticidad}`}>{selectedActivo.prioridad_criticidad}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Categoría</span>
                        <span>{(selectedActivo as any).categoria_nombre || 'Sin categoría'}</span>
                      </div>
                    </div>
                    </>
                    )}

                    {activeTab === 'parts' && (
                      <div className="drawer-section">
                        <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span><Cog size={14} /> Partes del Activo</span>
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            const name = prompt('Nombre de la parte')
                            const code = prompt('Código de la parte')
                            if (name && code) createPartMutation.mutate({ nombre: name, codigo: code })
                          }}>+ Agregar</button>
                        </div>
                        <div className="list-container" style={{ marginTop: 12 }}>
                          {partes.length === 0 ? <p className="text-muted">No hay partes registradas.</p> : (
                            partes.map(p => (
                              <div key={p.id} 
                                className={`list-item ${selectedPartId === p.id ? 'active' : ''}`} 
                                onClick={() => { setSelectedPartId(p.id); setActiveTab('components') }}
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', marginBottom: '8px', cursor: 'pointer' }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <strong>{p.nombre}</strong>
                                  <span className="font-mono text-sm">{p.codigo}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'components' && (
                      <div className="drawer-section">
                        <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span><Wrench size={14} /> Componentes de la Parte</span>
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            const name = prompt('Nombre del componente')
                            const code = prompt('Código del componente')
                            if (name && code) createComponentMutation.mutate({ nombre: name, codigo: code })
                          }}>+ Agregar</button>
                        </div>
                        <div className="list-container" style={{ marginTop: 12 }}>
                          {componentes.length === 0 ? <p className="text-muted">No hay componentes en esta parte.</p> : (
                            componentes.map(c => (
                              <div key={c.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <strong>{c.nombre}</strong>
                                  <span className="font-mono text-sm">{c.codigo}</span>
                                </div>
                                {c.numero_parte && <p className="text-xs text-muted" style={{ marginTop: 4 }}>N° Parte: {c.numero_parte}</p>}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="grid-2">
                      <div className="input-group">
                        <label>Código *</label>
                        <input className="input-field" placeholder="EQ-001" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <label>Nombre *</label>
                        <input className="input-field" placeholder="Nombre del activo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label>Descripción</label>
                      <textarea className="input-field" placeholder="Descripción detallada..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={{ minHeight: 80 }} />
                    </div>

                    <div className="grid-2">
                      <div className="input-group">
                        <label>Área *</label>
                        <select className="input-field" value={form.area_id} onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
                          <option value="">Seleccionar área</option>
                          {areas.map((a: any) => <option key={a.id} value={a.id}>{a.planta_nombre} — {a.nombre}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Categoría</label>
                        <select className="input-field" value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
                          <option value="">Seleccionar categoría</option>
                          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid-3">
                      <div className="input-group"><label>Marca</label><input className="input-field" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
                      <div className="input-group"><label>Modelo</label><input className="input-field" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></div>
                      <div className="input-group"><label>N° Serie</label><input className="input-field" value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} /></div>
                    </div>

                    <div className="grid-2">
                      <div className="input-group">
                        <label>Estado</label>
                        <select className="input-field" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                          <option value="operativo">Operativo</option>
                          <option value="en_mantenimiento">En Mantenimiento</option>
                          <option value="fuera_de_servicio">Fuera de Servicio</option>
                          <option value="dado_de_baja">Dado de Baja</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Criticidad</label>
                        <select className="input-field" value={form.prioridad_criticidad} onChange={(e) => setForm({ ...form, prioridad_criticidad: e.target.value })}>
                          <option value="critica">Crítica</option>
                          <option value="alta">Alta</option>
                          <option value="media">Media</option>
                          <option value="baja">Baja</option>
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
                  <button className="btn btn-primary" onClick={handleSave}>{isEditing ? 'Guardar Cambios' : 'Crear Activo'}</button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
