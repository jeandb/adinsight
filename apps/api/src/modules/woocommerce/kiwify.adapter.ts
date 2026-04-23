import type { WooOrderData, WooOrderStatus } from './woo-stores.types'

export interface KiwifyCredentials {
  clientId: string
  clientSecret: string
  accountId: string
}

const KIWIFY_BASE = 'https://api.kiwify.com.br'

const STATUS_MAP: Record<string, WooOrderStatus> = {
  paid:            'completed',
  waiting_payment: 'pending',
  refunded:        'refunded',
  chargedback:     'refunded',
  refused:         'failed',
  cancelled:       'cancelled',
}

interface KiwifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface KiwifyRawOrder {
  id: string
  status: string
  customer: { email?: string }
  product_amount: number  // BRL, e.g. 97.00
  created_at: string
  approved_date: string | null
}

interface KiwifyOrdersResponse {
  data: KiwifyRawOrder[]
  pagination?: { has_more?: boolean; current_page?: number }
}

async function getAccessToken(creds: KiwifyCredentials): Promise<string> {
  const body = new URLSearchParams({
    client_id:     creds.clientId,
    client_secret: creds.clientSecret,
    grant_type:    'client_credentials',
  })

  const res = await fetch(`${KIWIFY_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Kiwify autenticação falhou ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as KiwifyTokenResponse
  return data.access_token
}

async function fetchAllOrders(
  creds: KiwifyCredentials,
  token: string,
): Promise<KiwifyRawOrder[]> {
  const all: KiwifyRawOrder[] = []
  let page = 1

  while (true) {
    const params = new URLSearchParams({
      account_id: creds.accountId,
      page:       String(page),
      limit:      '100',
    })

    const res = await fetch(`${KIWIFY_BASE}/v1/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`Kiwify orders ${res.status}: ${text.slice(0, 200)}`)
    }

    const body = (await res.json()) as KiwifyOrdersResponse
    all.push(...body.data)

    if (!body.pagination?.has_more || body.data.length < 100) break
    page++
  }

  return all
}

export async function testKiwifyConnection(
  creds: KiwifyCredentials,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = await getAccessToken(creds)
    const params = new URLSearchParams({ account_id: creds.accountId, page: '1', limit: '1' })
    const res = await fetch(`${KIWIFY_BASE}/v1/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function syncKiwifyOrders(
  creds: KiwifyCredentials,
): Promise<WooOrderData[]> {
  const token = await getAccessToken(creds)
  const raw   = await fetchAllOrders(creds, token)

  return raw.map((o) => ({
    externalId:    o.id,
    status:        (STATUS_MAP[o.status] ?? 'pending') as WooOrderStatus,
    customerEmail: o.customer?.email ?? null,
    totalCents:    Math.round(o.product_amount * 100),
    paidAt:        o.approved_date ?? null,
    orderDate:     o.created_at,
  }))
}
