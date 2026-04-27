import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  Cog,
  Users,
  FileText,
  Factory,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Activos', path: '/app/activos', icon: Cog },
    { label: 'Órdenes de Trabajo', path: '/app/ordenes', icon: Wrench },
    { label: 'Solicitudes', path: '/app/solicitudes', icon: ClipboardList },
    { label: 'Plantas y Áreas', path: '/app/plantas', icon: Factory, roles: ['admin', 'supervisor'] },
    { label: 'Usuarios', path: '/app/usuarios', icon: Users, roles: ['admin'] },
    { label: 'Reportes', path: '/app/reportes', icon: FileText, roles: ['admin', 'supervisor'] },
    { label: 'Configuración', path: '/app/configuracion', icon: Settings },
  ];

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    tecnico: 'Técnico',
    operador: 'Operador',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: 'var(--text-primary)' }}>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90, backdropFilter: 'blur(4px)' }}
          className="mobile-only"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(var(--bg-surface-rgb), 0.7)',
          backdropFilter: 'blur(20px)',
          position: 'fixed',
          height: '100vh',
          zIndex: 100,
          left: 0,
          top: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 900,
              fontSize: 18,
            }}
          >
            M
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>
            Man<span style={{ color: 'var(--brand-primary)' }}>Sole</span>
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(profile?.role || '')) return null;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: active ? 'var(--brand-primary-light)' : 'var(--text-secondary)',
                  background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  fontWeight: active ? 700 : 500,
                  transition: 'var(--transition-base)',
                  fontSize: 14,
                }}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: 24, borderTop: '1px solid var(--border-default)' }}>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-full"
            style={{
              marginBottom: 16,
              justifyContent: 'flex-start',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span style={{ fontSize: 14, marginLeft: 12 }}>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profile?.full_name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {roleLabels[profile?.role || 'operador']}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, marginLeft: 'var(--sidebar-width)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 70,
            borderBottom: '1px solid var(--border-default)',
            background: 'rgba(var(--bg-surface-rgb), 0.5)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div className="mobile-only" style={{ marginRight: 16 }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <Menu size={24} />
            </button>
          </div>
          <div style={{ flex: 1 }} />
        </header>

        <div className="page-content" style={{ padding: 40, flex: 1, position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
