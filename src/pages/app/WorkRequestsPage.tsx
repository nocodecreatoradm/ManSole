import { useEffect, useState, useMemo } from 'react'
import { api } from '../../lib/api'
import type { MsSolicitudTrabajo, MsActivo } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, ClipboardList, X, Eye, Clock, User, HardDrive, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function WorkRequestsPage() {
  const { profile } = useAuthStore()
  const [solicitudes, setSolicitudes] = useState<MsSolicitudTrabajo[]>([])
  const [activos, setActivos] = useState<MsActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  
  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'detail' | 'form'>('detail')
  const [selectedSol, setSelectedSol] = useState<MsSolicitudTrabajo | null>(null)
  
  // Form state
  const [form, setForm] = useState({ 
    activo_id: '', 
    titulo: '', 
    descripcion: '', 
    prioridad: 'media' as 'critica' | 'alta' | 'media' | 'baja' 
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [solRes, actRes] = await Promise.all([
        api.workRequests.getAll(),
        api.assets.getAll(),
      ])
      if (solRes.data) setSolicitudes(solRes.data)
      if (actRes.data) setActivos(actRes.data)
    } catch { toast.error('Error cargando datos') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    return solicitudes.filter(s => {
      const matchSearch = !search || s.titulo.toLowerCase().includes(search.toLowerCase()) || s.codigo_solicitud.toLowerCase().includes(search.toLowerCase())
      const matchEstado = !filterEstado || s.estado === filterEstado
      return matchSearch && matchEstado
    })
  }, [solicitudes, search, filterEstado])

  const handleCreate = async () => {
    if (!form.activo_id || !form.titulo || !form.descripcion) { toast.error('Completa todos los campos'); return }
    try {
      const { error } = await api.workRequests.create(form)
      if (error) throw new Error(error)
      toast.success('Solicitud enviada')
      setShowDrawer(false)
      setForm({ activo_id: '', titulo: '', descripcion: '', prioridad: 'media' })
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar solicitud')
    }
  }

  const handleApprove = async (sol: MsSolicitudTrabajo) => {
    try {
      const { error } = await api.workRequests.update(sol.id, { estado: 'aprobada' })
      if (error) throw new Error(error)
      toast.success('Solicitud aprobada')
      setShowDrawer(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al aprobar')
    }
  }

  const handleReject = async (sol: MsSolicitudTrabajo) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return
    try {
      const { error } = await api.workRequests.update(sol.id, { estado: 'rechazada' })
      if (error) throw new Error(error)
      toast.success('Solicitud rechazada')
      setShowDrawer(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al rechazar')
    }
  }

  const openDetail = (sol: MsSolicitudTrabajo) => {
    setSelectedSol(sol)
    setDrawerMode('detail')
    setShowDrawer(true)
  }

  const openNew = () => {
    setForm({ activo_id: '', titulo: '', descripcion: '', prioridad: 'media' })
    setDrawerMode('form')
    setShowDrawer(true)
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Solicitudes de Trabajo</h1>
          <p>Reportes de fallas y necesidades de mantenimiento — <strong>Inline / Detail / Form</strong></p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Nueva Solicitud
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={18} />
          <input className="input-field" placeholder="Buscar por código o título..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ width: 180 }}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
          <option value="convertida">Convertida</option>
        </select>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ClipboardList size={28} /></div>
            <h3>Sin solicitudes</h3>
            <p>Reporta fallas de equipos para que el equipo de mantenimiento las atienda.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Equipo</th>
                <th>Solicitante</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id} className="row-hover" onClick={() => openDetail(s)} style={{ cursor: 'pointer' }}>
                  <td><span className="code-badge">{s.codigo_solicitud}</span></td>
                  <td style={{ fontWeight: 600 }}>{s.titulo}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.activo?.nombre || '—'}</td>
                  <td style={{ fontSize: 13 }}>{s.solicitante?.full_name || '—'}</td>
                  <td><span className={`badge badge-${s.prioridad}`}>{s.prioridad}</span></td>
                  <td><span className={`badge badge-${s.estado}`}>{s.estado}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openDetail(s) }}>
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
            <motion.div 
              className="drawer-content slide-in-right" 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--bg-elevated)', boxShadow: '-10px 0 50px rgba(0,0,0,0.3)' }}
            >
              <div className="drawer-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>{drawerMode === 'detail' ? 'Detalle de Solicitud' : 'Nueva Solicitud'}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDrawer(false)} style={{ background: 'var(--bg-surface-soft)', borderRadius: '50%' }}><X size={20} /></button>
              </div>

              <div className="drawer-body">
                {drawerMode === 'detail' && selectedSol ? (
                  <>
                    <div className="drawer-section">
                      <div className="drawer-section-title">Información General</div>
                      <div style={{ marginBottom: 16 }}>
                        <span className={`badge badge-${selectedSol.estado}`} style={{ marginBottom: 8 }}>{selectedSol.estado}</span>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{selectedSol.titulo}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{selectedSol.descripcion}</p>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label"><Clock size={14} /> Creado</span>
                        <span>{format(new Date(selectedSol.created_at), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label"><AlertTriangle size={14} /> Prioridad</span>
                        <span className={`badge badge-${selectedSol.prioridad}`}>{selectedSol.prioridad}</span>
                      </div>
                    </div>

                    <div className="drawer-section">
                      <div className="drawer-section-title">Origen y Responsabilidad</div>
                      <div className="detail-row">
                        <span className="detail-label"><HardDrive size={14} /> Equipo</span>
                        <span style={{ fontWeight: 600 }}>{(selectedSol as any).activo?.nombre || '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label"><User size={14} /> Solicitante</span>
                        <span>{(selectedSol as any).solicitante?.full_name || '—'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="input-group">
                      <label>Título de la Solicitud *</label>
                      <input className="input-field" placeholder="Ej: Falla en sistema hidráulico" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                    </div>
                    
                    <div className="grid-2">
                      <div className="input-group">
                        <label>Equipo / Activo *</label>
                        <select className="input-field" value={form.activo_id} onChange={(e) => setForm({ ...form, activo_id: e.target.value })}>
                          <option value="">Seleccionar equipo</option>
                          {activos.map((a) => <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Prioridad Estimada</label>
                        <select className="input-field" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value as any })}>
                          <option value="critica">Crítica</option>
                          <option value="alta">Alta</option>
                          <option value="media">Media</option>
                          <option value="baja">Baja</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Descripción Detallada *</label>
                      <textarea className="input-field" placeholder="Describe el problema observado..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={{ minHeight: 120 }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="drawer-footer" style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-surface-soft)' }}>
                <button className="btn btn-secondary" onClick={() => setShowDrawer(false)}>Cerrar</button>
                {drawerMode === 'detail' && selectedSol && selectedSol.estado === 'pendiente' && isAdmin && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-danger" onClick={() => handleReject(selectedSol)}>Rechazar</button>
                    <button className="btn btn-primary" onClick={() => handleApprove(selectedSol)}>Aprobar</button>
                  </div>
                )}
                {drawerMode === 'form' && (
                  <button className="btn btn-primary" onClick={handleCreate}>Enviar Solicitud</button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
