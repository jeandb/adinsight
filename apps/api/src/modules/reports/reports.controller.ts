import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { reportsService } from './reports.service'

const createSchema = z.object({
  name:        z.string().min(1),
  frequency:   z.enum(['daily', 'weekly', 'monthly']),
  format:      z.enum(['pdf', 'csv', 'excel']),
  scope:       z.enum(['campaigns', 'revenue', 'all']),
  recipients:  z.array(z.string().email()).min(1),
  periodDays:  z.number().int().min(7).max(365).optional(),
})

export const reportsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.list()
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createSchema.parse(req.body)
      const userId = (req as Request & { user?: { id: string } }).user!.id
      const data = await reportsService.create(body, userId)
      res.status(201).json({ success: true, data })
    } catch (err) { next(err) }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createSchema.partial().extend({ isActive: z.boolean().optional() }).parse(req.body)
      const data = await reportsService.update(req.params.id, body)
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await reportsService.delete(req.params.id)
      res.status(204).send()
    } catch (err) { next(err) }
  },

  async sendNow(req: Request, res: Response, next: NextFunction) {
    try {
      await reportsService.sendNow(req.params.id)
      res.json({ success: true, data: { sent: true } })
    } catch (err) { next(err) }
  },

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const { scope, format, from, to } = z.object({
        scope:  z.enum(['campaigns', 'revenue', 'all']).default('campaigns'),
        format: z.enum(['pdf', 'csv', 'excel']).default('excel'),
        from:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }).parse(req.query)

      const { buffer, mimeType, filename } = await reportsService.export({ scope, format, from, to })
      res.setHeader('Content-Type', mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(buffer)
    } catch (err) { next(err) }
  },
}
