  MsParteActivo, MsComponenteParte, MsActividadOT, MsComponenteActividad,
  MsRepuesto, MsInventarioMovimiento
} from './types'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

async function request<T>(path: string, options: RequestInit = {}): Promise<{ data: T | null, error: string | null }> {
  try {
    const token = localStorage.getItem('mansole_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Request failed');
    }

    return { data: result.data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

export const api = {
  auth: {
    login: async (email: string, password?: string) => {
      const { data, error } = await request<{ user: MsProfile, token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data?.token) {
        localStorage.setItem('mansole_token', data.token);
      }
      return { data: data?.user || null, error };
    },
    register: async (payload: { email: string, fullName: string, password?: string }) => {
      return request<MsProfile>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    logout: async () => {
      localStorage.removeItem('mansole_token');
      return { error: null };
    },
    me: async () => {
      return request<MsProfile>('/auth/me');
    }
  },

  profiles: {
    getAll: () => request<MsProfile[]>('/auth/profiles'),
    update: (id: string, data: Partial<MsProfile>) => request<MsProfile>(`/auth/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  plantas: {
    getAll: async () => request<MsPlanta[]>('/plants'),
    create: async (data: Partial<MsPlanta>) => request<MsPlanta>('/plants', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  areas: {
    getAll: async (plantaId?: string) => request<MsArea[]>(`/plants/areas${plantaId ? `?plantaId=${plantaId}` : ''}`),
    create: async (data: Partial<MsArea>) => request<MsArea>('/plants/areas', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: async (id: string) => request<void>(`/plants/areas/${id}`, {
      method: 'DELETE'
    })
  },

  categorias: {
    getAll: async () => request<MsCategoriaActivo[]>('/assets/categories')
  },

  assets: {
    getAll: async () => request<MsActivo[]>('/assets'),
    getById: async (id: string) => request<MsActivo>(`/assets/${id}`),
    create: async (data: Partial<MsActivo>) => request<MsActivo>('/assets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id: string, data: Partial<MsActivo>) => request<MsActivo>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: async (id: string) => request<void>(`/assets/${id}`, {
      method: 'DELETE'
    }),
    getParts: async (id: string) => request<MsParteActivo[]>(`/assets/${id}/parts`),
    createPart: async (id: string, data: Partial<MsParteActivo>) => request<MsParteActivo>(`/assets/${id}/parts`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getPartComponents: async (partId: string) => request<MsComponenteParte[]>(`/assets/parts/${partId}/components`),
    createPartComponent: async (partId: string, data: Partial<MsComponenteParte>) => request<MsComponenteParte>(`/assets/parts/${partId}/components`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  workOrders: {
    getAll: () => request<MsOrdenTrabajo[]>('/work-orders'),
    create: (data: { 
      activo_id: string; 
      tecnico_asignado_id: string; 
      titulo: string; 
      descripcion: string; 
      tipo: string; 
      prioridad: string; 
    }) => request<MsOrdenTrabajo>('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MsOrdenTrabajo>) => request<MsOrdenTrabajo>(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getActivities: (id: string) => request<MsActividadOT[]>(`/work-orders/${id}/activities`),
    createActivity: (id: string, data: Partial<MsActividadOT>) => request<MsActividadOT>(`/work-orders/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getActivityComponents: (activityId: string) => request<MsComponenteActividad[]>(`/work-orders/activities/${activityId}/components`),
    addActivityComponent: (activityId: string, data: { componente_id: string, cantidad: number, accion: string, observaciones?: string }) => request<MsComponenteActividad>(`/work-orders/activities/${activityId}/components`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getParts: (id: string) => request<any[]>(`/work-orders/${id}/parts`),
    addPart: (id: string, data: { repuesto_id: string, cantidad: number, usuario_id?: string }) => request<any>(`/work-orders/${id}/parts`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  },

  workRequests: {
    getAll: async () => request<MsSolicitudTrabajo[]>('/work-requests'),
    create: async (data: Partial<MsSolicitudTrabajo>) => request<MsSolicitudTrabajo>('/work-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id: string, data: Partial<MsSolicitudTrabajo>) => request<MsSolicitudTrabajo>(`/work-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  analytics: {
    getDashboardSummary: () => request<{
      kpis: { MTTR: number, MTBF: number, TotalFailures: number, Availability: number },
      trends: { month: string, count: number, preventive: number, corrective: number }[],
      assetStats: { total: number, operativos: number, en_mantenimiento: number, fuera_de_servicio: number },
      otStats: { abiertas: number, en_proceso: number, completadas: number, criticas: number },
      recentOTs: any[],
      recentAssets: any[]
    }>('/analytics/dashboard-summary'),
    getKpis: () => request<{ MTTR: number, MTBF: number, TotalFailures: number, Availability: number }>('/analytics/kpis'),
    getTrends: () => request<{ month: string, count: number, preventive: number, corrective: number }[]>('/analytics/trends'),
    getAssetHealth: () => request<{ estado: string, count: number }[]>('/analytics/asset-health'),
    getAssetMetrics: (id: string) => request<{ total_ots: number, completed_ots: number, avg_repair_time: number }>(`/analytics/assets/${id}`)
  },
  
  preventive: {
    getAll: () => request<MsPlanPreventivo[]>('/preventive'),
    create: (data: Partial<MsPlanPreventivo>) => request<MsPlanPreventivo>('/preventive', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MsPlanPreventivo>) => request<void>(`/preventive/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/preventive/${id}`, { method: 'DELETE' })
  },

  inventory: {
    getParts: () => request<MsRepuesto[]>('/inventory/parts'),
    createPart: (data: Partial<MsRepuesto>) => request<MsRepuesto>('/inventory/parts', { method: 'POST', body: JSON.stringify(data) }),
    recordMovement: (data: { 
      repuesto_id: string, 
      tipo: 'entrada' | 'salida' | 'ajuste', 
      cantidad: number, 
      referencia_tipo?: string, 
      referencia_id?: string, 
      notas?: string,
      usuario_id?: string 
    }) => request<{ success: true }>('/inventory/movements', { method: 'POST', body: JSON.stringify(data) }),
    getMovements: (partId: string) => request<MsInventarioMovimiento[]>(`/inventory/parts/${partId}/movements`),
  }
}
