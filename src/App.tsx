import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Layout
import AppLayout from './components/layout/AppLayout'
import Background from './components/common/Background'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// App Pages
import DashboardPage from './pages/app/DashboardPage'
import AssetsPage from './pages/app/AssetsPage'
import WorkOrdersPage from './pages/app/WorkOrdersPage'
import WorkRequestsPage from './pages/app/WorkRequestsPage'
import PlantasPage from './pages/app/PlantasPage'
import UsersPage from './pages/app/UsersPage'
import ReportsPage from './pages/app/ReportsPage'
import SettingsPage from './pages/app/SettingsPage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { profile, loading, setLoading } = useAuthStore()
  
  useEffect(() => {
    // Basic loading state management
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [setLoading])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  if (roles && !roles.includes(profile.role)) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { loadUserData } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  }, [theme])

  useEffect(() => {
    const token = localStorage.getItem('mansole_token')
    if (token) {
      loadUserData()
    }
  }, [loadUserData])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Background />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="activos" element={<AssetsPage />} />
            <Route path="ordenes" element={<WorkOrdersPage />} />
            <Route path="solicitudes" element={<WorkRequestsPage />} />
            <Route path="plantas" element={
              <ProtectedRoute roles={['admin', 'supervisor']}>
                <PlantasPage />
              </ProtectedRoute>
            } />
            <Route path="usuarios" element={
              <ProtectedRoute roles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="reportes" element={
              <ProtectedRoute roles={['admin', 'supervisor']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
