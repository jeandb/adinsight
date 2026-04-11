import { dashboardRepository } from './dashboard.repository'
import type {
  PeriodKey,
  DateRange,
  DashboardFilters,
  KpiValues,
  KpiResponse,
  TimeseriesPoint,
  DistributionItem,
  TopCampaign,
  CampaignRow,
  MetricKey,
  GroupBy,
  SortBy,
  SortDir,
} from './dashboard.types'

const PLATFORM_COLORS: Record<string, string> = {
  META: '#1877F2',
  GOOGLE: '#4285F4',
  TIKTOK: '#000000',
  PINTEREST: '#E60023',
}

function subDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - n)
  return r
}

function resolvePeriod(
  period: PeriodKey,
  dateFrom?: string,
  dateTo?: string,
): { current: DateRange; previous: DateRange } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }

  function endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0)
  }

  if (period === 'custom' && dateFrom && dateTo) {
    const from = new Date(dateFrom + 'T00:00:00')
    const to = new Date(dateTo + 'T00:00:00')
    const diffDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    return {
      current: { from, to },
      previous: { from: subDays(from, diffDays + 1), to: subDays(from, 1) },
    }
  }

  switch (period) {
    case 'last_7d': {
      const from = subDays(today, 7)
      const to = yesterday
      return { current: { from, to }, previous: { from: subDays(from, 7), to: subDays(from, 1) } }
    }
    case 'last_14d': {
      const from = subDays(today, 14)
      const to = yesterday
      return { current: { from, to }, previous: { from: subDays(from, 14), to: subDays(from, 1) } }
    }
    case 'last_30d': {
      const from = subDays(today, 30)
      const to = yesterday
      return { current: { from, to }, previous: { from: subDays(from, 30), to: subDays(from, 1) } }
    }
    case 'this_month': {
      const from = startOfMonth(today)
      const to = yesterday
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      return {
        current: { from, to },
        previous: { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) },
      }
    }
    case 'last_month': {
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const from = startOfMonth(prevMonth)
      const to = endOfMonth(prevMonth)
      const prevPrevMonth = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      return {
        current: { from, to },
        previous: { from: startOfMonth(prevPrevMonth), to: endOfMonth(prevPrevMonth) },
      }
    }
    default: {
      const from = subDays(today, 30)
      const to = yesterday
      return { current: { from, to }, previous: { from: subDays(from, 30), to: subDays(from, 1) } }
    }
  }
}

function computeKpiValues(
  impressions: number,
  clicks: number,
  spendCents: number,
  leads: number,
  purchases: number,
  revenueCents: number,
): KpiValues {
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const cpc = clicks > 0 ? spendCents / clicks / 100 : 0
  const cpl = leads > 0 ? spendCents / leads / 100 : 0
  const roas = spendCents > 0 ? revenueCents / spendCents : 0
  const cpa = purchases > 0 ? spendCents / purchases / 100 : 0

  return {
    spendCents,
    impressions,
    clicks,
    ctr,
    cpc,
    cpl,
    leads,
    roas,
    purchases,
    revenueCents,
    cpa,
  }
}

function computeDeltas(current: KpiValues, previous: KpiValues): Record<keyof KpiValues, number> {
  function delta(curr: number, prev: number): number {
    if (prev === 0) return curr === 0 ? 0 : 100
    return ((curr - prev) / prev) * 100
  }

  return {
    spendCents: delta(current.spendCents, previous.spendCents),
    impressions: delta(current.impressions, previous.impressions),
    clicks: delta(current.clicks, previous.clicks),
    ctr: delta(current.ctr, previous.ctr),
    cpc: delta(current.cpc, previous.cpc),
    cpl: delta(current.cpl, previous.cpl),
    leads: delta(current.leads, previous.leads),
    roas: delta(current.roas, previous.roas),
    purchases: delta(current.purchases, previous.purchases),
    revenueCents: delta(current.revenueCents, previous.revenueCents),
    cpa: delta(current.cpa, previous.cpa),
  }
}

