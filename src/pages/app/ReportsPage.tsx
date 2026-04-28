import { FileText, Download, Table, FilePieChart, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function ReportsPage() {
  
  const handleExport = (category: 'assets' | 'work-orders' | 'performance', type: 'pdf' | 'excel') => {
    const url = `${API_URL}/reports/${category}/${type}`;
    window.open(url, '_blank');
  };

  const reportCards = [
    {
      id: 'assets',
      title: 'Inventario de Activos',
      description: 'Listado completo de activos, ubicación, estado actual y criticidad.',
      icon: <FileText size={24} style={{ color: 'var(--info)' }} />,
      actions: [
        { label: 'Exportar PDF', icon: <Download size={16} />, onClick: () => handleExport('assets', 'pdf'), variant: 'pdf' },
        { label: 'Exportar Excel', icon: <Table size={16} />, onClick: () => handleExport('assets', 'excel'), variant: 'excel' },
      ]
    },
    {
      id: 'work-orders',
      title: 'Órdenes de Trabajo',
      description: 'Histórico detallado de OTs, tiempos de ejecución y asignaciones.',
      icon: <FilePieChart size={24} style={{ color: 'var(--brand-primary)' }} />,
      actions: [
        { label: 'Exportar PDF', icon: <Download size={16} />, onClick: () => handleExport('work-orders', 'pdf'), variant: 'pdf' },
        { label: 'Exportar Excel', icon: <Table size={16} />, onClick: () => handleExport('work-orders', 'excel'), variant: 'excel' },
      ]
    },
    {
      id: 'performance',
      title: 'Indicadores de Gestión',
      description: 'Métricas de confiabilidad (MTBF), mantenibilidad (MTTR) y disponibilidad global.',
      icon: <Activity size={24} style={{ color: 'var(--success)' }} />,
      actions: [
        { label: 'Exportar PDF', icon: <Download size={16} />, onClick: () => handleExport('performance', 'pdf'), variant: 'pdf' },
      ]
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Reportes y Exportación</h1>
          <p>Genera informes de gestión en formatos estándar para auditoría y análisis</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        {reportCards.map((report, idx) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card"
            style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)' }}>
                {report.icon}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>{report.title}</h3>
            </div>
            
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: 14 }}>
               {report.description}
            </p>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
              {report.actions.map((action, aidx) => (
                <button
                  key={aidx}
                  onClick={action.onClick}
                  className={`btn ${action.variant === 'excel' ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1, gap: 8 }}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
