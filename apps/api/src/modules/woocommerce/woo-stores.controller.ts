import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { wooStoresService } from './woo-stores.service'
import { generateImportTemplate } from './revenue.importer'

export const wooStoresController = {
  async listStores(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await wooStoresService.listStores() })
    } catch (err) { next(err) }
  },

  async createStore(req: Request, res: Response, next: NextFunction) {
    try {
      const input = z.object({
        name:       z.string().min(1).max(120),
        url:        z.string().url().nullable().optional(),
        sourceType: z.enum(['woocommerce', 'manual', 'kiwify']),
        channelId:  z.string().uuid().nullable().optional(),
      }).parse(req.body)

      const store = await wooStoresService.createStore(input)
      res.status(201).json({ success: true, data: store })
    } catch (err) { next(err) }
  },

  async updateStore(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id)
      const input = z.object({
        name:       z.string().min(1).max(120).optional(),
        url:        z.string().url().nullable().optional(),
        sourceType: z.enum(['woocommerce', 'manual', 'kiwify']).optional(),
        channelId:  z.string().uuid().nullable().optional(),
      }).parse(req.body)
      res.json({ success: true, data: await wooStoresService.updateStore(id, input) })
    } catch (err) { next(err) }
  },

  async deleteStore(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id)
      await wooStoresService.deleteStore(id)
      res.status(204).send()
    } catch (err) { next(err) }
  },

  async saveCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const id    = z.string().uuid().parse(req.params.id)
      const input = z.object({
        consumerKey:    z.string().min(1),
        consumerSecret: z.string().min(1),
        channelId:      z.string().uuid().nullable().optional(),
      }).parse(req.body)

      res.json({ success: true, data: await wooStoresService.saveCredentials(id, input) })
    } catch (err) { next(err) }
  },

  async saveKiwifyCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const id    = z.string().uuid().parse(req.params.id)
      const input = z.object({
        clientId:     z.string().min(1),
        clientSecret: z.string().min(1),
        accountId:    z.string().min(1),
        channelId:    z.string().uuid().nullable().optional(),
      }).parse(req.body)

      res.json({ success: true, data: await wooStoresService.saveKiwifyCredentials(id, input) })
    } catch (err) { next(err) }
  },

  async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id)
      res.json({ success: true, data: await wooStoresService.testConnection(id) })
    } catch (err) { next(err) }
  },

  async syncStore(req: Request, res: Response, next: NextFunction) {
    try {
      const id      = z.string().uuid().parse(req.params.id)
      const daysBack = z.coerce.number().int().min(1).max(365).default(30).parse(req.body.daysBack)
      res.json({ success: true, data: await wooStoresService.syncStore(id, daysBack) })
    } catch (err) { next(err) }
  },

  async importFile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id)
      const file = (req as Request & { file?: Express.Multer.File }).file

      if (!file) throw Object.assign(new Error('Nenhum arquivo enviado'), { statusCode: 400 })

      const result = await wooStoresService.importFromFile(id, file.buffer, file.originalname)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },

  async downloadTemplate(_req: Request, res: Response, next: NextFunction) {
    try {
      const csv = generateImportTemplate()
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="modelo-importacao-faturamento.csv"')
      res.send(csv)
    } catch (err) { next(err) }
  },

  async clearCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id)
      res.json({ success: true, data: await wooStoresService.clearCredentials(id) })
    } catch (err) { next(err) }
  },

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page    = z.coerce.number().int().min(1).default(1).parse(req.query.page)
      const limit   = z.coerce.number().int().min(1).max(100).default(20).parse(req.query.limit)
      const storeId = z.string().uuid().optional().parse(req.query.store)
      const after   = z.string().optional().parse(req.query.after)
      const before  = z.string().optional().parse(req.query.before)
      const status  = z.string().optional().parse(req.query.status)

      const result = await wooStoresService.listOrders({ storeId, after, before, status, page, limit })
      res.json({ success: true, data: result.rows, meta: { page, limit, total: result.total } })
    } catch (err) { next(err) }
  },
}
