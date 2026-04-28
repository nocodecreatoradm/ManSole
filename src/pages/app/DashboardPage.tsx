import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { motion } from 'framer-motion'
import { Cog, Wrench, AlertTriangle, CheckCircle, Clock, TrendingUp, ArrowRight, Zap, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, AreaChart, Area } from 'recharts'

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await api.analytics.getDashboardSummary()
      if (error) throw new Error(error)
      return data
    },
    refetchInterval: 1000 * 60 * 2, // Auto-refresh every 2 mins
  })

  const stats = summary?.assetStats || { total: 0, operativos: 0, en_mantenimiento: 0, fuera_de_servicio: 0 }
  const otStats = summary?.otStats || { abiertas: 0, en_proceso: 0, completadas: 0, criticas: 0 }
  const kpis = summary?.kpis || { MTTR: 0, MTBF: 0, TotalFailures: 0, Availability: 0 }
  const trends = summary?.trends || []
  const recentOTs = summary?.recentOTs || []
  const recentAssets = summary?.recentAssets || []

  const assetPieData = [
    { name: 'Operativos', value: stats.operativos, color: '#22c55e' },
    { name: 'En Mtto.', value: stats.en_mantenimiento, color: '#f59e0b' },
    { name: 'Fuera Serv.', value: stats.fuera_de_servicio, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const containerAnim = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  return (
    <motion.div variants={containerAnim} initial="hidden" animate="show">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen general del estado de activos y mantenimiento</p>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div variants={itemAnim} className="grid-4" style={{ marginBottom: 32 }}>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <Cog size={22} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Activos</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.operativos}</div>
          <div className="stat-label">Operativos</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Wrench size={22} />
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{otStats.en_proceso}</div>
          <div className="stat-label">OTs en Proceso</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value" style={{ color: 'var(--error)' }}>{otStats.criticas}</div>
          <div className="stat-label">OTs Críticas</div>
        </div>
      </motion.div>

      {/* Main KPI Stats */}
      <motion.div variants={itemAnim} className="grid-4" style={{ marginBottom: 32 }}>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Activity size={22} />
          </div>
          <div className="stat-value">{kpis.Availability.toFixed(1)}%</div>
          <div className="stat-label">Disponibilidad Global</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <Clock size={22} />
          </div>
          <div className="stat-value">{kpis.MTTR.toFixed(1)}h</div>
          <div className="stat-label">MTTR (Promedio Reparación)</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <Zap size={22} />
          </div>
          <div className="stat-value">{kpis.MTBF.toFixed(0)}h</div>
          <div className="stat-label">MTBF (Tiempo entre Fallas)</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value">{kpis.TotalFailures}</div>
          <div className="stat-label">Fallas (Últimos 30 días)</div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemAnim} className="grid-2" style={{ marginBottom: 32 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Tendencia de Mantenimiento</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#8b5cf6' }} /> Prev.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }} /> Corr.
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCorr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="preventive" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPrev)" strokeWidth={2} />
              <Area type="monotone" dataKey="corrective" stroke="#ef4444" fillOpacity={1} fill="url(#colorCorr)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Estado Global de Activos</h3>
          <div style={{ display: 'flex', gap: 24, height: '100%', alignItems: 'center' }}>
            <div style={{ width: '50%' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={assetPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {assetPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {assetPieData.map((d, i) => (
                <div key={i} className="glass-card" style={{ padding: '12px 16px', background: 'var(--bg-surface-soft)', border: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{((d.value / stats.total) * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'var(--border-default)', borderRadius: 2 }}>
                    <div style={{ width: `${(d.value / stats.total) * 100}%`, height: '100%', background: d.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemAnim} className="grid-2">
        {/* Recent Work Orders */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>
              <Clock size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Últimas Órdenes de Trabajo
            </h3>
            <Link to="/app/ordenes" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--brand-primary)', fontWeight: 600 }}>
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          {recentOTs.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p style={{ fontSize: 13 }}>No hay órdenes de trabajo registradas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentOTs.map((ot: any) => (
                <div key={ot.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-soft)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ot.titulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ot.codigo_ot} • {ot.activo_nombre || 'N/A'}</div>
                  </div>
                  <span className={`badge badge-${ot.estado.replace('_', '-')}`}>{ot.estado.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assets needing attention */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>
              <TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Activos que Requieren Atención
            </h3>
            <Link to="/app/activos" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--brand-primary)', fontWeight: 600 }}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          {recentAssets.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <CheckCircle size={28} style={{ color: 'var(--success)' }} />
              <p style={{ fontSize: 13, color: 'var(--success)' }}>¡Todos los activos operativos!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentAssets.map((asset: any) => (
                <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-soft)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{asset.codigo} • {asset.area?.nombre || 'N/A'}</div>
                  </div>
                  <span className={`badge badge-${asset.estado.replace(/_/g, '-')}`}>{asset.estado.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
