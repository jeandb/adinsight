import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { alertsService } from './alerts.service'

const createRuleSchema = z.object({
  name:       z.string().min(1).max(255),
  metric:     z.enum(['roas', 'cpl', 'cpc', 'ctr', 'spend', 'impressions', 'clicks', 'leads']),
  operator:   z.enum(['lt', 'lte', 'gt', 'gte']),
  threshold:  z.number().positive(),
  periodDays: z.number().int().min(1).max(90).optional(),
  platform:   z.enum(['META', 'GOOGLE', 'TIKTOK', 'PINTEREST']).nullable().optional(),
  channelId:  z.string().uuid().nullable().optional(),
  recipients: z.array(z.string().email()).optional(),
})

const updateRuleSchema = createRuleSchema.partial().extend({
  enabled: z.boolean().optional(),
})

export const alertsController = {
  async listRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await alertsService.listRules()
      res.json({ success: true, data: rules })
    } catch (err) { next(err) }
  },

  async createRule(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createRuleSchema.parse(req.body)
      const rule = await alertsService.createRule(input, req.user!.id)
      res.status(201).json({ success: true, data: rule })
    } catch (err) { next(err) }
  },

  async updateRule(req: Request, res: Response, next: NextFunction) {
    try {
      const id    = z.string().uuid('ID inválido').parse(req.params.id)
      const input = updateRuleSchema.parse(req.body)
      const rule  = await alertsService.updateRule(id, input)
      res.json({ success: true, data: rule })
    } catch (err) { next(err) }
  },

  async deleteRule(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid('ID inválido').parse(req.params.id)
      await alertsService.deleteRule(id)
      res.status(204).send()
    } catch (err) { next(err) }
  },

  async listEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = z.coerce.number().int().min(1).max(200).default(50).parse(req.query.limit)
      const events = await alertsService.listEvents(limit)
      res.json({ success: true, data: events })
    } catch (err) { next(err) }
  },

  async evaluate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await alertsService.evaluate()
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },
}
