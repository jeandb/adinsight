import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type KpiValues } from './dashboard.api'
import type { DashboardFilters } from '@/hooks/use-filters'

interface KpiCardsProps {
  filters: DashboardFilters
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const formatNumber = (n: number) =>
  new Intl.NumberFormat('pt-BR').format(Math.round(n))

const formatPercent = (n: number) => `${n.toFixed(1)}%`

const formatROAS = (n: number) => `${n.toFixed(2)}x`

interface KpiCardDef {
  key: keyof KpiValues
  label: string
  format: (v: number) => string
  lowerIsBetter: boolean
}

const KPI_DEFS: KpiCardDef[] = [
  { key: 'spendCents', label: 'Investimento', format: formatCurrency, lowerIsBetter: false },
  { key: 'impressions', label: 'Impressões', format: formatNumber, lowerIsBetter: false },
  { key: 'clicks', label: 'Cliques', format: formatNumber, lowerIsBetter: false },
  { key: 'ctr', label: 'CTR', format: formatPercent, lowerIsBetter: false },
  { key: 'cpc', label: 'CPC', format: formatCurrency, lowerIsBetter: true },
  { key: 'cpl', label: 'CPL', format: formatCurrency, lowerIsBetter: true },
  { key: 'leads', label: 'Leads', format: formatNumber, lowerIsBetter: false },
  { key: 'roas', label: 'ROAS', format: formatROAS, lowerIsBetter: false },
]

interface KpiCardProps {
  label: string
  value: string
  delta: number
  lowerIsBetter: boolean
}

function KpiCard({ label, value, delta, lowerIsBetter }: KpiCardProps) {
  const isPositive = lowerIsBetter ? delta < 0 : delta > 0
  const isNeutral = delta === 0
  const deltaColor = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'
  const deltaPrefix = delta > 0 ? '+' : ''

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className={`text-xs font-medium ${deltaColor}`}>
        {isNeutral ? '—' : `${deltaPrefix}${delta.toFixed(1)}% vs período anterior`}
      </p>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2 animate-pulse">
      <div className="h-3 w-20 bg-muted rounded" />
      <div className="h-7 w-28 bg-muted rounded" />
      <div className="h-3 w-24 bg-muted rounded" />
    </div>
  )
}

export function KpiCardsSection({ filters }: KpiCardsProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'kpis', filters],
    queryFn: () => dashboardApi.getKpis(filters),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
        Não foi possível carregar os KPIs. Tente novamente.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {KPI_DEFS.map((def) => (
        <KpiCard
          key={def.key}
          label={def.label}
          value={def.format(data.current[def.key])}
          delta={data.deltas[def.key]}
          lowerIsBetter={def.lowerIsBetter}
        />
      ))}
    </div>
  )
}
