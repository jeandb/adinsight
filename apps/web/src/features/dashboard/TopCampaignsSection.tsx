import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type TopCampaign } from './dashboard.api'
import type { DashboardFilters } from '@/hooks/use-filters'

interface TopCampaignsSectionProps {
  filters: DashboardFilters
}

type SortBy = 'roas' | 'cpl' | 'spend'

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'roas', label: 'Maior ROAS' },
  { key: 'cpl', label: 'Menor CPL' },
  { key: 'spend', label: 'Maior Gasto' },
]

const PLATFORM_LABELS: Record<string, string> = {
  META: 'Meta',
  GOOGLE: 'Google',
  TIKTOK: 'TikTok',
  PINTEREST: 'Pinterest',
}

const PLATFORM_COLORS: Record<string, string> = {
  META: '#1877F2',
  GOOGLE: '#EA4335',
  TIKTOK: '#000000',
  PINTEREST: '#E60023',
}

function formatMetricValue(sortBy: SortBy, campaign: TopCampaign): string {
  if (sortBy === 'roas') return `${campaign.roas.toFixed(2)}x`
  if (sortBy === 'cpl')
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      campaign.cpl / 100,
    )
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    campaign.spendCents / 100,
  )
}

function getMetricRaw(sortBy: SortBy, campaign: TopCampaign): number {
  if (sortBy === 'roas') return campaign.roas
  if (sortBy === 'cpl') return campaign.cpl
  return campaign.spendCents
}

interface CampaignRowProps {
  campaign: TopCampaign
  sortBy: SortBy
  maxValue: number
  rank: number
}

function CampaignBar({ campaign, sortBy, maxValue, rank }: CampaignRowProps) {
  const raw = getMetricRaw(sortBy, campaign)
  const pct = maxValue > 0 ? (raw / maxValue) * 100 : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground w-4 shrink-0">{rank}.</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{campaign.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white"
                style={{
                  backgroundColor: PLATFORM_COLORS[campaign.platformType] ?? '#6B7280',
                }}
              >
                {PLATFORM_LABELS[campaign.platformType] ?? campaign.platformType}
              </span>
              {campaign.channelName && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {campaign.channelColor && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: campaign.channelColor }}
                    />
                  )}
                  {campaign.channelName}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-sm font-semibold text-foreground shrink-0">
          {formatMetricValue(sortBy, campaign)}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function TopCampaignsSection({ filters }: TopCampaignsSectionProps) {
  const [sortBy, setSortBy] = useState<SortBy>('roas')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'top-campaigns', filters, sortBy],
    queryFn: () => dashboardApi.getTopCampaigns(filters, sortBy),
    staleTime: 5 * 60 * 1000,
  })

  const maxValue = data
    ? Math.max(...data.map((c) => getMetricRaw(sortBy, c)), 0)
    : 0

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Top Campanhas</h2>
        <div className="flex gap-1 flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                sortBy === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="h-1.5 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      ) : isError || !data ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Não foi possível carregar as campanhas. Tente novamente.
        </div>
      ) : data.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma campanha encontrada no período.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((campaign, i) => (
            <CampaignBar
              key={campaign.id}
              campaign={campaign}
              sortBy={sortBy}
              maxValue={maxValue}
              rank={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
