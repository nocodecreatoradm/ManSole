import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/* =============================================
   ManSole Database Types
   ============================================= */

export type MsProfile = {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'supervisor' | 'tecnico' | 'operador'
  especialidad: string | null
  turno: 'mañana' | 'tarde' | 'noche' | 'rotativo' | null
  telefono: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type MsPlanta = {
  id: string
  nombre: string
  direccion: string | null
  responsable_id: string | null
  is_active: boolean
  created_at: string
  responsable?: MsProfile
}

export type MsArea = {
  id: string
  planta_id: string
  nombre: string
  descripcion: string | null
  is_active: boolean
  created_at: string
  planta?: MsPlanta
}

export type MsCategoriaActivo = {
  id: string
  nombre: string
  descripcion: string | null
  icono: string | null
  created_at: string
}

export type MsActivo = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  area_id: string
  categoria_id: string | null
  marca: string | null
  modelo: string | null
  numero_serie: string | null
  fecha_instalacion: string | null
  fecha_garantia: string | null
  estado: 'operativo' | 'en_mantenimiento' | 'fuera_de_servicio' | 'dado_de_baja'
  prioridad_criticidad: 'critica' | 'alta' | 'media' | 'baja'
  imagen_url: string | null
  qr_code: string | null
  especificaciones: Record<string, unknown>
  costo_adquisicion: number | null
  vida_util_meses: number | null
  created_at: string
  updated_at: string
  area?: MsArea
  categoria?: MsCategoriaActivo
}

export type MsOrdenTrabajo = {
  id: string
  codigo_ot: string
  activo_id: string
  tipo: 'correctiva' | 'preventiva' | 'predictiva' | 'mejora'
  prioridad: 'critica' | 'alta' | 'media' | 'baja'
  estado: 'solicitada' | 'aprobada' | 'en_proceso' | 'completada' | 'cerrada' | 'cancelada'
  titulo: string
  descripcion: string | null
  creador_id: string
  tecnico_asignado_id: string | null
  supervisor_id: string | null
  fecha_programada: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  tiempo_estimado_horas: number | null
  tiempo_real_horas: number | null
  costo_mano_obra: number
  costo_repuestos: number
  costo_total: number
  observaciones: string | null
  imagenes: string[]
  checklist: ChecklistItem[]
  firma_tecnico: string | null
  firma_supervisor: string | null
  created_at: string
  updated_at: string
  activo?: MsActivo
  creador?: MsProfile
  tecnico_asignado?: MsProfile
  supervisor?: MsProfile
}

export type ChecklistItem = {
  id: string
  texto: string
  completado: boolean
}

export type MsSolicitudTrabajo = {
  id: string
  codigo_solicitud: string
  activo_id: string
  solicitante_id: string
  titulo: string
  descripcion: string
  prioridad: 'critica' | 'alta' | 'media' | 'baja'
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'convertida'
  imagen_url: string | null
  orden_trabajo_id: string | null
  aprobador_id: string | null
  fecha_aprobacion: string | null
  motivo_rechazo: string | null
  created_at: string
  updated_at: string
  activo?: MsActivo
  solicitante?: MsProfile
  aprobador?: MsProfile
}

export type MsHistorialActivo = {
  id: string
  activo_id: string
  orden_trabajo_id: string | null
  tipo_evento: 'mantenimiento' | 'falla' | 'instalacion' | 'traslado' | 'baja' | 'modificacion'
  descripcion: string
  usuario_id: string
  created_at: string
  usuario?: MsProfile
}
