export type WooStoreStatus   = 'NOT_CONFIGURED' | 'ACTIVE' | 'ERROR'
export type WooSourceType    = 'woocommerce' | 'manual'
export type WooOrderStatus   = 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed'
export type WooSubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'on-hold' | 'pending' | 'pending-cancel'

export interface WooStoreRow {
  id: string
  name: string
  url: string | null
  type: string           // free-form text now (previously ENUM)
  source_type: WooSourceType
  is_deletable: boolean
  channel_id: string | null
  consumer_key_encrypted: string | null
  consumer_secret_encrypted: string | null
  status: WooStoreStatus
  last_error: string | null
  last_sync_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface WooOrderRow {
  id: string
  store_id: string
  external_id: string
  status: WooOrderStatus
  customer_email: string | null
  total_cents: number
  paid_at: Date | null
  order_date: Date
  created_at: Date
  updated_at: Date
}

export interface WooSubscriptionRow {
  id: string
  store_id: string
  external_id: string
  customer_email: string | null
  status: WooSubscriptionStatus
  plan_name: string | null
  total_cents: number
  billing_period: string | null
  start_date: string | null
  end_date: string | null
  next_payment_date: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateStoreInput {
  name: string
  url?: string | null
  sourceType: WooSourceType
  channelId?: string | null
}

export interface SaveCredentialsInput {
  consumerKey: string
  consumerSecret: string
  channelId?: string | null
}

// ─── Adapter types ────────────────────────────────────────────────────────────

export interface WooCredentials {
  url: string
  consumerKey: string
  consumerSecret: string
}

export interface WooOrderData {
  externalId: string
  status: WooOrderStatus
  customerEmail: string | null
  totalCents: number
  paidAt: string | null
  orderDate: string
}

export interface WooSubscriptionData {
  externalId: string
  customerEmail: string | null
  status: WooSubscriptionStatus
  planName: string | null
  totalCents: number
  billingPeriod: string | null
  startDate: string | null
  endDate: string | null
  nextPaymentDate: string | null
}
