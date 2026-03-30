import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authService } from './auth.service'

const setupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(12, 'Senha deve ter no mínimo 12 caracteres'),
})

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
})

export const authController = {
  async checkSetup(req: Request, res: Response, next: NextFunction) {
    try {
      const isFirst = await authService.isFirstAccess()
      res.json({ success: true, data: { needsSetup: isFirst } })
    } catch (err) {
      next(err)
    }
  },

  async setup(req: Request, res: Response, next: NextFunction) {
    try {
      const body = setupSchema.parse(req.body)
      const result = await authService.setup(body)
      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = loginSchema.parse(req.body)
      const result = await authService.login(body.email, body.password)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const body = refreshSchema.parse(req.body)
      const tokens = await authService.refresh(body.refreshToken)
      res.json({ success: true, data: tokens })
    } catch (err) {
      next(err)
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: { user: req.user } })
    } catch (err) {
      next(err)
    }
  },
}
