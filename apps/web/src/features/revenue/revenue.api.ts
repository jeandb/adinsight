import { apiClient } from '@/lib/api/client'

export interface RevenueKpis {
  revenueCents: number
  orders: number
  aovCents: number
  activeSubscriptions: number
  prevRevenueCents: number
  prevOrders: number
  revenueGrowth: number | null
  ordersGrowth: number | null
}

export interface RevenueTimeseriesRow {
  date: string
  store_type: string
  store_name: string
  revenue_cents: string
}

export interface RevenueByStore {
  storeType: string
  storeName: string
  revenueCents: number
}

export interface RoasRealRow {
  channelId: string
  channelName: string
  channelColor: string
  revenueCents: number
  spendCents: number
  roasReal: number | null
}

export interface OrdersMetrics {
  netRevenue:      { valueCents: number; growth: number | null }
  completionRate:  { value: number;      growth: number | null }
  uniqueCustomers: { value: number;      growth: number | null }
}

export interface OrdersSummary {
  completed:  { count: number; totalCents: number }
  processing: { count: number }
  cancelled:  { count: number; totalCents: number; pct: number }
  refunded:   { count: number; totalCents: number }
  totalOrders: number
}

export const revenueApi = {
  getKpis: (after: string, before: string) =>
    apiClient.get<{ data: RevenueKpis }>('/revenue/kpis', { params: { after, before } }).then((r) => r.data.data),

  getTimeseries: (after: string, before: string, channelId?: string) =>
    apiClient.get<{ data: RevenueTimeseriesRow[] }>('/revenue/timeseries', {
      params: { after, before, ...(channelId ? { channel_id: channelId } : {}) },
    }).then((r) => r.data.data),

  getByStore: (after: string, before: string, channelId?: string) =>
    apiClient.get<{ data: RevenueByStore[] }>('/revenue/by-store', {
      params: { after, before, ...(channelId ? { channel_id: channelId } : {}) },
    }).then((r) => r.data.data),

  getRoasReal: (after: string, before: string) =>
    apiClient.get<{ data: RoasRealRow[] }>('/revenue/roas-real', { params: { after, before } }).then((r) => r.data.data),

  getOrdersSummary: (after: string, before: string) =>
    apiClient.get<{ data: OrdersSummary }>('/revenue/orders-summary', { params: { after, before } }).then((r) => r.data.data),

  getOrdersMetrics: (after: string, before: string) =>
    apiClient.get<{ data: OrdersMetrics }>('/revenue/orders-metrics', { params: { after, before } }).then((r) => r.data.data),
}
