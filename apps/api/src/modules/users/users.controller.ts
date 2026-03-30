import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { usersService } from './users.service'
import { UserRole } from '@adinsight/shared-types'

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.nativeEnum(UserRole),
})

const activateSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  password: z.string().min(12, 'Senha deve ter no mínimo 12 caracteres'),
})

const roleSchema = z.object({
  role: z.nativeEnum(UserRole),
})

export const usersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await usersService.listAll()
      res.json({ success: true, data: users })
    } catch (err) { next(err) }
  },

  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const body = inviteSchema.parse(req.body)
      const result = await usersService.invite(body, req.user!)
      res.status(201).json({ success: true, data: result })
    } catch (err) { next(err) }
  },

  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const body = activateSchema.parse(req.body)
      const user = await usersService.activate(body)
      res.status(201).json({ success: true, data: user })
    } catch (err) { next(err) }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = roleSchema.parse(req.body)
      const user = await usersService.updateRole(req.params.id, role, req.user!.id)
      res.json({ success: true, data: user })
    } catch (err) { next(err) }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.deactivate(req.params.id, req.user!.id)
      res.json({ success: true, data: user })
    } catch (err) { next(err) }
  },

  async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.reactivate(req.params.id)
      res.json({ success: true, data: user })
    } catch (err) { next(err) }
  },
}
