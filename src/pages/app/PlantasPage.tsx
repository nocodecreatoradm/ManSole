import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { MsPlanta, MsArea } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Factory, MapPin, X, Trash2, Building } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

export default function PlantasPage() {
  const { profile } = useAuthStore()
  const [plantas, setPlantas] = useState<(MsPlanta & { areas: MsArea[] })[]>([])
  const [loading, setLoading] = useState(true)
  
  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerType, setDrawerType] = useState<'planta' | 'area'>('planta')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPlanta] = useState<MsPlanta | null>(null)

  // Forms
  const [plantaForm, setPlantaForm] = useState({ nombre: '', direccion: '' })
  const [areaForm, setAreaForm] = useState({ nombre: '', descripcion: '', planta_id: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [{ data: p }, { data: a }] = await Promise.all([
        api.plantas.getAll(),
        api.areas.getAll()
      ])
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

  const handleSavePlanta = async () => {
    if (!plantaForm.nombre) { toast.error('El nombre es obligatorio'); return }
    try {
      if (isEditing && selectedPlanta) {
        // Update not implemented in API yet, but we'll follow the pattern
        toast.error('Actualización de planta no disponible aún')
      } else {
        const { error } = await api.plantas.create(plantaForm)
        if (error) throw new Error(error)
        toast.success('Planta creada')
      }
      setShowDrawer(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar planta')
    }
  }

  const handleSaveArea = async () => {
    if (!areaForm.nombre || !areaForm.planta_id) { toast.error('Completa los campos'); return }
    try {
      const { error } = await api.areas.create(areaForm)
      if (error) throw new Error(error)
      toast.success('Área guardada')
      setShowDrawer(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar área')
    }
  }

  const openNewPlanta = () => {
    setPlantaForm({ nombre: '', direccion: '' })
    setDrawerType('planta')
    setIsEditing(false)
    setShowDrawer(true)
  }

  const openNewArea = (plantaId: string) => {
    setAreaForm({ nombre: '', descripcion: '', planta_id: plantaId })
    setDrawerType('area')
    setIsEditing(false)
    setShowDrawer(true)
  }

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('¿Eliminar esta área?')) return
    try {
      const { error } = await api.areas.delete(areaId)
      if (error) throw new Error(error)
      toast.success('Área eliminada')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
    }
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Plantas y Áreas</h1>
          <p>Estructura organizacional de ubicaciones — <strong>Inline / Detail / Form</strong></p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openNewPlanta}><Plus size={18} /> Nueva Planta</button>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {plantas.length === 0 ? (
          <div className="glass-card">
            <div className="empty-state">
              <div className="empty-icon"><Factory size={28} /></div>
              <h3>Sin plantas registradas</h3>
              <p>Crea tu primera planta para organizar la estructura de activos.</p>
            </div>
          </div>
        ) : (
          plantas.map((planta) => (
            <motion.div key={planta.id} className="glass-card" style={{ padding: 28 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Factory size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>{planta.nombre}</h3>
                    {planta.direccion && <p style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {planta.direccion}</p>}
                  </div>
                </div>
                {isAdmin && (
                  <button className="btn btn-secondary btn-sm" onClick={() => openNewArea(planta.id)}>
                    <Plus size={14} /> Agregar Área
                  </button>
                )}
              </div>

              {planta.areas.length === 0 ? (
                <div style={{ background: 'var(--bg-surface-soft)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px dashed var(--border-default)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin áreas registradas en esta planta</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {planta.areas.map((area) => (
                    <div key={area.id} className="area-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-soft)', border: '1px solid var(--border-default)', transition: 'all 0.2s ease' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--accent-cyan-bg)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{area.nombre}</div>
                        {area.descripcion && <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{area.descripcion}</div>}
                      </div>
                      {isAdmin && (
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDeleteArea(area.id)} style={{ color: 'var(--error)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showDrawer && (
          <motion.div className="drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDrawer(false)}>
            <motion.div className="drawer-content slide-in-right" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} onClick={(e) => e.stopPropagation()}>
              
              <div className="drawer-header">
                <h2>{drawerType === 'planta' ? (isEditing ? 'Editar Planta' : 'Nueva Planta') : 'Nueva Área'}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
              </div>

              <div className="drawer-body">
                {drawerType === 'planta' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="input-group">
                      <label>Nombre de la Planta *</label>
                      <input className="input-field" placeholder="Ej: Planta Lurín" value={plantaForm.nombre} onChange={(e) => setPlantaForm({ ...plantaForm, nombre: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Dirección</label>
                      <input className="input-field" placeholder="Ej: Av. Industrial 456" value={plantaForm.direccion} onChange={(e) => setPlantaForm({ ...plantaForm, direccion: e.target.value })} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="input-group">
                      <label>Nombre del Área *</label>
                      <input className="input-field" placeholder="Ej: Almacén de Repuestos" value={areaForm.nombre} onChange={(e) => setAreaForm({ ...areaForm, nombre: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Descripción</label>
                      <textarea className="input-field" placeholder="Descripción breve..." value={areaForm.descripcion} onChange={(e) => setAreaForm({ ...areaForm, descripcion: e.target.value })} style={{ minHeight: 100 }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="drawer-footer">
                <button className="btn btn-secondary" onClick={() => setShowDrawer(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={drawerType === 'planta' ? handleSavePlanta : handleSaveArea}>
                  {isEditing ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
