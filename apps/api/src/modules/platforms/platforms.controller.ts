import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { platformsService } from './platforms.service'
import type { PlatformType } from './platforms.types'

const VALID_TYPES: PlatformType[] = ['META', 'GOOGLE', 'TIKTOK', 'PINTEREST']

function parsePlatformType(value: string): PlatformType {
  const upper = value.toUpperCase() as PlatformType
  if (!VALID_TYPES.includes(upper)) throw new Error(`Plataforma inválida: ${value}`)
  return upper
}

export const platformsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const platforms = await platformsService.listAll()
      res.json({ success: true, data: platforms })
    } catch (err) { next(err) }
  },

  async saveCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const type = parsePlatformType(req.params.type)
      const body = z.record(z.string()).parse(req.body)
      const platform = await platformsService.saveCredentials(type, body)
      res.json({ success: true, data: platform })
    } catch (err) { next(err) }
  },

  async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const type = parsePlatformType(req.params.type)
      const result = await platformsService.testConnection(type)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },

  async clearCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const type = parsePlatformType(req.params.type)
      const platform = await platformsService.clearCredentials(type)
      res.json({ success: true, data: platform })
    } catch (err) { next(err) }
  },

  async syncPlatform(req: Request, res: Response, next: NextFunction) {
    try {
      const type = parsePlatformType(req.params.type)
      const { daysBack } = z
        .object({ daysBack: z.coerce.number().int().min(1).max(90).optional() })
        .parse(req.body)
      const result = await platformsService.triggerSync(type, daysBack)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  },
}
