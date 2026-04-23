import axios from 'axios'
import type {
  ChatRequest,
  ChatResponse,
  PlanRequest,
  PlanResponse,
  NearbyRequest,
  NearbyResponse,
  ExportRequest,
} from '../types'

const BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

if (!BASE_URL) {
  throw new Error('VITE_API_URL is not set. Add it to frontend/.env')
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export const api = {
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const { data } = await client.post<ChatResponse>('/chat', request)
    return data
  },

  plan: async (request: PlanRequest): Promise<PlanResponse> => {
    const { data } = await client.post<PlanResponse>('/plan', request)
    return data
  },

  nearby: async (request: NearbyRequest): Promise<NearbyResponse> => {
    const { data } = await client.post<NearbyResponse>('/nearby', request)
    return data
  },

  exportPlan: async (request: ExportRequest): Promise<Blob> => {
    const { data } = await client.post('/export', request, {
      responseType: 'blob',
    })
    return data
  },

  health: async (): Promise<{ status: string; version: string }> => {
    const { data } = await client.get('/health')
    return data
  },
}
