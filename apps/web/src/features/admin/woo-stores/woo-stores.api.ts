import { apiClient } from '@/lib/api/client'

export type WooStoreType   = 'LOJA_DAS_PROFS' | 'CLUBE_DAS_PROFS' | 'TUDO_DE_PROF'
export type WooStoreStatus = 'NOT_CONFIGURED' | 'ACTIVE' | 'ERROR'

export interface WooStore {
  id: string
  name: string
  url: string
  type: WooStoreType
  channelId: string | null
  status: WooStoreStatus
  lastError: string | null
  lastSyncAt: string | null
  hasCredentials: boolean
  consumerKeyMasked: string | null
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

export const wooStoresApi = {
  list: () =>
    apiClient.get<{ data: WooStore[] }>('/woo-stores').then((r) => r.data.data),

  saveCredentials: (type: WooStoreType, payload: { consumerKey: string; consumerSecret: string; channelId?: string | null }) =>
    apiClient.patch<{ data: WooStore }>(`/woo-stores/${type}/credentials`, payload).then((r) => r.data.data),

  testConnection: (type: WooStoreType) =>
    apiClient.post<{ data: { ok: boolean; error?: string } }>(`/woo-stores/${type}/test-connection`).then((r) => r.data.data),

  sync: (type: WooStoreType, daysBack = 30) =>
    apiClient.post<{ data: { ordersSynced: number; subscriptionsSynced: number } }>(`/woo-stores/${type}/sync`, { daysBack }).then((r) => r.data.data),

  clearCredentials: (type: WooStoreType) =>
    apiClient.delete<{ data: WooStore }>(`/woo-stores/${type}/credentials`).then((r) => r.data.data),

  listOrders: (params: { store?: string; after?: string; before?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: WooOrder[]; meta: { page: number; limit: number; total: number } }>('/woo-stores/orders', { params }).then((r) => r.data),
}
