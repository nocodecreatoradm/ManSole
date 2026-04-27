import { useEffect, useState, useMemo } from 'react'
import { supabase, type MsSolicitudTrabajo, type MsActivo } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, ClipboardList, X, CheckCircle, XCircle } from 'lucide-react'
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
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ activo_id: '', titulo: '', descripcion: '', prioridad: 'media' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [{ data: sol }, { data: act }] = await Promise.all([
        supabase.from('ms_solicitudes_trabajo')
          .select('*, activo:ms_activos(nombre, codigo), solicitante:ms_profiles!ms_solicitudes_trabajo_solicitante_id_fkey(full_name), aprobador:ms_profiles!ms_solicitudes_trabajo_aprobador_id_fkey(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('ms_activos').select('id, codigo, nombre').order('nombre'),
      ])
      if (sol) setSolicitudes(sol as unknown as MsSolicitudTrabajo[])
      if (act) setActivos(act as unknown as MsActivo[])
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

  const generateCode = () => `SOL-${Date.now().toString(36).toUpperCase()}`

  const handleCreate = async () => {
    if (!form.activo_id || !form.titulo || !form.descripcion) { toast.error('Completa todos los campos'); return }
    try {
      const { error } = await supabase.from('ms_solicitudes_trabajo').insert([{
        codigo_solicitud: generateCode(),
        activo_id: form.activo_id,
        solicitante_id: profile!.id,
        titulo: form.titulo,
        descripcion: form.descripcion,
        prioridad: form.prioridad,
      }])
      if (error) throw error
      toast.success('Solicitud enviada')
      setShowModal(false)
      setForm({ activo_id: '', titulo: '', descripcion: '', prioridad: 'media' })
      loadData()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') }
  }

  const handleApprove = async (sol: MsSolicitudTrabajo) => {
    try {
      const { error } = await supabase.from('ms_solicitudes_trabajo').update({
        estado: 'aprobada', aprobador_id: profile!.id, fecha_aprobacion: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', sol.id)
      if (error) throw error
      toast.success('Solicitud aprobada — Crea una OT desde Órdenes de Trabajo')
      loadData()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') }
  }

  const handleReject = async (sol: MsSolicitudTrabajo) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return
    try {
      const { error } = await supabase.from('ms_solicitudes_trabajo').update({
        estado: 'rechazada', aprobador_id: profile!.id, motivo_rechazo: motivo, updated_at: new Date().toISOString(),
      }).eq('id', sol.id)
      if (error) throw error
      toast.success('Solicitud rechazada')
      loadData()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') }
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Solicitudes de Trabajo</h1>
          <p>Reportes de fallas y solicitudes de mantenimiento</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nueva Solicitud
        </button>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 42 }} />
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
            <p>Las solicitudes de trabajo permiten reportar fallas de forma rápida.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Código</th><th>Título</th><th>Equipo</th><th>Solicitante</th><th>Prioridad</th><th>Estado</th><th>Fecha</th>{isAdmin && <th>Acciones</th>}</tr></thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{s.codigo_solicitud}</span></td>
                  <td style={{ fontWeight: 600 }}>{s.titulo}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.activo?.nombre || '—'}</td>
                  <td style={{ fontSize: 13 }}>{s.solicitante?.full_name || '—'}</td>
                  <td><span className={`badge badge-${s.prioridad}`}>{s.prioridad}</span></td>
                  <td><span className={`badge badge-${s.estado}`}>{s.estado}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(s.created_at), 'dd MMM yyyy', { locale: es })}</td>
                  {isAdmin && (
                    <td>
                      {s.estado === 'pendiente' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(s)}><CheckCircle size={14} /> Aprobar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(s)}><XCircle size={14} /> Rechazar</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h2>Nueva Solicitud</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
              <div className="modal-body">
                <div className="input-group"><label>Título *</label><input className="input-field" placeholder="Ej: Motor hace ruido extraño" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Equipo *</label>
                    <select className="input-field" value={form.activo_id} onChange={(e) => setForm({ ...form, activo_id: e.target.value })}>
                      <option value="">Seleccionar</option>
                      {activos.map((a) => <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Prioridad</label>
                    <select className="input-field" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                      <option value="critica">Crítica</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
                    </select>
                  </div>
                </div>
                <div className="input-group"><label>Descripción *</label><textarea className="input-field" placeholder="Describe la falla o necesidad..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCreate}>Enviar Solicitud</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
