import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { channelsService } from './channels.service'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(HEX_COLOR, 'Cor deve ser um hex válido (#RRGGBB)'),
  keywords: z.array(z.string().min(1)).default([]),
})

const updateSchema = createSchema.partial()

export const channelsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const channels = await channelsService.listAll()
      res.json({ success: true, data: channels })
    } catch (err) { next(err) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSchema.parse(req.body)
      const channel = await channelsService.create(input, req.user!.id)
      res.status(201).json({ success: true, data: channel })
    } catch (err) { next(err) }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateSchema.parse(req.body)
      const channel = await channelsService.update(req.params.id, input)
      res.json({ success: true, data: channel })
    } catch (err) { next(err) }
  },

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = await channelsService.archive(req.params.id)
      res.json({ success: true, data: channel })
    } catch (err) { next(err) }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = await channelsService.restore(req.params.id)
      res.json({ success: true, data: channel })
    } catch (err) { next(err) }
  },
}
