import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { AppError } from '../../shared/middleware/error.middleware'
import { authRepository } from './auth.repository'
import type { UserRole, UserSession, AuthTokens, LoginResponse } from '@adinsight/shared-types'
import { UserRole as UserRoleEnum } from '@adinsight/shared-types'

function generateTokens(user: UserSession): AuthTokens {
  const accessToken = jwt.sign(user, env.JWT_SECRET, { expiresIn: '8h' })
  const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
  return { accessToken, refreshToken }
}

export const authService = {
  async isFirstAccess(): Promise<boolean> {
    const count = await authRepository.countUsers()
    return count === 0
  },

  async setup(data: { name: string; email: string; password: string }): Promise<LoginResponse> {
    const isFirst = await authService.isFirstAccess()
    if (!isFirst) {
      throw new AppError(403, 'SETUP_ALREADY_DONE', 'Setup já realizado. Acesso negado.')
    }

    if (data.password.length < 12) {
      throw new AppError(400, 'WEAK_PASSWORD', 'Senha deve ter no mínimo 12 caracteres')
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS)
    const user = await authRepository.createAdmin({
      name: data.name,
      email: data.email,
      passwordHash,
      role: UserRoleEnum.ADMIN,
    })

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    }

    return { user: session, tokens: generateTokens(session) }
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await authRepository.findByEmail(email)
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos')
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos')
    }

    await authRepository.updateLastLogin(user.id)

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    }

    return { user: session, tokens: generateTokens(session) }
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { id: string }
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string }
    } catch {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token inválido ou expirado')
    }

    const user = await authRepository.findById(payload.id)
    if (!user || !user.is_active) {
      throw new AppError(401, 'USER_NOT_FOUND', 'Usuário não encontrado ou desativado')
    }

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    }

    return generateTokens(session)
  },
}
