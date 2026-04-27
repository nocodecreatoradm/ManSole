import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            app: 'mansole',
            ms_role: 'operador',
          },
        },
      })
      if (error) throw error
      toast.success('¡Cuenta creada! Inicia sesión para continuar.')
      navigate('/login')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear cuenta'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card-static"
        style={{ width: '100%', maxWidth: 440, padding: '48px 40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-cyan))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 24, marginBottom: 16,
          }}>M</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Crear Cuenta
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
            Únete a ManSole — Gestión de Mantenimiento
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label htmlFor="reg-name">Nombre completo</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="reg-name" type="text" className="input-field" placeholder="Juan Pérez" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ paddingLeft: 42 }} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="reg-email" type="email" className="input-field" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: 42 }} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: 42, paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <><UserPlus size={18} /> Crear Cuenta</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Inicia Sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
