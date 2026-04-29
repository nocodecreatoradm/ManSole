import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { motion } from 'framer-motion'
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Zap, 
  Activity,
  Box,
  FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  AreaChart, 
  Area 
} from 'recharts'

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await api.analytics.getDashboardSummary()
      if (error) throw new Error(error)
      return data
    },
    refetchInterval: 1000 * 60 * 5, // 5 mins
  })

  const stats = summary?.assetStats || { total: 0, operativos: 0, en_mantenimiento: 0, fuera_de_servicio: 0 }
  const otStats = summary?.otStats || { abiertas: 0, en_proceso: 0, completadas: 0, criticas: 0 }
  const kpis = summary?.kpis || { MTTR: 0, MTBF: 0, TotalFailures: 0, Availability: 0 }
  const trends = summary?.trends || []
  const recentOTs = summary?.recentOTs || []
  const recentAssets = summary?.recentAssets || []

  const assetPieData = [
    { name: 'Operativos', value: stats.operativos, color: '#0EA5E9' },
    { name: 'En Mtto.', value: stats.en_mantenimiento, color: '#F97316' },
    { name: 'Fuera Serv.', value: stats.fuera_de_servicio, color: '#EF4444' },
  ].filter(d => d.value > 0)

  const containerAnim = { 
    hidden: { opacity: 0 }, 
    show: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    } 
  } as const
  
  const itemAnim = { 
    hidden: { opacity: 0, y: 20 }, 
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100 }
    } 
  } as const

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  return (
    <motion.div variants={containerAnim} initial="hidden" animate="show" className="page-content">
      <div className="page-header">
        <div>
          <h1>Panel de Control</h1>
          <p>Estado operativo de la planta en tiempo real</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/app/reportes" className="btn btn-secondary">
            <FileText size={18} /> Exportar Reporte
          </Link>
          <Link to="/app/ordenes" className="btn btn-primary">
             <Zap size={18} /> Nueva OT
          </Link>
        </div>
      </div>

      {/* Primary KPI Row */}
      <motion.div variants={itemAnim} className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <Box size={24} />
      {/* Stats Grid */}
      <motion.div variants={containerAnim} className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { title: 'Total Assets', value: otStats.total_activos, icon: <Activity size={24} />, color: 'primary', change: '+12%', trendUp: true },
          { title: 'Open Orders', value: otStats.abiertas, icon: <CheckCircle size={24} />, color: 'warning', change: '-5%', trendUp: false },
          { title: 'In Progress', value: otStats.en_proceso, icon: <Clock size={24} />, color: 'info', change: '+18%', trendUp: true },
          { title: 'Critical Alerts', value: otStats.criticas, icon: <AlertTriangle size={24} />, color: 'error', change: '+2%', trendUp: false }
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            variants={itemAnim}
            className="glass-card stat-card-hover"
            style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.75rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {stat.title}
              </span>
              <div style={{ 
                padding: '0.6rem', 
                borderRadius: '12px', 
                background: `var(--brand-${stat.color}-soft)`,
                color: stat.color === 'error' ? 'var(--status-error)' : `var(--brand-${stat.color})`,
                display: 'flex'
              }}>
                {stat.icon}
              </div>
            </div>
            
            <div style={{ zIndex: 1 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stat.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <span style={{ color: stat.trendUp ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 700 }}>
                  {stat.change}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Area: Bento Layout */}
      <div className="grid-12" style={{ marginBottom: '2rem' }}>
        
        {/* Maintenance Trend - 8 cols */}
        <motion.div variants={itemAnim} className="col-span-8 glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Tendencia Operativa</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Análisis de tareas preventivas vs correctivas</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Día</button>
              <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Mes</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCorr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--status-error)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--status-error)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-default)', 
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)'
                }} 
              />
              <Area type="monotone" dataKey="preventive" stroke="var(--brand-primary)" fillOpacity={1} fill="url(#colorPrev)" strokeWidth={3} />
              <Area type="monotone" dataKey="corrective" stroke="var(--status-error)" fillOpacity={1} fill="url(#colorCorr)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Asset Distribution - 4 cols */}
        <motion.div variants={itemAnim} className="col-span-4 glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Distribución</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Estado de activos en planta</p>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={assetPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" cornerRadius={6}>
                {assetPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {assetPieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        <motion.div variants={itemAnim} className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--brand-primary)" /> Últimas Órdenes
            </h3>
            <Link to="/app/ordenes" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
              Ver Todo
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentOTs.map((ot: any) => (
              <div key={ot.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', background: 'var(--bg-surface-soft)', border: '1px solid var(--border-default)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{ot.titulo}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ot.codigo_ot} • {ot.activo_nombre || 'Sin activo'}</div>
                </div>
                <span className={`badge badge-${ot.estado.replace(/_/g, '-')}`} style={{ fontSize: '10px' }}>
                  {ot.estado.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
 
        <motion.div variants={itemAnim} className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--status-error)" /> Atención Urgente
            </h3>
            <Link to="/app/activos" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
              Ver Activos
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentAssets.slice(0, 4).map((asset: any) => (
              <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--status-error)' }}>{asset.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--status-error)', opacity: 0.8 }}>{asset.codigo} • {asset.area?.nombre || 'General'}</div>
                </div>
                <span style={{ fontSize: '10px', background: 'var(--status-error)', color: 'white', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                  {asset.estado.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
