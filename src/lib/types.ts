
export type MsProfile = {
  id: string
  user_id: string
  email: string
  full_name: string
  role: 'admin' | 'supervisor' | 'tecnico' | 'operador'
  especialidad: string | null
  telefono: string | null
  turno: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MsRepuesto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  uom: string
  stock_actual: number
  stock_minimo: number
  costo_unitario: number
  ubicacion: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MsInventarioMovimiento {
  id: string
  repuesto_id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  referencia_tipo: string | null
  referencia_id: string | null
  usuario_id: string | null
  usuario_nombre?: string
  notas: string | null
  fecha_movimiento: string
}

export type MsPlanta = {
  id: string
  nombre: string
  direccion: string | null
  is_active: boolean
  created_at: string
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
  icon: string | null
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
  fecha_adquisicion: string | null
  fecha_fin_garantia: string | null
  prioridad_criticidad: 'critica' | 'alta' | 'media' | 'baja'
  estado: 'operativo' | 'en_mantenimiento' | 'fuera_de_servicio' | 'dado_de_baja'
  created_at: string
  updated_at: string
  area?: MsArea
  categoria?: MsCategoriaActivo
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
  aprobador_id: string | null
  fecha_aprobacion: string | null
  motivo_rechazo: string | null
  created_at: string
  updated_at: string
  activo?: MsActivo
  solicitante?: MsProfile
}

export type MsOrdenTrabajo = {
  id: string
  codigo_ot: string
  solicitud_id: string | null
  activo_id: string
  tipo: 'preventiva' | 'correctiva' | 'predictiva' | 'mejora'
  prioridad: 'critica' | 'alta' | 'media' | 'baja'
  estado: 'solicitada' | 'aprobada' | 'en_proceso' | 'completada' | 'cerrada' | 'cancelada'
  titulo: string
  descripcion: string | null
  creador_id: string
  tecnico_asignado_id: string | null
  fecha_programada: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  tiempo_estimado_horas: number | null
  tiempo_real_horas: number | null
  costo_materiales: number | null
  costo_mano_obra: number | null
  observaciones_tecnicas: string | null
  created_at: string
  updated_at: string
  activo?: MsActivo
  tecnico?: MsProfile
}

export type MsHistorialActivo = {
  id: string
  activo_id: string
  ot_id: string | null
  tipo_evento: string
  descripcion: string
  fecha: string
}

export type MsParteActivo = {
  id: string
  activo_id: string
  codigo: string
  nombre: string
  descripcion: string | null
  is_active: boolean
  created_at: string
}

export type MsComponenteParte = {
  id: string
  parte_id: string
  codigo: string
  nombre: string
  descripcion: string | null
  numero_parte: string | null
  is_active: boolean
  created_at: string
}

export type MsActividadOT = {
  id: string
  ot_id: string
  parte_id: string
  descripcion: string
  tipo_actividad: 'inspeccion' | 'reparacion' | 'reemplazo' | 'lubricacion' | 'ajuste'
  estado: 'pendiente' | 'en_progreso' | 'completada'
  observaciones: string | null
  created_at: string
  completed_at: string | null
  parte_nombre?: string
}

export type MsComponenteActividad = {
  id: string
  actividad_id: string
  componente_id: string
  cantidad: number
  accion: string
  observaciones: string | null
  created_at: string
  componente_nombre?: string
  componente_codigo?: string
}

export type MsPlanPreventivo = {
  id: string
  activo_id: string
  nombre: string
  descripcion: string | null
  frecuencia_dias: number
  ultima_fecha: string | null
  proxima_fecha: string
  prioridad: 'critica' | 'alta' | 'media' | 'baja'
  is_active: boolean
  created_at: string
  updated_at: string
  activo_nombre?: string
  activo_codigo?: string
}
