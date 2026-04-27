import { useAuthStore } from '../../store/authStore'
import { Settings, User, Building } from 'lucide-react'

export default function SettingsPage() {
  const { profile } = useAuthStore()

  const roleLabels: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', tecnico: 'Técnico', operador: 'Operador' }

  return (
    <div>
      <div className="page-header">
        <div><h1>Configuración</h1><p>Ajustes de tu cuenta y la plataforma</p></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
        {/* Profile Info */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <User size={20} style={{ color: 'var(--brand-primary)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Información Personal</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Nombre', profile?.full_name || '—'],
              ['Email', profile?.email || '—'],
              ['Rol', roleLabels[profile?.role || 'operador']],
              ['Especialidad', profile?.especialidad || 'No especificada'],
              ['Turno', profile?.turno || 'No asignado'],
              ['Teléfono', profile?.telefono || 'No registrado'],
            ].map(([label, value]) => (
              <div className="detail-row" key={label}>
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Info */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <Building size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Plataforma</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Aplicación', 'ManSole CMMS/EAM'],
              ['Empresa', 'MT Industrial S.A.C.'],
              ['Versión', 'v1.0.0'],
            ].map(([label, value]) => (
              <div className="detail-row" key={label}>
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Settings size={20} style={{ color: 'var(--accent-violet)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Acerca de ManSole</h3>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            ManSole es una plataforma de Gestión de Mantenimiento Asistido por Computadora (CMMS) y 
            Gestión de Activos Empresariales (EAM) diseñada para optimizar las operaciones de 
            mantenimiento industrial en MT Industrial S.A.C.
          </p>
        </div>
      </div>
    </div>
  )
}
