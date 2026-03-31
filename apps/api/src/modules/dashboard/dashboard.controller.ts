import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { dashboardService } from './dashboard.service'

const filtersSchema = z.object({
  period: z
    .enum(['last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month', 'custom'])
    .default('this_month'),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  channel_id: z.string().uuid().optional(),
  platform: z.enum(['META', 'GOOGLE', 'TIKTOK', 'PINTEREST']).optional(),
  objective: z
    .enum(['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'APP_PROMOTION', 'SALES'])
    .optional(),
})

function parseFilters(query: Request['query']) {
  const parsed = filtersSchema.parse(query)
  return {
    period: parsed.period,
    dateFrom: parsed.date_from,
    dateTo: parsed.date_to,
    channelId: parsed.channel_id,
    platform: parsed.platform,
    objective: parsed.objective,
  }
}

export const dashboardController = {
  async kpis(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = parseFilters(req.query)
      const data = await dashboardService.getKpis(filters)
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  },

  async timeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = parseFilters(req.query)
      const metricSchema = z
        .enum(['spend', 'impressions', 'clicks', 'leads', 'roas'])
        .default('spend')
      const metric = metricSchema.parse(req.query.metric)
      const data = await dashboardService.getTimeseries(filters, metric)
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  },

  async distribution(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = parseFilters(req.query)
      const groupBy = z.enum(['platform', 'channel']).default('platform').parse(req.query.group_by)
      const metric = z
        .enum(['spend', 'impressions', 'clicks', 'leads', 'roas'])
        .default('spend')
        .parse(req.query.metric)
      const data = await dashboardService.getDistribution(filters, groupBy, metric)
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  },

  async topCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = parseFilters(req.query)
      const sortBy = z
        .enum(['roas', 'cpl', 'spend', 'impressions', 'clicks', 'leads', 'name'])
        .default('roas')
        .parse(req.query.sort_by)
      const limit = z.coerce.number().int().min(1).max(50).default(10).parse(req.query.limit)
      const data = await dashboardService.getTopCampaigns(filters, sortBy, limit)
      res.json({ success: true, data })
    } catch (err) {
      next(err)
    }
  },

  async campaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = parseFilters(req.query)
      const page = z.coerce.number().int().min(1).default(1).parse(req.query.page)
      const limit = z.coerce.number().int().min(1).max(100).default(20).parse(req.query.limit)
      const sortBy = z
        .enum(['roas', 'cpl', 'cpc', 'ctr', 'spend', 'impressions', 'clicks', 'leads', 'name'])
        .default('spend')
        .parse(req.query.sort_by)
      const sortDir = z.enum(['asc', 'desc']).default('desc').parse(req.query.sort_dir)
      const search = z.string().trim().optional().parse(req.query.search) ?? null

      const { rows, total } = await dashboardService.getCampaigns(
        filters,
        page,
        limit,
        sortBy,
        sortDir,
        search,
      )

      res.json({
        success: true,
        data: rows,
        meta: { page, limit, total },
      })
    } catch (err) {
      next(err)
    }
  },
}
