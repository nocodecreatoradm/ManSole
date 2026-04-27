import { useEffect, useState } from 'react'
import { supabase, type MsProfile } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Shield, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const [users, setUsers] = useState<MsProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<MsProfile | null>(null)
  const [editRole, setEditRole] = useState('')

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('ms_profiles').select('*').order('full_name')
      if (data) setUsers(data)
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  const filtered = users.filter(u =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleUpdateRole = async () => {
    if (!editUser) return
    try {
      const { error } = await supabase.from('ms_profiles').update({ role: editRole, updated_at: new Date().toISOString() }).eq('id', editUser.id)
      if (error) throw error
      toast.success('Rol actualizado')
      setEditUser(null)
      loadUsers()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') }
  }

  const toggleActive = async (user: MsProfile) => {
    try {
      const { error } = await supabase.from('ms_profiles').update({ is_active: !user.is_active, updated_at: new Date().toISOString() }).eq('id', user.id)
      if (error) throw error
      toast.success(user.is_active ? 'Usuario desactivado' : 'Usuario activado')
      loadUsers()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Error') }
  }

  const roleLabels: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', tecnico: 'Técnico', operador: 'Operador' }
  const roleColors: Record<string, string> = { admin: 'var(--error)', supervisor: 'var(--warning)', tecnico: 'var(--info)', operador: 'var(--text-secondary)' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>

  return (
    <div>
      <div className="page-header"><div><h1>Gestión de Usuarios</h1><p>Administra roles y permisos del equipo</p></div></div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 42 }} />
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><Users size={28} /></div><h3>Sin usuarios</h3></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Especialidad</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
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
                  <td><span className={`badge ${u.is_active ? 'badge-operativo' : 'badge-dado-de-baja'}`}>{u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditUser(u); setEditRole(u.role) }}><Shield size={14} /> Rol</button>
                      <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActive(u)} style={{ fontSize: 11 }}>
                        {u.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditUser(null)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modal-header"><h2>Cambiar Rol</h2><button className="btn btn-ghost btn-icon" onClick={() => setEditUser(null)}><X size={20} /></button></div>
              <div className="modal-body">
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Usuario: <strong>{editUser.full_name}</strong></p>
                <div className="input-group">
                  <label>Nuevo Rol</label>
                  <select className="input-field" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                    <option value="admin">Administrador</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="tecnico">Técnico</option>
                    <option value="operador">Operador</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleUpdateRole}>Guardar</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
