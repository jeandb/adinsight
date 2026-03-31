import type { WooCredentials, WooOrderData, WooSubscriptionData, WooOrderStatus, WooSubscriptionStatus } from './woo-stores.types'

interface WooRawOrder {
  id: number
  status: string
  billing: { email: string }
  total: string
  date_paid: string | null
  date_created: string
}

interface WooRawSubscription {
  id: number
  status: string
  billing: { email: string }
  total: string
  billing_period: string
  billing_interval: string
  start_date_gmt: string
  end_date_gmt: string
  next_payment_date_gmt: string
  line_items: Array<{ name: string }>
}

function authParams(creds: WooCredentials): URLSearchParams {
  const p = new URLSearchParams()
  p.set('consumer_key', creds.consumerKey)
  p.set('consumer_secret', creds.consumerSecret)
  return p
}

async function wooFetch<T>(url: string, params: URLSearchParams): Promise<T> {
  const fullUrl = `${url}?${params.toString()}`
  const res = await fetch(fullUrl, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'AdInsight/1.0' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`WooCommerce API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

/** Fetches all pages from a paginated WooCommerce endpoint */
async function fetchAllPages<T>(
  baseUrl: string,
  creds: WooCredentials,
  endpoint: string,
  extraParams: Record<string, string> = {},
): Promise<T[]> {
  const results: T[] = []
  let page = 1

  while (true) {
    const params = authParams(creds)
    params.set('per_page', '100')
    params.set('page', String(page))
    for (const [k, v] of Object.entries(extraParams)) params.set(k, v)

    const items = await wooFetch<T[]>(`${baseUrl}${endpoint}`, params)
    results.push(...items)

    if (items.length < 100) break
    page++
  }

  return results
}

function toCents(value: string): number {
  return Math.round(parseFloat(value) * 100)
}

export async function testWooConnection(creds: WooCredentials): Promise<{ ok: boolean; error?: string }> {
  try {
    const params = authParams(creds)
    params.set('per_page', '1')
    await wooFetch<unknown>(`${creds.url}/wp-json/wc/v3/orders`, params)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function syncOrders(
  creds: WooCredentials,
  after: string,
  before: string,
): Promise<WooOrderData[]> {
  const raw = await fetchAllPages<WooRawOrder>(
    creds.url,
    creds,
    '/wp-json/wc/v3/orders',
    { after, before, status: 'any' },
  )

  return raw.map((o) => ({
    externalId:    String(o.id),
    status:        o.status as WooOrderStatus,
    customerEmail: o.billing?.email ?? null,
    totalCents:    toCents(o.total),
    paidAt:        o.date_paid ?? null,
    orderDate:     o.date_created,
  }))
}

/** Fetch YITH subscriptions — only available on Clube das Profs */
export async function syncSubscriptions(
  creds: WooCredentials,
): Promise<WooSubscriptionData[]> {
  const raw = await fetchAllPages<WooRawSubscription>(
    creds.url,
    creds,
    '/wp-json/wc/v3/subscriptions',
  )

  return raw.map((s) => ({
    externalId:       String(s.id),
    customerEmail:    s.billing?.email ?? null,
    status:           s.status as WooSubscriptionStatus,
    planName:         s.line_items?.[0]?.name ?? null,
    totalCents:       toCents(s.total),
    billingPeriod:    s.billing_period ?? null,
    startDate:        s.start_date_gmt ? s.start_date_gmt.split('T')[0] : null,
    endDate:          s.end_date_gmt   ? s.end_date_gmt.split('T')[0]   : null,
    nextPaymentDate:  s.next_payment_date_gmt ? s.next_payment_date_gmt.split('T')[0] : null,
  }))
}
