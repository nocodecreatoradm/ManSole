import { FileText } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div>
      <div className="page-header">
        <div><h1>Reportes</h1><p>Análisis y métricas de mantenimiento (próximamente)</p></div>
      </div>
      <div className="glass-card">
        <div className="empty-state">
          <div className="empty-icon"><FileText size={28} /></div>
          <h3>Módulo de Reportes</h3>
          <p>Los reportes avanzados de KPIs (MTBF, MTTR, Disponibilidad, Costos) estarán disponibles en la Fase 3 del proyecto.</p>
        </div>
      </div>
    </div>
  )
}
