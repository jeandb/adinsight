import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { aiService } from './ai.service'

export const aiController = {
  // Providers
  async listProviders(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await aiService.listProviders()
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },

  async createProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const body = z.object({
        name: z.string().min(1),
        provider: z.enum(['anthropic', 'openai', 'gemini']),
        model: z.string().min(1),
        apiKey: z.string().min(1),
        maxTokens: z.number().int().min(256).max(32768).optional(),
      }).parse(req.body)
      const data = await aiService.createProvider(body)
      res.status(201).json({ success: true, data })
    } catch (err) { next(err) }
  },

  async updateProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const body = z.object({
        name: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
        apiKey: z.string().min(1).optional(),
        maxTokens: z.number().int().min(256).max(32768).optional(),
        isActive: z.boolean().optional(),
      }).parse(req.body)
      const data = await aiService.updateProvider(req.params.id, body)
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },

  async deleteProvider(req: Request, res: Response, next: NextFunction) {
    try {
      await aiService.deleteProvider(req.params.id)
      res.status(204).send()
    } catch (err) { next(err) }
  },

  // Scenarios
  async listScenarios(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await aiService.listScenarios()
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },

  async assignScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId } = z.object({ providerId: z.string().uuid().nullable() }).parse(req.body)
      const data = await aiService.assignScenario(req.params.scenario, providerId)
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },

  // Chat
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, history } = z.object({
        message: z.string().min(1).max(4000),
        history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
      }).parse(req.body)
      const userId = (req as Request & { user?: { id: string } }).user?.id ?? null
      const data = await aiService.chat(userId!, message, history)
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },

  // On-demand analysis
  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id ?? null
      const data = await aiService.analyze(userId!)
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },

  // History
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id ?? null
      const data = await aiService.getHistory(userId!)
      res.json({ success: true, data })
    } catch (err) { next(err) }
  },
}
