import { db } from '../../shared/database/client'

export interface RevenueKpisRow {
  revenue_cents: string
  orders: string
  prev_revenue_cents: string
  prev_orders: string
  active_subscriptions: string
}

export interface RevenueTimeseriesRow {
  date: string
  store_type: string
  store_name: string
  revenue_cents: string
}

export interface RevenueByStoreRow {
  store_type: string
  store_name: string
  revenue_cents: string
}

export interface RoasRealRow {
  channel_id: string
  channel_name: string
  channel_color: string
  revenue_cents: string
  spend_cents: string
}

export const revenueRepository = {
  async getKpis(after: string, before: string): Promise<RevenueKpisRow> {
    const periodDays = Math.ceil(
      (new Date(before).getTime() - new Date(after).getTime()) / 86_400_000,
    )
    const prevBefore = after
    const prevAfter  = new Date(new Date(after).getTime() - periodDays * 86_400_000).toISOString()

    const { rows } = await db.query<RevenueKpisRow>(
      `SELECT
         COALESCE(SUM(CASE WHEN o.order_date >= $1 AND o.order_date <= $2 AND o.status = 'completed' THEN o.total_cents END), 0)::text AS revenue_cents,
         COUNT(CASE WHEN o.order_date >= $1 AND o.order_date <= $2 AND o.status = 'completed' THEN 1 END)::text AS orders,
         COALESCE(SUM(CASE WHEN o.order_date >= $3 AND o.order_date <  $4 AND o.status = 'completed' THEN o.total_cents END), 0)::text AS prev_revenue_cents,
         COUNT(CASE WHEN o.order_date >= $3 AND o.order_date <  $4 AND o.status = 'completed' THEN 1 END)::text AS prev_orders,
         (SELECT COUNT(*)::text FROM woo_subscriptions WHERE status = 'active') AS active_subscriptions
       FROM woo_orders o`,
      [after, before, prevAfter, prevBefore],
    )
    return rows[0]
  },

  async getTimeseries(after: string, before: string, channelId?: string): Promise<RevenueTimeseriesRow[]> {
    const params: string[] = [after, before]
    const channelFilter = channelId ? `AND s.channel_id = $${params.push(channelId)}` : ''
    const { rows } = await db.query<RevenueTimeseriesRow>(
      `SELECT
         o.order_date::date::text  AS date,
         s.type::text              AS store_type,
         s.name                    AS store_name,
         SUM(o.total_cents)::text  AS revenue_cents
       FROM woo_orders o
       JOIN woo_stores s ON s.id = o.store_id
       WHERE o.order_date >= $1
         AND o.order_date <= $2
         AND o.status = 'completed'
         ${channelFilter}
       GROUP BY o.order_date::date, s.id, s.type, s.name
       ORDER BY date ASC`,
      params,
    )
    return rows
  },

  async getByStore(after: string, before: string, channelId?: string): Promise<RevenueByStoreRow[]> {
    const params: string[] = [after, before]
    const channelFilter = channelId ? `AND s.channel_id = $${params.push(channelId)}` : ''
    const { rows } = await db.query<RevenueByStoreRow>(
      `SELECT
         s.type::text              AS store_type,
         s.name                    AS store_name,
         SUM(o.total_cents)::text  AS revenue_cents
       FROM woo_orders o
       JOIN woo_stores s ON s.id = o.store_id
       WHERE o.order_date >= $1
         AND o.order_date <= $2
         AND o.status = 'completed'
         ${channelFilter}
       GROUP BY s.id, s.type, s.name
       ORDER BY revenue_cents DESC`,
      params,
    )
    return rows
  },

  /** ROAS real: WooCommerce revenue / ad spend, grouped by channel */
  async getRoasReal(after: string, before: string): Promise<RoasRealRow[]> {
    const { rows } = await db.query<RoasRealRow>(
      `SELECT
         bc.id::text               AS channel_id,
         bc.name                   AS channel_name,
         bc.color                  AS channel_color,
         COALESCE(woo.revenue_cents, 0)::text AS revenue_cents,
         COALESCE(ads.spend_cents,  0)::text  AS spend_cents
       FROM business_channels bc
       -- WooCommerce revenue for this channel's store
       LEFT JOIN (
         SELECT s.channel_id, SUM(o.total_cents) AS revenue_cents
         FROM woo_orders o
         JOIN woo_stores s ON s.id = o.store_id
         WHERE o.order_date >= $1
           AND o.order_date <= $2
           AND o.status = 'completed'
           AND s.channel_id IS NOT NULL
         GROUP BY s.channel_id
       ) woo ON woo.channel_id = bc.id
       -- Ad spend for this channel's campaigns
       LEFT JOIN (
         SELECT c.channel_id, SUM(ms.spend_cents) AS spend_cents
         FROM metric_snapshots ms
         JOIN campaigns c ON c.id = ms.campaign_id
         WHERE ms.snapshot_date >= $1::date
           AND ms.snapshot_date <= $2::date
           AND c.channel_id IS NOT NULL
         GROUP BY c.channel_id
       ) ads ON ads.channel_id = bc.id
       WHERE bc.status = 'ACTIVE'
         AND (woo.revenue_cents IS NOT NULL OR ads.spend_cents IS NOT NULL)
       ORDER BY woo.revenue_cents DESC NULLS LAST`,
      [after, before],
    )
    return rows
  },
}
