import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { campaignsService } from './campaigns.service'

export const campaignsController = {
  async listUnassigned(req: Request, res: Response, next: NextFunction) {
    try {
      const page  = z.coerce.number().int().min(1).default(1).parse(req.query.page)
      const limit = z.coerce.number().int().min(1).max(100).default(20).parse(req.query.limit)
      const { rows, total } = await campaignsService.listUnassigned(page, limit)
      res.json({ success: true, data: rows, meta: { page, limit, total } })
    } catch (err) { next(err) }
  },

  async patchChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const campaignId = z.string().uuid('ID de campanha inválido').parse(req.params.id)
      const { channelId } = z
        .object({ channelId: z.string().uuid().nullable() })
        .parse(req.body)
      const result = await campaignsService.assignChannel(campaignId, channelId)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },
}
