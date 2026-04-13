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
      const channelId = z.string().uuid().optional().parse(req.query.channel_id)
      const rows = await revenueRepository.getTimeseries(after, before, channelId)
      res.json({ success: true, data: rows })
    } catch (err) { next(err) }
  },

  async getByStore(req: Request, res: Response, next: NextFunction) {
    try {
      const { after, before } = parseDateRange(req.query)
      const channelId = z.string().uuid().optional().parse(req.query.channel_id)
      const rows = await revenueRepository.getByStore(after, before, channelId)
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

  async getOrdersMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { after, before } = parseDateRange(req.query)
      const r = await revenueRepository.getOrdersMetrics(after, before)

      const completedCents     = parseInt(r.completed_cents, 10)
      const prevCompletedCents = parseInt(r.prev_completed_cents, 10)
      const refundedCents      = parseInt(r.refunded_cents, 10)
      const prevRefundedCents  = parseInt(r.prev_refunded_cents, 10)

      const netRevenue     = completedCents - refundedCents
      const prevNetRevenue = prevCompletedCents - prevRefundedCents

      const completed     = parseInt(r.completed, 10)
      const prevCompleted = parseInt(r.prev_completed, 10)
      const processing    = parseInt(r.processing, 10)
      const prevProcessing = parseInt(r.prev_processing, 10)
      const totalOrders    = parseInt(r.total_orders, 10)
      const prevTotalOrders = parseInt(r.prev_total_orders, 10)

      const denominator     = totalOrders - processing
      const prevDenominator = prevTotalOrders - prevProcessing
      const completionRate     = denominator > 0     ? completed / denominator         : 0
      const prevCompletionRate = prevDenominator > 0 ? prevCompleted / prevDenominator : 0

      const uniqueCustomers     = parseInt(r.unique_customers, 10)
      const prevUniqueCustomers = parseInt(r.prev_unique_customers, 10)

      const growth = (curr: number, prev: number): number | null =>
        prev > 0 ? (curr - prev) / prev : null

      res.json({
        success: true,
        data: {
          netRevenue:          { valueCents: netRevenue,      growth: growth(netRevenue, prevNetRevenue) },
          completionRate:      { value: completionRate,       growth: growth(completionRate, prevCompletionRate) },
          uniqueCustomers:     { value: uniqueCustomers,      growth: growth(uniqueCustomers, prevUniqueCustomers) },
        },
      })
    } catch (err) { next(err) }
  },

  async getOrdersSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { after, before } = parseDateRange(req.query)
      const rows = await revenueRepository.getOrdersSummary(after, before)

      const totalOrders = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0)

      const byStatus = Object.fromEntries(
        rows.map((r) => [
          r.status,
          { count: parseInt(r.count, 10), totalCents: parseInt(r.total_cents, 10) },
        ]),
      )

      const cancelled = byStatus['cancelled']?.count ?? 0
      const cancelledPct = totalOrders > 0 ? cancelled / totalOrders : 0

      res.json({
        success: true,
        data: {
          completed:  { count: byStatus['completed']?.count  ?? 0, totalCents: byStatus['completed']?.totalCents  ?? 0 },
          processing: { count: byStatus['processing']?.count ?? 0 },
          cancelled:  { count: cancelled, totalCents: byStatus['cancelled']?.totalCents ?? 0, pct: cancelledPct },
          refunded:   { count: byStatus['refunded']?.count   ?? 0, totalCents: byStatus['refunded']?.totalCents   ?? 0 },
          totalOrders,
        },
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
