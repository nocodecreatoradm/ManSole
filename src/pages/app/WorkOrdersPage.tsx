import { useEffect, useState, useMemo } from 'react'
import { supabase, type MsOrdenTrabajo, type MsActivo, type MsProfile } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Wrench, X, Filter, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function WorkOrdersPage() {
  const { profile } = useAuthStore()
  const [ordenes, setOrdenes] = useState<MsOrdenTrabajo[]>([])
  const [activos, setActivos] = useState<MsActivo[]>([])
  const [tecnicos, setTecnicos] = useState<MsProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOT, setSelectedOT] = useState<MsOrdenTrabajo | null>(null)

  const [form, setForm] = useState({
    activo_id: '', tipo: 'correctiva' as string, prioridad: 'media' as string,
    titulo: '', descripcion: '', tecnico_asignado_id: '', fecha_programada: '',
    tiempo_estimado_horas: '',
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [{ data: ots }, { data: act }, { data: tec }] = await Promise.all([
        supabase.from('ms_ordenes_trabajo')
          .select('*, activo:ms_activos(nombre, codigo), creador:ms_profiles!ms_ordenes_trabajo_creador_id_fkey(full_name), tecnico_asignado:ms_profiles!ms_ordenes_trabajo_tecnico_asignado_id_fkey(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('ms_activos').select('id, codigo, nombre').eq('estado', 'operativo').order('nombre'),
        supabase.from('ms_profiles').select('*').in('role', ['tecnico', 'supervisor']).eq('is_active', true),
      ])
      if (ots) setOrdenes(ots as unknown as MsOrdenTrabajo[])
      if (act) setActivos(act as unknown as MsActivo[])
      if (tec) setTecnicos(tec)
    } catch { toast.error('Error cargando datos') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    return ordenes.filter(o => {
      const matchSearch = !search || o.titulo.toLowerCase().includes(search.toLowerCase()) || o.codigo_ot.toLowerCase().includes(search.toLowerCase())
      const matchEstado = !filterEstado || o.estado === filterEstado
      const matchTipo = !filterTipo || o.tipo === filterTipo
      return matchSearch && matchEstado && matchTipo
    })
  }, [ordenes, search, filterEstado, filterTipo])

  const generateOTCode = () => {
    const now = new Date()
    return `OT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
  }

  const handleCreate = async () => {
    if (!form.activo_id || !form.titulo) { toast.error('Completa los campos obligatorios'); return }
    try {
      const { error } = await supabase.from('ms_ordenes_trabajo').insert([{
        codigo_ot: generateOTCode(),
        activo_id: form.activo_id,
        tipo: form.tipo,
        prioridad: form.prioridad,
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        creador_id: profile!.id,
        tecnico_asignado_id: form.tecnico_asignado_id || null,
        fecha_programada: form.fecha_programada || null,
        tiempo_estimado_horas: form.tiempo_estimado_horas ? parseFloat(form.tiempo_estimado_horas) : null,
      }])
      if (error) throw error
      toast.success('Orden de trabajo creada')
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear OT')
    }
  }

  const updateEstado = async (ot: MsOrdenTrabajo, nuevoEstado: string) => {
    try {
      const updates: Record<string, unknown> = { estado: nuevoEstado, updated_at: new Date().toISOString() }
      if (nuevoEstado === 'en_proceso' && !ot.fecha_inicio) updates.fecha_inicio = new Date().toISOString()
      if (nuevoEstado === 'completada') updates.fecha_fin = new Date().toISOString()
      const { error } = await supabase.from('ms_ordenes_trabajo').update(updates).eq('id', ot.id)
      if (error) throw error
      toast.success(`Estado actualizado a: ${nuevoEstado.replace('_', ' ')}`)
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const resetForm = () => {
    setForm({ activo_id: '', tipo: 'correctiva', prioridad: 'media', titulo: '', descripcion: '', tecnico_asignado_id: '', fecha_programada: '', tiempo_estimado_horas: '' })
  }

  const estadoFlow: Record<string, string[]> = {
    solicitada: ['aprobada', 'cancelada'],
    aprobada: ['en_proceso', 'cancelada'],
    en_proceso: ['completada'],
    completada: ['cerrada'],
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Órdenes de Trabajo</h1>
          <p>Gestión de mantenimiento correctivo, preventivo y mejoras</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          <Plus size={18} /> Nueva OT
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Buscar por título o código..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 42 }} />
        </div>
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />
        <select className="input-field" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} style={{ width: 180 }}>
          <option value="">Todos los estados</option>
          <option value="solicitada">Solicitada</option>
          <option value="aprobada">Aprobada</option>
          <option value="en_proceso">En Proceso</option>
          <option value="completada">Completada</option>
          <option value="cerrada">Cerrada</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select className="input-field" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} style={{ width: 170 }}>
          <option value="">Todos los tipos</option>
          <option value="correctiva">Correctiva</option>
          <option value="preventiva">Preventiva</option>
          <option value="predictiva">Predictiva</option>
          <option value="mejora">Mejora</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Wrench size={28} /></div>
            <h3>Sin órdenes de trabajo</h3>
            <p>Crea tu primera orden de trabajo para comenzar a gestionar el mantenimiento.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Equipo</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Técnico</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ot: any) => (
                <tr key={ot.id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{ot.codigo_ot}</span></td>
                  <td style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ot.titulo}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{ot.activo?.nombre || '—'}</td>
                  <td><span className={`badge badge-${ot.tipo}`}>{ot.tipo}</span></td>
                  <td><span className={`badge badge-${ot.prioridad}`}>{ot.prioridad}</span></td>
                  <td><span className={`badge badge-${ot.estado.replace('_', '-')}`}>{ot.estado.replace('_', ' ')}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{ot.tecnico_asignado?.full_name || 'Sin asignar'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(ot.created_at), 'dd MMM yyyy', { locale: es })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedOT(ot); setShowDetailModal(true) }}><Eye size={16} /></button>
                      {estadoFlow[ot.estado]?.map((nextEstado: string) => (
                        <button key={nextEstado} className={`btn btn-sm ${nextEstado === 'cancelada' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => updateEstado(ot, nextEstado)} style={{ fontSize: 11, padding: '4px 10px' }}>
                          {nextEstado.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </td>
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
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
              <div className="modal-header">
                <h2>Nueva Orden de Trabajo</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label>Título *</label>
                  <input className="input-field" placeholder="Ej: Reparación de motor principal" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Equipo *</label>
                    <select className="input-field" value={form.activo_id} onChange={(e) => setForm({ ...form, activo_id: e.target.value })}>
                      <option value="">Seleccionar equipo</option>
                      {activos.map((a) => <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Tipo</label>
                    <select className="input-field" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                      <option value="correctiva">Correctiva</option>
                      <option value="preventiva">Preventiva</option>
                      <option value="predictiva">Predictiva</option>
                      <option value="mejora">Mejora</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Prioridad</label>
                    <select className="input-field" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                      <option value="critica">Crítica</option>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
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
                <div className="grid-2">
                  <div className="input-group">
                    <label>Fecha Programada</label>
                    <input type="date" className="input-field" value={form.fecha_programada} onChange={(e) => setForm({ ...form, fecha_programada: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Tiempo Estimado (horas)</label>
                    <input type="number" className="input-field" placeholder="Ej: 4" value={form.tiempo_estimado_horas} onChange={(e) => setForm({ ...form, tiempo_estimado_horas: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Descripción</label>
                  <textarea className="input-field" placeholder="Detalle del trabajo a realizar..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreate}>Crear OT</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedOT && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>OT: {selectedOT.codigo_ot}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ gap: 0 }}>
                {[
                  ['Título', selectedOT.titulo],
                  ['Tipo', selectedOT.tipo],
                  ['Prioridad', selectedOT.prioridad],
                  ['Estado', selectedOT.estado.replace('_', ' ')],
                  ['Descripción', selectedOT.descripcion || '—'],
                  ['Creado', format(new Date(selectedOT.created_at), "dd MMM yyyy HH:mm", { locale: es })],
                  ['Fecha Programada', selectedOT.fecha_programada ? format(new Date(selectedOT.fecha_programada), 'dd MMM yyyy', { locale: es }) : '—'],
                  ['Tiempo Estimado', selectedOT.tiempo_estimado_horas ? `${selectedOT.tiempo_estimado_horas}h` : '—'],
                ].map(([label, value]) => (
                  <div className="detail-row" key={label as string}>
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
