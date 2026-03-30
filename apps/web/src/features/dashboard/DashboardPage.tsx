import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useFilters, type PeriodKey, type DashboardFilters } from '@/hooks/use-filters'
import { channelsApi } from '@/features/admin/channels/channels.api'
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
}

const PLATFORM_OPTIONS: { value: DashboardFilters['platform']; label: string }[] = [
  { value: undefined, label: 'Todas as plataformas' },
  { value: 'META', label: 'Meta' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'PINTEREST', label: 'Pinterest' },
]

interface FilterBarProps {
  filters: DashboardFilters
  setFilter: (key: keyof DashboardFilters, value: string | undefined) => void
  resetFilters: () => void
}

function FilterBar({ filters, setFilter, resetFilters }: FilterBarProps) {
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
    staleTime: 10 * 60 * 1000,
  })

  const activeChannels = channels.filter((c) => c.status === 'ACTIVE')

  const hasActiveFilters =
    filters.period !== 'last_30d' || filters.channel_id || filters.platform || filters.objective

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period selector */}
      <select
        value={filters.period}
        onChange={(e) => setFilter('period', e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      >
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
          <option key={key} value={key}>
            {PERIOD_LABELS[key]}
          </option>
        ))}
      </select>

      {/* Platform selector */}
      <select
        value={filters.platform ?? ''}
        onChange={(e) => setFilter('platform', e.target.value || undefined)}
        className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
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
          className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value="">Todos os canais</option>
          {activeChannels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      )}

      {/* Reset button */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3" />
          Limpar filtros
        </button>
      )}
    </div>
  )
}

interface ChannelContextTagProps {
  channelId: string
}

function ChannelContextTag({ channelId }: ChannelContextTagProps) {
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
    staleTime: 10 * 60 * 1000,
  })

  const channel = channels.find((c) => c.id === channelId)
  if (!channel) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground w-fit">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: channel.color }}
      />
      <span>Filtrando por canal:</span>
      <span className="font-semibold">{channel.name}</span>
    </div>
  )
}

export function DashboardPage() {
  const { filters, setFilter, resetFilters } = useFilters()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <FilterBar filters={filters} setFilter={setFilter} resetFilters={resetFilters} />
      </div>

      {/* Channel context tag */}
      {filters.channel_id && <ChannelContextTag channelId={filters.channel_id} />}

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
