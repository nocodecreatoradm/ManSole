import { useEffect, useState } from 'react'
import { supabase, type MsPlanta, type MsArea } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Factory, MapPin, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PlantasPage() {
  const [plantas, setPlantas] = useState<(MsPlanta & { areas: MsArea[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlantaModal, setShowPlantaModal] = useState(false)
  const [showAreaModal, setShowAreaModal] = useState(false)
  const [selectedPlantaId, setSelectedPlantaId] = useState('')
  const [plantaForm, setPlantaForm] = useState({ nombre: '', direccion: '' })
  const [areaForm, setAreaForm] = useState({ nombre: '', descripcion: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data: p } = await supabase.from('ms_plantas').select('*').eq('is_active', true).order('nombre')
      const { data: a } = await supabase.from('ms_areas').select('*').eq('is_active', true).order('nombre')
      if (p && a) {
        const plantasWithAreas = p.map(planta => ({
          ...planta,
          areas: a.filter(area => area.planta_id === planta.id),
        }))
        setPlantas(plantasWithAreas)
      }
    } catch { toast.error('Error cargando datos') }
    finally { setLoading(false) }
  }

  const handleCreatePlanta = async () => {
    if (!plantaForm.nombre) { toast.error('El nombre es obligatorio'); return }
    try {
      const { error } = await supabase.from('ms_plantas').insert([plantaForm])
      if (error) throw error
      toast.success('Planta creada')
      setShowPlantaModal(false)
      setPlantaForm({ nombre: '', direccion: '' })
      loadData()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') }
  }

  const handleCreateArea = async () => {
    if (!areaForm.nombre || !selectedPlantaId) { toast.error('Completa los campos'); return }
    try {
      const { error } = await supabase.from('ms_areas').insert([{ ...areaForm, planta_id: selectedPlantaId }])
      if (error) throw error
      toast.success('Área creada')
      setShowAreaModal(false)
      setAreaForm({ nombre: '', descripcion: '' })
      loadData()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') }
  }

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('¿Eliminar esta área?')) return
    try {
      const { error } = await supabase.from('ms_areas').update({ is_active: false }).eq('id', areaId)
      if (error) throw error
      toast.success('Área eliminada')
      loadData()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header">
        <div><h1>Plantas y Áreas</h1><p>Estructura organizacional de ubicaciones</p></div>
        <button className="btn btn-primary" onClick={() => setShowPlantaModal(true)}><Plus size={18} /> Nueva Planta</button>
      </div>

      {plantas.length === 0 ? (
        <div className="glass-card"><div className="empty-state"><div className="empty-icon"><Factory size={28} /></div><h3>Sin plantas registradas</h3><p>Crea tu primera planta para organizar la estructura de activos.</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {plantas.map((planta) => (
            <motion.div key={planta.id} className="glass-card" style={{ padding: 28 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Factory size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{planta.nombre}</h3>
                    {planta.direccion && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{planta.direccion}</p>}
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedPlantaId(planta.id); setShowAreaModal(true) }}>
                  <Plus size={14} /> Agregar Área
                </button>
              </div>

              {planta.areas.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Sin áreas registradas en esta planta</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {planta.areas.map((area) => (
                    <div key={area.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-soft)', border: '1px solid var(--border-default)' }}>
                      <MapPin size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{area.nombre}</div>
                        {area.descripcion && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{area.descripcion}</div>}
                      </div>
                      <button onClick={() => handleDeleteArea(area.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Planta Modal */}
      <AnimatePresence>
        {showPlantaModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPlantaModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h2>Nueva Planta</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowPlantaModal(false)}><X size={20} /></button></div>
              <div className="modal-body">
                <div className="input-group"><label>Nombre *</label><input className="input-field" placeholder="Ej: Planta Principal" value={plantaForm.nombre} onChange={(e) => setPlantaForm({ ...plantaForm, nombre: e.target.value })} /></div>
                <div className="input-group"><label>Dirección</label><input className="input-field" placeholder="Ej: Av. Industrial 123" value={plantaForm.direccion} onChange={(e) => setPlantaForm({ ...plantaForm, direccion: e.target.value })} /></div>
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowPlantaModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCreatePlanta}>Crear Planta</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Area Modal */}
      <AnimatePresence>
        {showAreaModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAreaModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header"><h2>Nueva Área</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowAreaModal(false)}><X size={20} /></button></div>
              <div className="modal-body">
                <div className="input-group"><label>Nombre *</label><input className="input-field" placeholder="Ej: Línea de Producción 1" value={areaForm.nombre} onChange={(e) => setAreaForm({ ...areaForm, nombre: e.target.value })} /></div>
                <div className="input-group"><label>Descripción</label><input className="input-field" placeholder="Descripción del área" value={areaForm.descripcion} onChange={(e) => setAreaForm({ ...areaForm, descripcion: e.target.value })} /></div>
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowAreaModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCreateArea}>Crear Área</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
