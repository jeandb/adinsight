import { apiClient } from '@/lib/api/client'

export type WooStoreStatus = 'NOT_CONFIGURED' | 'ACTIVE' | 'ERROR'
export type WooSourceType  = 'woocommerce' | 'manual'

export interface WooStore {
  id: string
  name: string
  url: string | null
  type: string
  sourceType: WooSourceType
  isDeletable: boolean
  channelId: string | null
  status: WooStoreStatus
  lastError: string | null
  lastSyncAt: string | null
  hasCredentials: boolean
  consumerKeyMasked: string | null
  createdAt: string
  updatedAt: string
}

export interface WooOrder {
  id: string
  store_id: string
  store_name: string
  store_type: string
  external_id: string
  status: string
  customer_email: string | null
  total_cents: number
  paid_at: string | null
  order_date: string
}

export interface CreateStoreInput {
  name: string
  url?: string | null
  sourceType: WooSourceType
  channelId?: string | null
}

export const wooStoresApi = {
  list: () =>
    apiClient.get<{ data: WooStore[] }>('/woo-stores').then((r) => r.data.data),

  createStore: (input: CreateStoreInput) =>
    apiClient.post<{ data: WooStore }>('/woo-stores', input).then((r) => r.data.data),

  deleteStore: (id: string) =>
    apiClient.delete(`/woo-stores/${id}`),

  saveCredentials: (id: string, payload: { consumerKey: string; consumerSecret: string; channelId?: string | null }) =>
    apiClient.patch<{ data: WooStore }>(`/woo-stores/${id}/credentials`, payload).then((r) => r.data.data),

  testConnection: (id: string) =>
    apiClient.post<{ data: { ok: boolean; error?: string } }>(`/woo-stores/${id}/test-connection`).then((r) => r.data.data),

  sync: (id: string, daysBack = 30) =>
    apiClient.post<{ data: { ordersSynced: number; subscriptionsSynced: number } }>(`/woo-stores/${id}/sync`, { daysBack }).then((r) => r.data.data),

  clearCredentials: (id: string) =>
    apiClient.delete<{ data: WooStore }>(`/woo-stores/${id}/credentials`).then((r) => r.data.data),

  importFile: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<{ data: { imported: number } }>(`/woo-stores/${id}/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data)
  },

  downloadTemplate: () =>
    apiClient.get('/woo-stores/template', { responseType: 'blob' }).then((r) => r.data as Blob),

  listOrders: (params: { store?: string; after?: string; before?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: WooOrder[]; meta: { page: number; limit: number; total: number } }>('/woo-stores/orders', { params }).then((r) => r.data),
}
