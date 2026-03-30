import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { AppError } from './error.middleware'
import type { UserRole, UserSession } from '@adinsight/shared-types'

declare global {
  namespace Express {
    interface Request {
      user?: UserSession
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Token de acesso não fornecido')
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as UserSession
    req.user = payload
    next()
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Token inválido ou expirado')
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Não autenticado')
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Acesso não autorizado para este perfil')
    }
    next()
  }
}
