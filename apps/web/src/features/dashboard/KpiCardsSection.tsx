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

// ─── Platform-specific nomenclature ────────────────────────────────────────
// label: what the platform calls this metric
// description: universal description shown below the label
type PlatformKey = 'META' | 'GOOGLE' | 'TIKTOK' | 'PINTEREST'

interface KpiMeta { label: string; description: string }

type KpiNomenclature = Record<keyof KpiValues, KpiMeta>

const DEFAULT_LABELS: KpiNomenclature = {
  spendCents:   { label: 'Investimento',        description: 'total gasto no período' },
  impressions:  { label: 'Impressões',           description: 'vezes que o anúncio foi exibido' },
  clicks:       { label: 'Cliques',              description: 'cliques no anúncio' },
  ctr:          { label: 'CTR',                  description: 'taxa de cliques (cliques ÷ impressões)' },
  cpc:          { label: 'CPC',                  description: 'custo por clique' },
  cpl:          { label: 'CPL',                  description: 'custo por lead' },
  leads:        { label: 'Leads',                description: 'cadastros gerados' },
  roas:         { label: 'ROAS',                 description: 'retorno sobre investimento em anúncios' },
  purchases:    { label: 'Conversões',           description: 'número de conversões registradas' },
  revenueCents: { label: 'Valor de Conversões',  description: 'receita atribuída às campanhas' },
  cpa:          { label: 'CPA',                  description: 'custo por conversão / aquisição' },
}

const PLATFORM_OVERRIDES: Partial<Record<PlatformKey, Partial<KpiNomenclature>>> = {
  META: {
    purchases:    { label: 'Resultados',           description: 'conversões registradas pelo Meta Pixel' },
    revenueCents: { label: 'Valor dos Resultados', description: 'receita atribuída ao Meta Ads' },
    cpa:          { label: 'Custo por Resultado',  description: 'custo médio por conversão' },
  },
  GOOGLE: {
    purchases:    { label: 'Conversões',           description: 'conversões rastreadas pelo Google Ads' },
    revenueCents: { label: 'Valor de Conversões',  description: 'receita atribuída ao Google Ads' },
    cpa:          { label: 'CPA',                  description: 'custo por aquisição' },
    leads:        { label: 'Conv. de Lead',         description: 'conversões do tipo lead' },
  },
  TIKTOK: {
    purchases:    { label: 'Conversões',           description: 'conversões no TikTok Ads' },
    cpa:          { label: 'CPA',                  description: 'custo por conversão' },
  },
  PINTEREST: {
    purchases:    { label: 'Conversões',           description: 'conversões no Pinterest Ads' },
    cpa:          { label: 'CPA',                  description: 'custo por conversão' },
  },
}

function getKpiMeta(key: keyof KpiValues, platform?: string): KpiMeta {
  const override = platform
    ? PLATFORM_OVERRIDES[platform as PlatformKey]?.[key]
    : undefined
  return override ?? DEFAULT_LABELS[key]
}

// ─── Card definitions ───────────────────────────────────────────────────────
interface KpiCardDef {
  key: keyof KpiValues
  format: (v: number) => string
  lowerIsBetter: boolean
}

const KPI_DEFS: KpiCardDef[] = [
  { key: 'spendCents',   format: formatCurrency, lowerIsBetter: false },
  { key: 'impressions',  format: formatNumber,   lowerIsBetter: false },
  { key: 'clicks',       format: formatNumber,   lowerIsBetter: false },
  { key: 'ctr',          format: formatPercent,  lowerIsBetter: false },
  { key: 'cpc',          format: formatCurrency, lowerIsBetter: true  },
  { key: 'leads',        format: formatNumber,   lowerIsBetter: false },
  { key: 'cpl',          format: formatCurrency, lowerIsBetter: true  },
  { key: 'purchases',    format: formatNumber,   lowerIsBetter: false },
  { key: 'revenueCents', format: formatCurrency, lowerIsBetter: false },
  { key: 'cpa',          format: formatCurrency, lowerIsBetter: true  },
  { key: 'roas',         format: formatROAS,     lowerIsBetter: false },
]

// ─── Components ─────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string
  description: string
  value: string
  delta: number
  lowerIsBetter: boolean
}

function KpiCard({ label, description, value, delta, lowerIsBetter }: KpiCardProps) {
  const isPositive = lowerIsBetter ? delta < 0 : delta > 0
  const isNeutral = delta === 0
  const deltaColor = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'
  const deltaPrefix = delta > 0 ? '+' : ''

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-none">
        {label}
      </p>
      <p className="text-[10px] text-muted-foreground/70 leading-none">{description}</p>
      <p className="text-2xl font-bold text-foreground leading-none pt-0.5">{value}</p>
      <p className={`text-xs font-medium ${deltaColor}`}>
        {isNeutral ? '—' : `${deltaPrefix}${delta.toFixed(1)}% vs período anterior`}
      </p>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-1.5 animate-pulse">
      <div className="h-3 w-20 bg-muted rounded" />
      <div className="h-2.5 w-28 bg-muted rounded" />
      <div className="h-7 w-24 bg-muted rounded" />
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
        {Array.from({ length: 11 }).map((_, i) => (
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
      {KPI_DEFS.map((def) => {
        const { label, description } = getKpiMeta(def.key, filters.platform)
        return (
          <KpiCard
            key={def.key}
            label={label}
            description={description}
            value={def.format(data.current[def.key])}
            delta={data.deltas[def.key]}
            lowerIsBetter={def.lowerIsBetter}
          />
        )
      })}
    </div>
  )
}
