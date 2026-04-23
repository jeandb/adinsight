import type { WooOrderData, WooOrderStatus } from './woo-stores.types'

export interface KiwifyCredentials {
  clientId: string
  clientSecret: string
  accountId: string
}

const KIWIFY_API_V1 = 'https://public-api.kiwify.com/v1'

const STATUS_MAP: Record<string, WooOrderStatus> = {
  paid:             'completed',
  approved:         'completed',
  waiting_payment:  'pending',
  pending:          'pending',
  processing:       'pending',
  refunded:         'refunded',
  pending_refund:   'refunded',
  refund_requested: 'refunded',
  chargedback:      'refunded',
  refused:          'failed',
  cancelled:        'cancelled',
}

interface KiwifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface KiwifyRawSale {
  id: string
  status: string
  customer: { email?: string }
  product: { price?: number }
  created_at: string
  approved_date?: string | null
}

interface KiwifySalesResponse {
  data: KiwifyRawSale[]
  pagination?: { count?: number; page_number?: number; page_size?: number }
}

async function getAccessToken(creds: KiwifyCredentials): Promise<string> {
  const res = await fetch(`${KIWIFY_API_V1}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret }).toString(),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Kiwify autenticação falhou ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as KiwifyTokenResponse
  return data.access_token
}

function dateRange(daysBack: number): { start_date: string; end_date: string } {
  const end   = new Date()
  const start = new Date(Date.now() - daysBack * 86_400_000)
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date:   end.toISOString().slice(0, 10),
  }
}

async function fetchAllSales(
  creds: KiwifyCredentials,
  token: string,
  daysBack = 365,
): Promise<KiwifyRawSale[]> {
  const all: KiwifyRawSale[] = []
  let page = 1
  const { start_date, end_date } = dateRange(Math.min(daysBack, 90))

  while (true) {
    const params = new URLSearchParams({
      start_date,
      end_date,
      page_size:   '100',
      page_number: String(page),
    })

    const res = await fetch(`${KIWIFY_API_V1}/sales?${params}`, {
      headers: {
        Authorization:        `Bearer ${token}`,
        'x-kiwify-account-id': creds.accountId,
        Accept:               'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`Kiwify sales ${res.status}: ${text.slice(0, 200)}`)
    }

    const body = (await res.json()) as KiwifySalesResponse
    all.push(...body.data)

    const total    = body.pagination?.count ?? 0
    const pageSize = body.pagination?.page_size ?? 100
    if (all.length >= total || body.data.length < pageSize) break
    page++
  }

  return all
}

export async function testKiwifyConnection(
  creds: KiwifyCredentials,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = await getAccessToken(creds)
    const { start_date, end_date } = dateRange(7)
    const params = new URLSearchParams({ start_date, end_date, page_size: '1', page_number: '1' })
    const res = await fetch(`${KIWIFY_API_V1}/sales?${params}`, {
      headers: {
        Authorization:        `Bearer ${token}`,
        'x-kiwify-account-id': creds.accountId,
        Accept:               'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function syncKiwifyOrders(
  creds: KiwifyCredentials,
  daysBack = 365,
): Promise<WooOrderData[]> {
  const token = await getAccessToken(creds)
  const raw   = await fetchAllSales(creds, token, daysBack)

  return raw.map((o) => ({
    externalId:    o.id,
    status:        (STATUS_MAP[o.status] ?? 'pending') as WooOrderStatus,
    customerEmail: o.customer?.email ?? null,
    totalCents:    Math.round((o.product?.price ?? 0) * 100),
    paidAt:        o.approved_date ?? null,
    orderDate:     o.created_at,
  }))
}
