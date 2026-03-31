import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { wooStoresService } from './woo-stores.service'

const WOO_TYPES = ['LOJA_DAS_PROFS', 'CLUBE_DAS_PROFS', 'TUDO_DE_PROF'] as const
const typeSchema = z.enum(WOO_TYPES)

export const wooStoresController = {
  async listStores(req: Request, res: Response, next: NextFunction) {
    try {
      const stores = await wooStoresService.listStores()
      res.json({ success: true, data: stores })
    } catch (err) { next(err) }
  },

  async saveCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const type  = typeSchema.parse(req.params.type)
      const input = z.object({
        consumerKey:    z.string().min(1),
        consumerSecret: z.string().min(1),
        channelId:      z.string().uuid().nullable().optional(),
      }).parse(req.body)

      const store = await wooStoresService.saveCredentials(type, input)
      res.json({ success: true, data: store })
    } catch (err) { next(err) }
  },

  async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const type   = typeSchema.parse(req.params.type)
      const result = await wooStoresService.testConnection(type)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },

  async syncStore(req: Request, res: Response, next: NextFunction) {
    try {
      const type    = typeSchema.parse(req.params.type)
      const daysBack = z.coerce.number().int().min(1).max(365).default(30).parse(req.body.daysBack)
      const result  = await wooStoresService.syncStore(type, daysBack)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },

  async clearCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const type  = typeSchema.parse(req.params.type)
      const store = await wooStoresService.clearCredentials(type)
      res.json({ success: true, data: store })
    } catch (err) { next(err) }
  },

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page      = z.coerce.number().int().min(1).default(1).parse(req.query.page)
      const limit     = z.coerce.number().int().min(1).max(100).default(20).parse(req.query.limit)
      const storeType = z.string().optional().parse(req.query.store)
      const after     = z.string().optional().parse(req.query.after)
      const before    = z.string().optional().parse(req.query.before)
      const status    = z.string().optional().parse(req.query.status)

      const result = await wooStoresService.listOrders({ storeType, after, before, status, page, limit })
      res.json({ success: true, data: result.rows, meta: { page, limit, total: result.total } })
    } catch (err) { next(err) }
  },
}
