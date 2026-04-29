import { useEffect, useState, useMemo } from 'react'
import { api } from '../../lib/api'
import type { MsProfile } from '../../lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Shield, X, Eye, Mail, Phone, Clock, Briefcase, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const [users, setUsers] = useState<MsProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'detail' | 'form'>('detail')
  const [selectedUser, setSelectedUser] = useState<MsProfile | null>(null)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const { data } = await api.profiles.getAll()
      if (data) setUsers(data)
    } catch { toast.error('Error al cargar usuarios') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    return users.filter(u =>
      !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  const handleUpdateRole = async (role: string) => {
    if (!selectedUser) return
    try {
      const { error } = await api.profiles.update(selectedUser.id, { role: role as any })
      if (error) throw new Error(error)
      toast.success('Rol actualizado')
      setShowDrawer(false)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar rol')
    }
  }

  const toggleActive = async (user: MsProfile) => {
    try {
      const { error } = await api.profiles.update(user.id, { is_active: !user.is_active })
      if (error) throw new Error(error)
      toast.success(user.is_active ? 'Usuario desactivado' : 'Usuario activado')
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado')
    }
  }

  const openDetail = (user: MsProfile) => {
    setSelectedUser(user)
    setDrawerMode('detail')
    setShowDrawer(true)
  }

  const openEditRole = () => {
    setDrawerMode('form')
  }

  const roleLabels: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', tecnico: 'Técnico', operador: 'Operador' }
  const roleColors: Record<string, string> = { admin: 'var(--error)', supervisor: 'var(--warning)', tecnico: 'var(--info)', operador: 'var(--text-secondary)' }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra roles y permisos del equipo — <strong>Inline / Detail / Form</strong></p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={18} />
          <input className="input-field" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={28} /></div>
            <h3>No hay usuarios</h3>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Especialidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="row-hover" onClick={() => openDetail(u)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${roleColors[u.role]}, var(--accent-cyan))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                        {u.full_name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className="badge" style={{ background: `${roleColors[u.role]}20`, color: roleColors[u.role] }}>{roleLabels[u.role]}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.especialidad || '—'}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-operativo' : 'badge-dado-de-baja'}`}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); openDetail(u) }}>
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
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>{drawerMode === 'detail' ? 'Detalle de Usuario' : 'Cambiar Rol'}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowDrawer(false)} style={{ background: 'var(--bg-surface-soft)', borderRadius: '50%' }}><X size={20} /></button>
              </div>

              <div className="drawer-body">
                {selectedUser && (
                  <>
                    {drawerMode === 'detail' ? (
                      <>
                        <div style={{ textAlign: 'center', marginBottom: 30, marginTop: 10 }}>
                          <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${roleColors[selectedUser.role]}, var(--accent-cyan))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 32, margin: '0 auto 16px' }}>
                            {selectedUser.full_name.charAt(0)}
                          </div>
                          <h3 style={{ fontSize: 22 }}>{selectedUser.full_name}</h3>
                          <p style={{ color: 'var(--text-muted)' }}>{roleLabels[selectedUser.role]}</p>
                        </div>

                        <div className="drawer-section">
                          <div className="drawer-section-title">Información de Contacto</div>
                          <div className="detail-row">
                            <span className="detail-label"><Mail size={14} /> Email</span>
                            <span>{selectedUser.email}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label"><Phone size={14} /> Teléfono</span>
                            <span>{selectedUser.telefono || 'No registrado'}</span>
                          </div>
                        </div>

                        <div className="drawer-section">
                          <div className="drawer-section-title">Detalles Laborales</div>
                          <div className="detail-row">
                            <span className="detail-label"><Briefcase size={14} /> Especialidad</span>
                            <span>{selectedUser.especialidad || 'General'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label"><Clock size={14} /> Turno</span>
                            <span>{selectedUser.turno || 'Sin asignar'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label"><CheckCircle size={14} /> Estado</span>
                            <span className={`badge ${selectedUser.is_active ? 'badge-operativo' : 'badge-dado-de-baja'}`}>
                              {selectedUser.is_active ? 'Cuenta Activa' : 'Cuenta Suspendida'}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="input-group">
                          <label>Seleccionar nuevo rol para {selectedUser.full_name}</label>
                          <select 
                            className="input-field" 
                            defaultValue={selectedUser.role}
                            onChange={(e) => handleUpdateRole(e.target.value)}
                            style={{ height: 50, fontSize: 16 }}
                          >
                            <option value="admin">Administrador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="tecnico">Técnico</option>
                            <option value="operador">Operador</option>
                          </select>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          <AlertCircle size={14} style={{ marginBottom: -3, marginRight: 4 }} />
                          Cambiar el rol afectará los permisos de acceso del usuario de forma inmediata.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="drawer-footer" style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-surface-soft)' }}>
                <button className="btn btn-secondary" onClick={() => setShowDrawer(false)}>Cerrar</button>
                {drawerMode === 'detail' && selectedUser && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className={`btn ${selectedUser.is_active ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleActive(selectedUser)}>
                      {selectedUser.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button className="btn btn-primary" onClick={openEditRole}>
                      <Shield size={16} /> Cambiar Rol
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
