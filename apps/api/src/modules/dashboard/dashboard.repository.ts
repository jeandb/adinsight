import { db } from '../../shared/database/client'
import type { DateRange, DashboardFilters, MetricKey, GroupBy, SortBy, SortDir } from './dashboard.types'

interface KpiRawRow {
  impressions: string
  clicks: string
  spend_cents: string
  leads: string
  revenue_cents: string
  prev_impressions: string
  prev_clicks: string
  prev_spend_cents: string
  prev_leads: string
  prev_revenue_cents: string
}

interface TimeseriesRawRow {
  date: string
  value: string
}

interface DistributionRawRow {
  label: string
  color: string
  value: string
}

interface TopCampaignRawRow {
  id: string
  name: string
  platform_type: string
  channel_name: string | null
  channel_color: string | null
  spend_cents: string
  leads: string
  revenue_cents: string
}

interface CampaignRawRow {
  id: string
  name: string
  platform_type: string
  channel_name: string | null
  channel_color: string | null
  objective: string
  status: string
  spend_cents: string
  impressions: string
  clicks: string
  leads: string
  revenue_cents: string
}

interface CampaignsPageResult {
  rows: CampaignRawRow[]
  total: number
}

export const dashboardRepository = {
  async getKpis(
    filters: DashboardFilters,
    currentRange: DateRange,
    previousRange: DateRange,
  ): Promise<KpiRawRow> {
    const platform = filters.platform ?? null
    const channelId = filters.channelId ?? null
    const objective = filters.objective ?? null

    const { rows } = await db.query<KpiRawRow>(
      `WITH period_data AS (
        SELECT
          COALESCE(SUM(ms.impressions), 0)    AS impressions,
          COALESCE(SUM(ms.clicks), 0)         AS clicks,
          COALESCE(SUM(ms.spend_cents), 0)    AS spend_cents,
          COALESCE(SUM(ms.leads), 0)          AS leads,
          COALESCE(SUM(ms.revenue_cents), 0)  AS revenue_cents
        FROM metric_snapshots ms
        JOIN campaigns c ON c.id = ms.campaign_id
        JOIN ad_platforms ap ON ap.id = c.platform_id
        WHERE ms.snapshot_date BETWEEN $1 AND $2
          AND ($3::text IS NULL OR ap.type::text = $3)
          AND ($4::uuid IS NULL OR c.channel_id = $4)
          AND ($5::text IS NULL OR c.objective::text = $5)
      ),
      prev_data AS (
        SELECT
          COALESCE(SUM(ms.impressions), 0)    AS impressions,
          COALESCE(SUM(ms.clicks), 0)         AS clicks,
          COALESCE(SUM(ms.spend_cents), 0)    AS spend_cents,
          COALESCE(SUM(ms.leads), 0)          AS leads,
          COALESCE(SUM(ms.revenue_cents), 0)  AS revenue_cents
        FROM metric_snapshots ms
        JOIN campaigns c ON c.id = ms.campaign_id
        JOIN ad_platforms ap ON ap.id = c.platform_id
        WHERE ms.snapshot_date BETWEEN $6 AND $7
          AND ($3::text IS NULL OR ap.type::text = $3)
          AND ($4::uuid IS NULL OR c.channel_id = $4)
          AND ($5::text IS NULL OR c.objective::text = $5)
      )
      SELECT
        p.impressions,
        p.clicks,
        p.spend_cents,
        p.leads,
        p.revenue_cents,
        prev.impressions   AS prev_impressions,
        prev.clicks        AS prev_clicks,
        prev.spend_cents   AS prev_spend_cents,
        prev.leads         AS prev_leads,
        prev.revenue_cents AS prev_revenue_cents
      FROM period_data p, prev_data prev`,
      [
        currentRange.from,
        currentRange.to,
        platform,
        channelId,
        objective,
        previousRange.from,
        previousRange.to,
      ],
    )

    return rows[0]
  },

  async getTimeseries(
    filters: DashboardFilters,
    range: DateRange,
    metric: MetricKey,
  ): Promise<TimeseriesRawRow[]> {
    const platform = filters.platform ?? null
    const channelId = filters.channelId ?? null
    const objective = filters.objective ?? null

    const valueExpr =
      metric === 'roas'
        ? `SUM(ms.revenue_cents)::numeric / NULLIF(SUM(ms.spend_cents), 0)`
        : metric === 'spend'
          ? `SUM(ms.spend_cents)`
          : metric === 'impressions'
            ? `SUM(ms.impressions)`
            : metric === 'clicks'
              ? `SUM(ms.clicks)`
              : `SUM(ms.leads)` // leads

    const { rows } = await db.query<TimeseriesRawRow>(
      `SELECT
        ms.snapshot_date::text AS date,
        COALESCE(${valueExpr}, 0) AS value
      FROM metric_snapshots ms
      JOIN campaigns c ON c.id = ms.campaign_id
      JOIN ad_platforms ap ON ap.id = c.platform_id
      WHERE ms.snapshot_date BETWEEN $1 AND $2
        AND ($3::text IS NULL OR ap.type::text = $3)
        AND ($4::uuid IS NULL OR c.channel_id = $4)
        AND ($5::text IS NULL OR c.objective::text = $5)
      GROUP BY ms.snapshot_date
      ORDER BY ms.snapshot_date ASC`,
      [range.from, range.to, platform, channelId, objective],
    )

    return rows
  },

  async getDistribution(
    filters: DashboardFilters,
    range: DateRange,
    groupBy: GroupBy,
    metric: MetricKey,
  ): Promise<DistributionRawRow[]> {
    const platform = filters.platform ?? null
    const channelId = filters.channelId ?? null
    const objective = filters.objective ?? null

    const valueExpr =
      metric === 'roas'
        ? `SUM(ms.revenue_cents)::numeric / NULLIF(SUM(ms.spend_cents), 0)`
        : metric === 'spend'
          ? `SUM(ms.spend_cents)`
          : metric === 'impressions'
            ? `SUM(ms.impressions)`
            : metric === 'clicks'
              ? `SUM(ms.clicks)`
              : `SUM(ms.leads)`

    let query: string

    if (groupBy === 'platform') {
      query = `
        SELECT
          ap.type::text AS label,
          '#6366F1'     AS color,
          COALESCE(${valueExpr}, 0) AS value
        FROM metric_snapshots ms
        JOIN campaigns c ON c.id = ms.campaign_id
        JOIN ad_platforms ap ON ap.id = c.platform_id
        WHERE ms.snapshot_date BETWEEN $1 AND $2
          AND ($3::text IS NULL OR ap.type::text = $3)
          AND ($4::uuid IS NULL OR c.channel_id = $4)
          AND ($5::text IS NULL OR c.objective::text = $5)
        GROUP BY ap.type
        ORDER BY value DESC`
    } else {
      query = `
        SELECT
          COALESCE(bc.name, 'Sem canal')   AS label,
          COALESCE(bc.color, '#94A3B8')    AS color,
          COALESCE(${valueExpr}, 0) AS value
        FROM metric_snapshots ms
        JOIN campaigns c ON c.id = ms.campaign_id
        JOIN ad_platforms ap ON ap.id = c.platform_id
        LEFT JOIN business_channels bc ON bc.id = c.channel_id
        WHERE ms.snapshot_date BETWEEN $1 AND $2
          AND ($3::text IS NULL OR ap.type::text = $3)
          AND ($4::uuid IS NULL OR c.channel_id = $4)
          AND ($5::text IS NULL OR c.objective::text = $5)
        GROUP BY bc.name, bc.color
        ORDER BY value DESC`
    }

    const { rows } = await db.query<DistributionRawRow>(query, [
      range.from,
      range.to,
      platform,
      channelId,
      objective,
    ])

    return rows
  },

  async getTopCampaigns(
    filters: DashboardFilters,
    range: DateRange,
    sortBy: SortBy,
    limit: number,
  ): Promise<TopCampaignRawRow[]> {
    const platform = filters.platform ?? null
    const channelId = filters.channelId ?? null
    const objective = filters.objective ?? null

    const orderExpr =
      sortBy === 'roas'
        ? `SUM(ms.revenue_cents)::numeric / NULLIF(SUM(ms.spend_cents), 0) DESC NULLS LAST`
        : sortBy === 'cpl'
          ? `SUM(ms.spend_cents)::numeric / NULLIF(SUM(ms.leads), 0) ASC NULLS LAST`
          : sortBy === 'spend'
            ? `SUM(ms.spend_cents) DESC`
            : sortBy === 'impressions'
              ? `SUM(ms.impressions) DESC`
              : sortBy === 'clicks'
                ? `SUM(ms.clicks) DESC`
                : sortBy === 'leads'
                  ? `SUM(ms.leads) DESC`
                  : `c.name ASC`

    const { rows } = await db.query<TopCampaignRawRow>(
      `SELECT
        c.id::text,
        c.name,
        ap.type::text                    AS platform_type,
        bc.name                          AS channel_name,
        bc.color                         AS channel_color,
        COALESCE(SUM(ms.spend_cents), 0)   AS spend_cents,
        COALESCE(SUM(ms.leads), 0)         AS leads,
        COALESCE(SUM(ms.revenue_cents), 0) AS revenue_cents
      FROM campaigns c
      JOIN ad_platforms ap ON ap.id = c.platform_id
      LEFT JOIN business_channels bc ON bc.id = c.channel_id
      LEFT JOIN metric_snapshots ms ON ms.campaign_id = c.id
        AND ms.snapshot_date BETWEEN $1 AND $2
      WHERE ($3::text IS NULL OR ap.type::text = $3)
        AND ($4::uuid IS NULL OR c.channel_id = $4)
        AND ($5::text IS NULL OR c.objective::text = $5)
      GROUP BY c.id, c.name, ap.type, bc.name, bc.color
      HAVING SUM(COALESCE(ms.impressions, 0)) > 0 OR SUM(COALESCE(ms.spend_cents, 0)) > 0
      ORDER BY ${orderExpr}
      LIMIT $6`,
      [range.from, range.to, platform, channelId, objective, limit],
    )

    return rows
  },

  async getCampaigns(
    filters: DashboardFilters,
    range: DateRange,
    page: number,
    limit: number,
    sortBy: SortBy,
    sortDir: SortDir,
    search: string | null,
  ): Promise<CampaignsPageResult> {
    const platform = filters.platform ?? null
    const channelId = filters.channelId ?? null
    const objective = filters.objective ?? null
    const offset = (page - 1) * limit

    const orderColumnMap: Record<SortBy, string> = {
      roas: `SUM(ms.revenue_cents)::numeric / NULLIF(SUM(ms.spend_cents), 0)`,
      cpl: `SUM(ms.spend_cents)::numeric / NULLIF(SUM(ms.leads), 0)`,
      cpc: `SUM(ms.spend_cents)::numeric / NULLIF(SUM(ms.clicks), 0)`,
      ctr: `SUM(ms.clicks)::numeric / NULLIF(SUM(ms.impressions), 0)`,
      spend: `SUM(ms.spend_cents)`,
      impressions: `SUM(ms.impressions)`,
      clicks: `SUM(ms.clicks)`,
      leads: `SUM(ms.leads)`,
      name: `c.name`,
    }

    const orderExpr = `${orderColumnMap[sortBy]} ${sortDir.toUpperCase()} NULLS LAST`

    const baseWhere = `
      WHERE ($3::text IS NULL OR ap.type::text = $3)
        AND ($4::uuid IS NULL OR c.channel_id = $4)
        AND ($5::text IS NULL OR c.objective::text = $5)
        AND ($8::text IS NULL OR c.name ILIKE '%' || $8 || '%')`

    const { rows: dataRows } = await db.query<CampaignRawRow>(
      `SELECT
        c.id::text,
        c.name,
        ap.type::text                      AS platform_type,
        bc.name                            AS channel_name,
        bc.color                           AS channel_color,
        c.objective::text                  AS objective,
        c.status::text                     AS status,
        COALESCE(SUM(ms.spend_cents), 0)   AS spend_cents,
        COALESCE(SUM(ms.impressions), 0)   AS impressions,
        COALESCE(SUM(ms.clicks), 0)        AS clicks,
        COALESCE(SUM(ms.leads), 0)         AS leads,
        COALESCE(SUM(ms.revenue_cents), 0) AS revenue_cents
      FROM campaigns c
      JOIN ad_platforms ap ON ap.id = c.platform_id
      LEFT JOIN business_channels bc ON bc.id = c.channel_id
      LEFT JOIN metric_snapshots ms ON ms.campaign_id = c.id
        AND ms.snapshot_date BETWEEN $1 AND $2
      ${baseWhere}
      GROUP BY c.id, c.name, ap.type, bc.name, bc.color, c.objective, c.status
      HAVING SUM(COALESCE(ms.impressions, 0)) > 0 OR SUM(COALESCE(ms.spend_cents, 0)) > 0
      ORDER BY ${orderExpr}
      LIMIT $6 OFFSET $7`,
      [range.from, range.to, platform, channelId, objective, limit, offset, search],
    )

    const { rows: countRows } = await db.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM (
        SELECT c.id
        FROM campaigns c
        JOIN ad_platforms ap ON ap.id = c.platform_id
        LEFT JOIN metric_snapshots ms ON ms.campaign_id = c.id
          AND ms.snapshot_date BETWEEN $1 AND $2
        WHERE ($3::text IS NULL OR ap.type::text = $3)
          AND ($4::uuid IS NULL OR c.channel_id = $4)
          AND ($5::text IS NULL OR c.objective::text = $5)
          AND ($6::text IS NULL OR c.name ILIKE '%' || $6 || '%')
        GROUP BY c.id
        HAVING SUM(COALESCE(ms.impressions, 0)) > 0 OR SUM(COALESCE(ms.spend_cents, 0)) > 0
      ) sub`,
      [range.from, range.to, platform, channelId, objective, search],
    )

    return {
      rows: dataRows,
      total: parseInt(countRows[0]?.total ?? '0', 10),
    }
  },
}
