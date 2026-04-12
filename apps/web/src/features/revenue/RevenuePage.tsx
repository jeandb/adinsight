import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'
import type { PeriodKey } from '@/hooks/use-filters'
import { revenueApi, type RevenueTimeseriesRow } from './revenue.api'
import { wooStoresApi } from '@/features/admin/woo-stores/woo-stores.api'
import { ExportButton } from '@/features/admin/reports/ExportButton'

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = {
  currency:  (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100),
  number:    (n: number) => new Intl.NumberFormat('pt-BR').format(Math.round(n)),
  percent:   (n: number | null) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`),
  roas:      (n: number | null) => (n == null ? '—' : `${n.toFixed(2)}x`),
  date:      (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  dateLabel: (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
}

// ─── Period helpers ───────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<PeriodKey, string> = {
  last_7d:    'Últimos 7 dias',
  last_14d:   'Últimos 14 dias',
  last_30d:   'Últimos 30 dias',
  this_month: 'Este mês',
  last_month: 'Mês anterior',
  custom:     'Período personalizado',
}

const SELECT_CLASS =
  'px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer'
const DATE_INPUT_CLASS =
  'px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer'

function resolveRevenuePeriod(
  period: PeriodKey,
  dateFrom?: string,
  dateTo?: string,
): { after: string; before: string } {
  const now = new Date()
  const today = now.toISOString()

  if (period === 'custom' && dateFrom && dateTo) {
    return {
      after:  new Date(dateFrom).toISOString(),
      before: new Date(dateTo + 'T23:59:59').toISOString(),
    }
  }
  if (period === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { after: from.toISOString(), before: today }
  }
  if (period === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    return { after: from.toISOString(), before: to.toISOString() }
  }
  const days = period === 'last_7d' ? 7 : period === 'last_14d' ? 14 : 30
  return {
    after:  new Date(Date.now() - days * 86_400_000).toISOString(),
    before: today,
  }
}

// ─── Store colors (matches WooStoresPage) ─────────────────────────────────────

const STORE_COLORS: Record<string, string> = {
  LOJA_DAS_PROFS:  '#6366f1',
  CLUBE_DAS_PROFS: '#f59e0b',
  TUDO_DE_PROF:    '#10b981',
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  growth,
  lowerIsBetter = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  growth: number | null
  lowerIsBetter?: boolean
}) {
  const isPositive = growth == null ? null : (lowerIsBetter ? growth < 0 : growth > 0)
  const growthColor = growth == null
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-emerald-600'
      : growth === 0
        ? 'text-muted-foreground'
        : 'text-red-600'

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className={`text-xs font-medium ${growthColor}`}>
        {growth == null ? '—' : `${fmt.percent(growth)} vs período anterior`}
      </p>
    </div>
  )
}

// ─── Multi-series line chart (revenue per store over time) ────────────────────

function RevenueLineChart({ rows }: { rows: RevenueTimeseriesRow[] }) {
  const [hovered, setHovered] = useState<{ x: number; y: number; label: string; values: { storeType: string; storeName: string; cents: number }[] } | null>(null)

  if (!rows.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
        Sem dados de receita para o período
      </div>
    )
  }

  // Group by date, then by store
  const dateMap = new Map<string, Map<string, number>>()
  const storeTypes = new Set<string>()

  for (const r of rows) {
    storeTypes.add(r.store_type)
    if (!dateMap.has(r.date)) dateMap.set(r.date, new Map())
    dateMap.get(r.date)!.set(r.store_type, parseInt(r.revenue_cents, 10))
  }

  const storeNames: Record<string, string> = {}
  for (const r of rows) storeNames[r.store_type] = r.store_name

  const dates = [...dateMap.keys()].sort()
  const storeArr = [...storeTypes]

  // Per-store series values
  const series = storeArr.map((st) => ({
    storeType: st,
    storeName: storeNames[st],
    values: dates.map((d) => dateMap.get(d)?.get(st) ?? 0),
  }))

  const allValues = series.flatMap((s) => s.values)
  const maxVal = Math.max(...allValues, 1)

  const W = 100, H = 100, px = 2, py = 6

  const getPath = (values: number[]) =>
    values
      .map((v, i) => {
        const x = px + (i / Math.max(dates.length - 1, 1)) * (W - px * 2)
        const y = H - py - (v / maxVal) * (H - py * 2)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')

  const getX = (i: number) => px + (i / Math.max(dates.length - 1, 1)) * (W - px * 2)
  const getY = (v: number) => H - py - (v / maxVal) * (H - py * 2)

  return (
    <div className="relative h-56 select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
        onMouseLeave={() => setHovered(null)}
      >
        {series.map((s) => (
          <path
            key={s.storeType}
            d={getPath(s.values)}
            fill="none"
            stroke={STORE_COLORS[s.storeType] ?? '#6366f1'}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Invisible hit areas */}
        {dates.map((date, i) => (
          <rect
            key={date}
            x={getX(i) - 3}
            y={0}
            width={6}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHovered({
              x: (getX(i) / W) * 100,
              y: (getY(Math.max(...series.map((s) => s.values[i]))) / H) * 100,
              label: date,
              values: series.map((s) => ({ storeType: s.storeType, storeName: s.storeName, cents: s.values[i] })),
            })}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-10 bg-popover border border-border rounded-lg shadow-lg p-2.5 text-xs pointer-events-none min-w-[140px]"
          style={{
            left: `${Math.min(hovered.x, 70)}%`,
            top: `${Math.max(hovered.y - 10, 0)}%`,
            transform: 'translateY(-100%)',
          }}
        >
          <p className="font-semibold text-foreground mb-1.5">{fmt.date(hovered.label)}</p>
          {hovered.values.map((v) => (
            <div key={v.storeType} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STORE_COLORS[v.storeType] ?? '#6366f1' }} />
                <span className="text-muted-foreground">{v.storeName}</span>
              </span>
              <span className="font-medium text-foreground">{fmt.currency(v.cents)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {series.map((s) => (
          <span key={s.storeType} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: STORE_COLORS[s.storeType] ?? '#6366f1' }} />
            {s.storeName}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Revenue by store (horizontal bars) ──────────────────────────────────────

function RevenueByStoreChart({ data }: { data: { storeType: string; storeName: string; revenueCents: number }[] }) {
  if (!data.length) {
    return <div className="text-sm text-muted-foreground text-center py-8">Sem dados</div>
  }
  const max = Math.max(...data.map((d) => d.revenueCents), 1)

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.storeType}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">{item.storeName}</span>
            <span className="font-medium text-foreground">{fmt.currency(item.revenueCents)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.revenueCents / max) * 100}%`,
                backgroundColor: STORE_COLORS[item.storeType] ?? '#6366f1',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ROAS Real table ──────────────────────────────────────────────────────────

function RoasRealSection({ after, before }: { after: string; before: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['revenue', 'roas-real', after, before],
    queryFn: () => revenueApi.getRoasReal(after, before),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="h-20 bg-muted animate-pulse rounded-xl" />
  if (!data.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
        Nenhuma loja WooCommerce configurada com canal de negócio associado.
        Configure em <strong>Admin → Lojas & Faturamento</strong>.
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['Canal', 'Receita WooCommerce', 'Gasto em Anúncios', 'ROAS Real'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.channelId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.channelColor ?? '#6366f1' }}
                  />
                  <span className="text-sm font-medium text-foreground">{row.channelName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-foreground">{fmt.currency(row.revenueCents)}</td>
              <td className="px-4 py-3 text-sm text-foreground">{fmt.currency(row.spendCents)}</td>
              <td className="px-4 py-3">
                <span className={`text-sm font-semibold ${row.roasReal == null ? 'text-muted-foreground' : row.roasReal >= 2 ? 'text-emerald-600' : row.roasReal >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                  {fmt.roas(row.roasReal)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Orders table ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  completed:  'text-green-600 bg-green-50',
  processing: 'text-blue-600 bg-blue-50',
  cancelled:  'text-red-600 bg-red-50',
  refunded:   'text-orange-600 bg-orange-50',
}

function OrdersTable({ after, before }: { after: string; before: string }) {
  const [page, setPage] = useState(1)
  const LIMIT = 20

  const { data, isLoading } = useQuery({
    queryKey: ['revenue', 'orders', after, before, page],
    queryFn:  () => wooStoresApi.listOrders({ after, before, page, limit: LIMIT }),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const total = data?.meta.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Pedidos</p>
        <p className="text-xs text-muted-foreground">{fmt.number(total)} pedidos no período</p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : !data?.data.length ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Nenhum pedido no período</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['#', 'Data', 'Loja', 'Email', 'Status', 'Total'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{order.external_id}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmt.date(order.order_date)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{order.store_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{order.customer_email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[order.status] ?? 'text-muted-foreground bg-muted'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {fmt.currency(order.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Página <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function RevenuePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period   = (searchParams.get('period') as PeriodKey) ?? 'last_30d'
  const dateFrom = searchParams.get('date_from') ?? undefined
  const dateTo   = searchParams.get('date_to')   ?? undefined

  function setPeriodParam(key: PeriodKey) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('period', key)
        if (key !== 'custom') { next.delete('date_from'); next.delete('date_to') }
        return next
      },
      { replace: true },
    )
  }

  function setDateParam(key: 'date_from' | 'date_to', value: string | undefined) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!value) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const { after, before } = resolveRevenuePeriod(period, dateFrom, dateTo)

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['revenue', 'kpis', period, dateFrom, dateTo],
    queryFn: () => revenueApi.getKpis(after, before),
    staleTime: 5 * 60 * 1000,
  })

  const { data: timeseries = [], isLoading: tsLoading } = useQuery({
    queryKey: ['revenue', 'timeseries', period, dateFrom, dateTo],
    queryFn: () => revenueApi.getTimeseries(after, before),
    staleTime: 5 * 60 * 1000,
  })

  const { data: byStore = [] } = useQuery({
    queryKey: ['revenue', 'by-store', period, dateFrom, dateTo],
    queryFn: () => revenueApi.getByStore(after, before),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <DollarSign className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Faturamento</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ExportButton scope="revenue" from={after.slice(0, 10)} to={before.slice(0, 10)} />
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriodParam(e.target.value as PeriodKey)}
            className={SELECT_CLASS}
          >
            {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
              <option key={key} value={key}>{PERIOD_LABELS[key]}</option>
            ))}
          </select>

          {period === 'custom' && (
            <>
              <input
                type="date"
                value={dateFrom ?? ''}
                max={dateTo ?? new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDateParam('date_from', e.target.value || undefined)}
                className={DATE_INPUT_CLASS}
              />
              <span className="text-sm text-muted-foreground">até</span>
              <input
                type="date"
                value={dateTo ?? ''}
                min={dateFrom}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDateParam('date_to', e.target.value || undefined)}
                className={DATE_INPUT_CLASS}
              />
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {kpisLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard icon={DollarSign}  label="Receita"            value={fmt.currency(kpis.revenueCents)} growth={kpis.revenueGrowth} />
          <KpiCard icon={ShoppingCart} label="Pedidos"           value={fmt.number(kpis.orders)}         growth={kpis.ordersGrowth} />
          <KpiCard icon={TrendingUp}  label="Ticket Médio"       value={fmt.currency(kpis.aovCents)}     growth={null} />
          <KpiCard icon={Users}       label="Assinaturas Ativas" value={fmt.number(kpis.activeSubscriptions)} growth={null} />
        </div>
      ) : null}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeseries */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Receita por loja</p>
          {tsLoading ? (
            <div className="h-56 bg-muted animate-pulse rounded-lg" />
          ) : (
            <RevenueLineChart rows={timeseries} />
          )}
        </div>

        {/* By store */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Distribuição por loja</p>
          <RevenueByStoreChart data={byStore} />
        </div>
      </div>

      {/* ROAS Real */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">ROAS Real por canal</p>
        <RoasRealSection after={after} before={before} />
      </div>

      {/* Orders */}
      <OrdersTable after={after} before={before} />
    </div>
  )
}
