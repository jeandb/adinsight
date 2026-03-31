import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, CalendarRange } from 'lucide-react'
import { useFilters, type PeriodKey, type DashboardFilters } from '@/hooks/use-filters'
import { channelsApi } from '@/features/admin/channels/channels.api'
import { useWebSocketEvent } from '@/hooks/use-websocket'
import type { WsEvent } from '@/lib/websocket/websocket.events'
import { ExportButton } from '@/features/admin/reports/ExportButton'
import { KpiCardsSection } from './KpiCardsSection'
import { TimeseriesSection } from './TimeseriesSection'
import { DistributionSection } from './DistributionSection'
import { TopCampaignsSection } from './TopCampaignsSection'
import { CampaignsTableSection } from './CampaignsTableSection'

const PERIOD_LABELS: Record<PeriodKey, string> = {
  last_7d: 'Últimos 7 dias',
  last_14d: 'Últimos 14 dias',
  last_30d: 'Últimos 30 dias',
  this_month: 'Este mês',
  last_month: 'Mês anterior',
  custom: 'Período personalizado',
}

const PLATFORM_OPTIONS: { value: DashboardFilters['platform']; label: string }[] = [
  { value: undefined, label: 'Todas as plataformas' },
  { value: 'META', label: 'Meta' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'PINTEREST', label: 'Pinterest' },
]

const PLATFORM_LABELS: Record<NonNullable<DashboardFilters['platform']>, string> = {
  META: 'Meta',
  GOOGLE: 'Google',
  TIKTOK: 'TikTok',
  PINTEREST: 'Pinterest',
}

const PLATFORM_COLORS: Record<NonNullable<DashboardFilters['platform']>, string> = {
  META: '#1877F2',
  GOOGLE: '#EA4335',
  TIKTOK: '#000000',
  PINTEREST: '#E60023',
}

const SELECT_CLASS =
  'px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer'

const DATE_INPUT_CLASS =
  'px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer'

interface FilterBarProps {
  filters: DashboardFilters
  setFilter: (key: keyof DashboardFilters, value: string | undefined) => void
  setMultiple: (updates: Partial<Record<keyof DashboardFilters, string | undefined>>) => void
}

function FilterBar({ filters, setFilter, setMultiple }: FilterBarProps) {
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
    staleTime: 10 * 60 * 1000,
  })

  const activeChannels = channels.filter((c) => c.status === 'ACTIVE')
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period selector */}
      <select
        value={filters.period}
        onChange={(e) => {
          const val = e.target.value as PeriodKey
          if (val !== 'custom') {
            setMultiple({ period: val, date_from: undefined, date_to: undefined })
          } else {
            setFilter('period', 'custom')
          }
        }}
        className={SELECT_CLASS}
      >
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
          <option key={key} value={key}>
            {PERIOD_LABELS[key]}
          </option>
        ))}
      </select>

      {/* Date range inputs — shown only for custom period */}
      {filters.period === 'custom' && (
        <>
          <input
            type="date"
            value={filters.date_from ?? ''}
            max={filters.date_to ?? today}
            onChange={(e) => setFilter('date_from', e.target.value || undefined)}
            className={DATE_INPUT_CLASS}
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={filters.date_to ?? ''}
            min={filters.date_from}
            max={today}
            onChange={(e) => setFilter('date_to', e.target.value || undefined)}
            className={DATE_INPUT_CLASS}
          />
        </>
      )}

      {/* Platform selector */}
      <select
        value={filters.platform ?? ''}
        onChange={(e) => setFilter('platform', e.target.value || undefined)}
        className={SELECT_CLASS}
      >
        {PLATFORM_OPTIONS.map((opt) => (
          <option key={opt.value ?? 'all'} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Channel selector */}
      {activeChannels.length > 0 && (
        <select
          value={filters.channel_id ?? ''}
          onChange={(e) => setFilter('channel_id', e.target.value || undefined)}
          className={SELECT_CLASS}
        >
          <option value="">Todos os canais</option>
          {activeChannels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function ChannelContextTag({ channelId }: { channelId: string }) {
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
    staleTime: 10 * 60 * 1000,
  })

  const channel = channels.find((c) => c.id === channelId)
  if (!channel) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: channel.color }}
      />
      <span className="text-muted-foreground">Canal:</span>
      <span className="font-semibold">{channel.name}</span>
    </div>
  )
}

function PlatformContextTag({ platform }: { platform: NonNullable<DashboardFilters['platform']> }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: PLATFORM_COLORS[platform] }}
      />
      <span className="text-muted-foreground">Plataforma:</span>
      <span className="font-semibold">{PLATFORM_LABELS[platform]}</span>
    </div>
  )
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function PeriodTag({ filters }: { filters: DashboardFilters }) {
  const label =
    filters.period === 'custom' && filters.date_from && filters.date_to
      ? `${formatDateBR(filters.date_from)} – ${formatDateBR(filters.date_to)}`
      : PERIOD_LABELS[filters.period]

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground">
      <CalendarRange className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">Período:</span>
      <span className="font-semibold">{label}</span>
    </div>
  )
}

export function DashboardPage() {
  const { filters, setFilter, setMultiple, resetFilters } = useFilters()
  const qc = useQueryClient()

  const handleRefresh = useCallback((event: WsEvent) => {
    if (event.type === 'dashboard:refresh') {
      if (event.payload.scope === 'all') {
        qc.invalidateQueries()
      } else {
        qc.invalidateQueries({ queryKey: ['campaigns'] })
        qc.invalidateQueries({ queryKey: ['kpis'] })
        qc.invalidateQueries({ queryKey: ['timeseries'] })
        qc.invalidateQueries({ queryKey: ['distribution'] })
      }
    }
  }, [qc])

  useWebSocketEvent('dashboard:refresh', handleRefresh)

  const hasActiveFilters =
    filters.period !== 'this_month' || filters.channel_id || filters.platform || filters.objective

  const exportRange = (() => {
    const today = new Date().toISOString().slice(0, 10)
    if (filters.period === 'custom' && filters.date_from && filters.date_to)
      return { from: filters.date_from, to: filters.date_to }
    const days = filters.period === 'last_7d' ? 7 : filters.period === 'last_14d' ? 14 : 30
    const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
    return { from, to: today }
  })()


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <ExportButton scope="campaigns" from={exportRange.from} to={exportRange.to} />
          <FilterBar filters={filters} setFilter={setFilter} setMultiple={setMultiple} />
        </div>
      </div>

      {/* Active filter tags + clear button */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <PeriodTag filters={filters} />
            {filters.channel_id && <ChannelContextTag channelId={filters.channel_id} />}
            {filters.platform && <PlatformContextTag platform={filters.platform} />}
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar filtros
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <KpiCardsSection filters={filters} />

      {/* Timeseries + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TimeseriesSection filters={filters} />
        </div>
        <div>
          <DistributionSection filters={filters} />
        </div>
      </div>

      {/* Top Campaigns */}
      <TopCampaignsSection filters={filters} />

      {/* Campaigns Table */}
      <CampaignsTableSection filters={filters} />
    </div>
  )
}