export const dashboardService = {
  async getKpis(filters: DashboardFilters): Promise<KpiResponse> {
    const { current: currentRange, previous: previousRange } = resolvePeriod(filters.period, filters.dateFrom, filters.dateTo)
    const raw = await dashboardRepository.getKpis(filters, currentRange, previousRange)

    const current = computeKpiValues(
      parseInt(raw.impressions, 10),
      parseInt(raw.clicks, 10),
      parseInt(raw.spend_cents, 10),
      parseInt(raw.leads, 10),
      parseInt(raw.purchases, 10),
      parseInt(raw.revenue_cents, 10),
    )

    const previous = computeKpiValues(
      parseInt(raw.prev_impressions, 10),
      parseInt(raw.prev_clicks, 10),
      parseInt(raw.prev_spend_cents, 10),
      parseInt(raw.prev_leads, 10),
      parseInt(raw.prev_purchases, 10),
      parseInt(raw.prev_revenue_cents, 10),
    )

    const deltas = computeDeltas(current, previous)

    return { current, previous, deltas }
  },

  async getTimeseries(
    filters: DashboardFilters,
    metric: MetricKey,
  ): Promise<TimeseriesPoint[]> {
    const { current: range } = resolvePeriod(filters.period, filters.dateFrom, filters.dateTo)
    const rows = await dashboardRepository.getTimeseries(filters, range, metric)

    return rows.map((r) => ({
      date: r.date,
      value: parseFloat(r.value),
    }))
  },

  async getDistribution(
    filters: DashboardFilters,
    groupBy: GroupBy,
    metric: MetricKey,
  ): Promise<DistributionItem[]> {
    const { current: range } = resolvePeriod(filters.period, filters.dateFrom, filters.dateTo)
    const rows = await dashboardRepository.getDistribution(filters, range, groupBy, metric)

    const total = rows.reduce((sum, r) => sum + parseFloat(r.value), 0)

    return rows.map((r) => {
      const value = parseFloat(r.value)
      const color =
        groupBy === 'platform' ? (PLATFORM_COLORS[r.label] ?? r.color) : r.color

      return {
        label: r.label,
        color,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }
    })
  },

  async getTopCampaigns(
    filters: DashboardFilters,
    sortBy: SortBy,
    limit: number,
  ): Promise<TopCampaign[]> {
    const { current: range } = resolvePeriod(filters.period, filters.dateFrom, filters.dateTo)
    const rows = await dashboardRepository.getTopCampaigns(filters, range, sortBy, limit)

    return rows.map((r) => {
      const spendCents = parseInt(r.spend_cents, 10)
      const leads = parseInt(r.leads, 10)
      const purchases = parseInt(r.purchases, 10)
      const revenueCents = parseInt(r.revenue_cents, 10)

      const roas = spendCents > 0 ? revenueCents / spendCents : 0
      const cpl = leads > 0 ? spendCents / leads / 100 : 0
      const cpa = purchases > 0 ? spendCents / purchases / 100 : 0

      return {
        id: r.id,
        name: r.name,
        platformType: r.platform_type,
        channelName: r.channel_name,
        channelColor: r.channel_color,
        spendCents,
        leads,
        purchases,
        revenueCents,
        roas,
        cpl,
        cpa,
      }
    })
  },

  async getCampaigns(
    filters: DashboardFilters,
    page: number,
    limit: number,
    sortBy: SortBy,
    sortDir: SortDir,
    search: string | null,
  ): Promise<{ rows: CampaignRow[]; total: number }> {
    const { current: range } = resolvePeriod(filters.period, filters.dateFrom, filters.dateTo)
    const { rows, total } = await dashboardRepository.getCampaigns(
      filters,
      range,
      page,
      limit,
      sortBy,
      sortDir,
      search,
    )

    const mapped: CampaignRow[] = rows.map((r) => {
      const spendCents = parseInt(r.spend_cents, 10)
      const impressions = parseInt(r.impressions, 10)
      const clicks = parseInt(r.clicks, 10)
      const leads = parseInt(r.leads, 10)
      const purchases = parseInt(r.purchases, 10)
      const revenueCents = parseInt(r.revenue_cents, 10)

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
      const cpc = clicks > 0 ? spendCents / clicks / 100 : 0
      const cpl = leads > 0 ? spendCents / leads / 100 : 0
      const roas = spendCents > 0 ? revenueCents / spendCents : 0
      const cpa = purchases > 0 ? spendCents / purchases / 100 : 0

      return {
        id: r.id,
        name: r.name,
        platformType: r.platform_type,
        channelName: r.channel_name,
        channelColor: r.channel_color,
        objective: r.objective,
        status: r.status,
        spendCents,
        impressions,
        clicks,
        ctr,
        cpc,
        cpl,
        leads,
        purchases,
        revenueCents,
        cpa,
        roas,
      }
    })

    return { rows: mapped, total }
  },
}
