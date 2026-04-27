import { useEffect, useState, useMemo } from 'react'
import { supabase, type MsActivo, type MsArea, type MsCategoriaActivo } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Cog, X, Filter, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

export default function AssetsPage() {
  const { profile } = useAuthStore()
  const [activos, setActivos] = useState<MsActivo[]>([])
  const [areas, setAreas] = useState<MsArea[]>([])
  const [categorias, setCategorias] = useState<MsCategoriaActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedActivo, setSelectedActivo] = useState<MsActivo | null>(null)
  const [editMode, setEditMode] = useState(false)

  // Form state
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', area_id: '', categoria_id: '', marca: '', modelo: '', numero_serie: '', estado: 'operativo' as string, prioridad_criticidad: 'media' as string })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [{ data: a }, { data: ar }, { data: c }] = await Promise.all([
        supabase.from('ms_activos').select('*, area:ms_areas(nombre, planta:ms_plantas(nombre)), categoria:ms_categorias_activos(nombre)').order('created_at', { ascending: false }),
        supabase.from('ms_areas').select('*, planta:ms_plantas(nombre)').eq('is_active', true),
        supabase.from('ms_categorias_activos').select('*'),
      ])
      if (a) setActivos(a as unknown as MsActivo[])
      if (ar) setAreas(ar as unknown as MsArea[])
      if (c) setCategorias(c)
    } catch { toast.error('Error cargando datos') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    return activos.filter(a => {
      const matchSearch = !search || a.nombre.toLowerCase().includes(search.toLowerCase()) || a.codigo.toLowerCase().includes(search.toLowerCase())
      const matchEstado = !filterEstado || a.estado === filterEstado
      return matchSearch && matchEstado
    })
  }, [activos, search, filterEstado])

  const handleSave = async () => {
    if (!form.codigo || !form.nombre || !form.area_id) { toast.error('Completa los campos obligatorios'); return }
    try {
      if (editMode && selectedActivo) {
        const { error } = await supabase.from('ms_activos').update({ ...form, updated_at: new Date().toISOString() }).eq('id', selectedActivo.id)
        if (error) throw error
        toast.success('Activo actualizado')
      } else {
        const { error } = await supabase.from('ms_activos').insert([form])
        if (error) throw error
        toast.success('Activo creado')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const resetForm = () => {
    setForm({ codigo: '', nombre: '', descripcion: '', area_id: '', categoria_id: '', marca: '', modelo: '', numero_serie: '', estado: 'operativo', prioridad_criticidad: 'media' })
    setEditMode(false)
    setSelectedActivo(null)
  }

  const openEdit = (activo: MsActivo) => {
    setForm({
      codigo: activo.codigo, nombre: activo.nombre, descripcion: activo.descripcion || '',
      area_id: activo.area_id, categoria_id: activo.categoria_id || '', marca: activo.marca || '',
      modelo: activo.modelo || '', numero_serie: activo.numero_serie || '',
      estado: activo.estado, prioridad_criticidad: activo.prioridad_criticidad,
    })
    setSelectedActivo(activo)
    setEditMode(true)
    setShowModal(true)
  }

  const openDetail = (activo: MsActivo) => {
    setSelectedActivo(activo)
    setShowDetailModal(true)
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestión de Activos</h1>
          <p>Registro y seguimiento de equipos y maquinaria</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus size={18} /> Nuevo Activo
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input" style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Buscar por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 42 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

      {/* Table */}
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
                <th>Categoría</th>
                <th>Estado</th>
                <th>Criticidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((activo: any) => (
                <tr key={activo.id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{activo.codigo}</span></td>
                  <td style={{ fontWeight: 600 }}>{activo.nombre}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{activo.area?.nombre || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{activo.categoria?.nombre || '—'}</td>
                  <td><span className={`badge badge-${activo.estado.replace(/_/g, '-')}`}>{activo.estado.replace(/_/g, ' ')}</span></td>
                  <td><span className={`badge badge-${activo.prioridad_criticidad}`}>{activo.prioridad_criticidad}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetail(activo)}><Eye size={16} /></button>
                      {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => openEdit(activo)}>Editar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
              <div className="modal-header">
                <h2>{editMode ? 'Editar Activo' : 'Nuevo Activo'}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="input-group">
                    <label>Código *</label>
                    <input className="input-field" placeholder="EQ-001" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Nombre *</label>
                    <input className="input-field" placeholder="Bomba centrífuga #1" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Descripción</label>
                  <textarea className="input-field" placeholder="Descripción del equipo..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={{ minHeight: 70 }} />
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Área *</label>
                    <select className="input-field" value={form.area_id} onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
                      <option value="">Seleccionar área</option>
                      {areas.map((a: any) => <option key={a.id} value={a.id}>{a.planta?.nombre} — {a.nombre}</option>)}
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
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave}>{editMode ? 'Guardar Cambios' : 'Crear Activo'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedActivo && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div className="modal-header">
                <h2>Detalle del Activo</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ gap: 0 }}>
                {[
                  ['Código', selectedActivo.codigo],
                  ['Nombre', selectedActivo.nombre],
                  ['Descripción', selectedActivo.descripcion || '—'],
                  ['Marca / Modelo', `${selectedActivo.marca || '—'} / ${selectedActivo.modelo || '—'}`],
                  ['N° Serie', selectedActivo.numero_serie || '—'],
                  ['Estado', selectedActivo.estado.replace(/_/g, ' ')],
                  ['Criticidad', selectedActivo.prioridad_criticidad],
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
