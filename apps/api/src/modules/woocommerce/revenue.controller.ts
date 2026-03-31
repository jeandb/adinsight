import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { revenueRepository } from './revenue.repository'

function parseDateRange(query: Request['query']): { after: string; before: string } {
  const before = z.string().default(new Date().toISOString()).parse(query.before)
  const after  = z.string()
    .default(new Date(Date.now() - 30 * 86_400_000).toISOString())
    .parse(query.after)
  return { after, before }
}

export const revenueController = {
  async getKpis(req: Request, res: Response, next: NextFunction) {
    try {
      const { after, before } = parseDateRange(req.query)
      const raw = await revenueRepository.getKpis(after, before)

      const revenue     = parseInt(raw.revenue_cents, 10)
      const orders      = parseInt(raw.orders, 10)
      const prevRevenue = parseInt(raw.prev_revenue_cents, 10)
      const prevOrders  = parseInt(raw.prev_orders, 10)

      res.json({
        success: true,
        data: {
          revenueCents:         revenue,
          orders,
          aovCents:             orders > 0 ? Math.round(revenue / orders) : 0,
          activeSubscriptions:  parseInt(raw.active_subscriptions, 10),
          prevRevenueCents:     prevRevenue,
          prevOrders,
          revenueGrowth:        prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : null,
          ordersGrowth:         prevOrders  > 0 ? (orders  - prevOrders)  / prevOrders  : null,
        },
      })
    } catch (err) { next(err) }
  },

  async getTimeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const { after, before } = parseDateRange(req.query)
      const rows = await revenueRepository.getTimeseries(after, before)
      res.json({ success: true, data: rows })
    } catch (err) { next(err) }
  },

  async getByStore(req: Request, res: Response, next: NextFunction) {
    try {
      const { after, before } = parseDateRange(req.query)
      const rows = await revenueRepository.getByStore(after, before)
      res.json({
        success: true,
        data: rows.map((r) => ({
          storeType:    r.store_type,
          storeName:    r.store_name,
          revenueCents: parseInt(r.revenue_cents, 10),
        })),
      })
    } catch (err) { next(err) }
  },

  async getRoasReal(req: Request, res: Response, next: NextFunction) {
    try {
      const { after, before } = parseDateRange(req.query)
      const rows = await revenueRepository.getRoasReal(after, before)
      res.json({
        success: true,
        data: rows.map((r) => {
          const rev   = parseInt(r.revenue_cents, 10)
          const spend = parseInt(r.spend_cents, 10)
          return {
            channelId:    r.channel_id,
            channelName:  r.channel_name,
            channelColor: r.channel_color,
            revenueCents: rev,
            spendCents:   spend,
            roasReal:     spend > 0 ? rev / spend : null,
          }
        }),
      })
    } catch (err) { next(err) }
  },
}
