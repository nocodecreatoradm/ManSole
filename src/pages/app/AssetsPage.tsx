import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { MsActivo } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Cog, 
  X, 
  Edit3, 
  Info, 
  Download, 
  Printer, 
  LayoutGrid, 
  List,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { QRCodeSVG } from 'qrcode.react'

export default function AssetsPage() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
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
  const [activeTab, setActiveTab] = useState<'info' | 'parts' | 'qr'>('info')

  // Sub-queries
  const { data: partes = [] } = useQuery({
    queryKey: ['asset-parts', selectedActivo?.id],
    queryFn: async () => {
      if (!selectedActivo) return []
      const { data, error } = await api.assets.getParts(selectedActivo.id)
      if (error) throw new Error(error)
      return data || []
    },
    enabled: !!selectedActivo && showDrawer && drawerMode === 'detail'
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
    setActiveTab('info')
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

  const containerAnim = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  } as const

  const itemAnim = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  } as const

  if (isLoading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <motion.div variants={containerAnim} initial="hidden" animate="show" style={{ paddingBottom: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>Gestión de Activos</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Control y monitoreo de la infraestructura técnica</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openNew}>
            <Plus size={18} /> Nuevo Activo
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                className="input-field" 
                placeholder="Buscar por nombre o código..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <select className="input-field" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ width: '180px' }}>
              <option value="">Todos los estados</option>
              <option value="operativo">Operativo</option>
              <option value="en_mantenimiento">En Mantenimiento</option>
              <option value="fuera_de_servicio">Fuera de Servicio</option>
              <option value="dado_de_baja">Dado de Baja</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button 
              onClick={() => setViewMode('table')}
              style={{ padding: '6px', borderRadius: '6px', border: 'none', background: viewMode === 'table' ? 'white' : 'transparent', color: viewMode === 'table' ? 'var(--color-primary)' : '#64748b', cursor: 'pointer', display: 'flex', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px', borderRadius: '6px', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? 'var(--color-primary)' : '#64748b', cursor: 'pointer', display: 'flex', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
          <div style={{ background: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Cog size={32} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>No se encontraron activos</h3>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0.5rem auto' }}>
            Prueba ajustando los filtros o realiza una nueva búsqueda para encontrar lo que necesitas.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem' }}>Identificador</th>
                  <th>Nombre del Activo</th>
                  <th>Ubicación / Área</th>
                  <th>Estado</th>
                  <th>Criticidad</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((activo: any) => (
                  <motion.tr 
                    key={activo.id} 
                    variants={itemAnim}
                    onClick={() => openDetail(activo)} 
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ paddingLeft: '1.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{activo.codigo}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{activo.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{activo.marca || 'Genérico'} {activo.modelo}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }} />
                        {activo.area_nombre || 'Planta Principal'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${activo.estado.replace(/_/g, '-')}`} style={{ fontSize: '0.7rem' }}>
                        {activo.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${activo.prioridad_criticidad}`} style={{ fontSize: '0.7rem' }}>
                        {activo.prioridad_criticidad}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                      <button className="btn-icon" style={{ color: 'var(--color-primary)' }}>
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((activo: any) => (
            <motion.div 
              key={activo.id} 
              variants={itemAnim}
              className="card" 
              onClick={() => openDetail(activo)}
              style={{ cursor: 'pointer', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{activo.codigo}</span>
                <span className={`badge badge-${activo.estado.replace(/_/g, '-')}`} style={{ fontSize: '0.65rem' }}>
                  {activo.estado.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>{activo.nombre}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{activo.area_nombre}</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <span className={`badge badge-${activo.prioridad_criticidad}`} style={{ fontSize: '0.65rem' }}>
                  {activo.prioridad_criticidad}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showDrawer && (
          <motion.div 
            className="drawer-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setShowDrawer(false)}
            style={{ zIndex: 1000 }}
          >
            <motion.div 
              className="drawer-content" 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 30, stiffness: 300 }} 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: '550px', 
                background: 'white', 
                boxShadow: '-10px 0 50px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    {drawerMode === 'detail' ? 'Detalle del Activo' : (isEditing ? 'Editar Activo' : 'Nuevo Activo')}
                  </h2>
                  {drawerMode === 'detail' && selectedActivo && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedActivo.codigo}</span>
                  )}
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {drawerMode === 'detail' && selectedActivo ? (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#f8fafc', padding: '4px', borderRadius: '12px' }}>
                      {(['info', 'parts', 'qr'] as const).map(tab => (
                        <button 
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          style={{ 
                            flex: 1, 
                            padding: '8px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            background: activeTab === tab ? 'white' : 'transparent',
                            color: activeTab === tab ? 'var(--color-primary)' : '#64748b',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 200ms'
                          }}
                        >
                          {tab === 'info' && 'General'}
                          {tab === 'parts' && 'Despiece'}
                          {tab === 'qr' && 'Identificación'}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'info' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Estado Actual</div>
                            <span className={`badge badge-${selectedActivo.estado.replace(/_/g, '-')}`} style={{ fontSize: '0.75rem' }}>
                              {selectedActivo.estado.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Criticidad</div>
                            <span className={`badge badge-${selectedActivo.prioridad_criticidad}`} style={{ fontSize: '0.75rem' }}>
                              {selectedActivo.prioridad_criticidad}
                            </span>
                          </div>
                        </div>

                        <section>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={16} color="var(--color-primary)" /> Especificaciones Técnicas
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                              { label: 'Marca', value: selectedActivo.marca },
                              { label: 'Modelo', value: selectedActivo.modelo },
                              { label: 'N° Serie', value: selectedActivo.numero_serie },
                              { label: 'Categoría', value: (selectedActivo as any).categoria_nombre },
                              { label: 'Ubicación', value: (selectedActivo as any).area_nombre },
                            ].map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{item.value || '—'}</span>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>Descripción</h4>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            {selectedActivo.descripcion || 'Sin descripción adicional para este activo.'}
                          </p>
                        </section>
                      </div>
                    )}

                    {activeTab === 'parts' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 800 }}>Componentes y Partes</h4>
                          <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>+ Agregar</button>
                        </div>
                        {partes.length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No hay partes registradas.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {partes.map(p => (
                              <div key={p.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{p.nombre}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{p.codigo}</div>
                                </div>
                                <ChevronRight size={16} color="#94a3b8" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'qr' && (
                      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ 
                          background: 'white', 
                          padding: '2rem', 
                          borderRadius: '24px', 
                          display: 'inline-block', 
                          marginBottom: '2rem',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                          border: '1px solid #f1f5f9'
                        }}>
                          <QRCodeSVG value={selectedActivo.id} size={200} level="H" includeMargin={true} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Etiqueta de Activo</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '300px', margin: '0 auto 2rem' }}>
                          Escanea el código QR para acceder instantáneamente al historial y órdenes de trabajo.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                          <button className="btn-secondary"><Download size={18} /> Descargar</button>
                          <button className="btn-secondary"><Printer size={18} /> Imprimir</button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Código *</label>
                        <input className="input-field" placeholder="P. ej. MTR-01" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Nombre *</label>
                        <input className="input-field" placeholder="P. ej. Motor Trifásico" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                      </div>
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Área / Ubicación *</label>
                      <select className="input-field" value={form.area_id} onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
                        <option value="">Seleccionar área</option>
                        {areas.map((a: any) => <option key={a.id} value={a.id}>{a.planta_nombre} — {a.nombre}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Marca</label>
                        <input className="input-field" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Modelo</label>
                        <input className="input-field" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
                      </div>
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Descripción</label>
                      <textarea className="input-field" rows={3} style={{ resize: 'none' }} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Estado</label>
                        <select className="input-field" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                          <option value="operativo">Operativo</option>
                          <option value="en_mantenimiento">En Mantenimiento</option>
                          <option value="fuera_de_servicio">Fuera de Servicio</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Criticidad</label>
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

              <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDrawer(false)}>Cancelar</button>
                {drawerMode === 'detail' ? (
                  isAdmin && <button className="btn-primary" style={{ flex: 1 }} onClick={openEditFromDetail}><Edit3 size={18} /> Editar Activo</button>
                ) : (
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                    {isEditing ? 'Actualizar Activo' : 'Registrar Activo'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
