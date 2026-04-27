import { useEffect, useState } from 'react'
import { supabase, type MsOrdenTrabajo, type MsActivo } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Cog, Wrench, AlertTriangle, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalActivos: 0, operativos: 0, enMantenimiento: 0, fueraServicio: 0 })
  const [otStats, setOtStats] = useState({ abiertas: 0, enProceso: 0, completadas: 0, criticas: 0 })
  const [recentOTs, setRecentOTs] = useState<MsOrdenTrabajo[]>([])
  const [recentAssets, setRecentAssets] = useState<MsActivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      // Asset stats
      const { data: activos } = await supabase.from('ms_activos').select('estado')
      if (activos) {
        setStats({
          totalActivos: activos.length,
          operativos: activos.filter(a => a.estado === 'operativo').length,
          enMantenimiento: activos.filter(a => a.estado === 'en_mantenimiento').length,
          fueraServicio: activos.filter(a => a.estado === 'fuera_de_servicio').length,
        })
      }

      // OT stats
      const { data: ots } = await supabase.from('ms_ordenes_trabajo').select('estado, prioridad')
      if (ots) {
        setOtStats({
          abiertas: ots.filter(o => ['solicitada', 'aprobada'].includes(o.estado)).length,
          enProceso: ots.filter(o => o.estado === 'en_proceso').length,
          completadas: ots.filter(o => ['completada', 'cerrada'].includes(o.estado)).length,
          criticas: ots.filter(o => o.prioridad === 'critica' && !['cerrada', 'cancelada', 'completada'].includes(o.estado)).length,
        })
      }

      // Recent OTs
      const { data: recent } = await supabase
        .from('ms_ordenes_trabajo')
        .select('*, activo:ms_activos(nombre, codigo), tecnico_asignado:ms_profiles!ms_ordenes_trabajo_tecnico_asignado_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)
      if (recent) setRecentOTs(recent as unknown as MsOrdenTrabajo[])

      // Recent assets with issues
      const { data: assets } = await supabase
        .from('ms_activos')
        .select('*, area:ms_areas(nombre)')
        .in('estado', ['en_mantenimiento', 'fuera_de_servicio'])
        .order('updated_at', { ascending: false })
        .limit(5)
      if (assets) setRecentAssets(assets as unknown as MsActivo[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const assetPieData = [
    { name: 'Operativos', value: stats.operativos, color: '#22c55e' },
    { name: 'En Mtto.', value: stats.enMantenimiento, color: '#f59e0b' },
    { name: 'Fuera Serv.', value: stats.fueraServicio, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const otBarData = [
    { name: 'Abiertas', value: otStats.abiertas, fill: '#8b5cf6' },
    { name: 'En Proceso', value: otStats.enProceso, fill: '#f59e0b' },
    { name: 'Completadas', value: otStats.completadas, fill: '#22c55e' },
    { name: 'Críticas', value: otStats.criticas, fill: '#ef4444' },
  ]

  const containerAnim = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  if (loading) {
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
          <div className="stat-value">{stats.totalActivos}</div>
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
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{otStats.enProceso}</div>
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

      {/* Charts Row */}
      <motion.div variants={itemAnim} className="grid-2" style={{ marginBottom: 32 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Estado de Activos</h3>
          {assetPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={assetPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {assetPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>Sin datos de activos aún</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
            {assetPieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Órdenes de Trabajo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={otBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-default)' }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-default)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {otBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ot.codigo_ot} • {ot.activo?.nombre || 'N/A'}</div>
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
