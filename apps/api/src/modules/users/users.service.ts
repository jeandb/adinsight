import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { env } from '../../config/env'
import { AppError } from '../../shared/middleware/error.middleware'
import { sendInviteEmail } from '../../shared/mailer'
import { usersRepository } from './users.repository'
import type { UserRole, UserSession } from '@adinsight/shared-types'

export const usersService = {
  async listAll() {
    return usersRepository.findAll()
  },

  async invite(data: { email: string; role: UserRole }, inviter: UserSession) {
    const exists = await usersRepository.emailExists(data.email)
    if (exists) {
      throw new AppError(422, 'EMAIL_ALREADY_EXISTS', 'Já existe um usuário com este email')
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await usersRepository.createInvite({
      email: data.email,
      role: data.role,
      token,
      invitedBy: inviter.id,
      expiresAt,
    })

    const activateUrl = `${env.FRONTEND_URL}/activate?token=${token}`

    await sendInviteEmail({
      to: data.email,
      inviterName: inviter.name,
      role: data.role,
      activateUrl,
    })

    return { email: data.email, role: data.role, expiresAt }
  },

  async activate(data: { token: string; name: string; password: string }) {
    const invite = await usersRepository.findInviteByToken(data.token)
    if (!invite) {
      throw new AppError(404, 'INVITE_NOT_FOUND', 'Link de ativação inválido ou expirado')
    }

    if (data.password.length < 12) {
      throw new AppError(400, 'WEAK_PASSWORD', 'Senha deve ter no mínimo 12 caracteres')
    }

    const emailExists = await usersRepository.emailExists(invite.email)
    if (emailExists) {
      throw new AppError(422, 'EMAIL_ALREADY_EXISTS', 'Esta conta já foi ativada')
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS)

    const user = await usersRepository.createFromInvite({
      name: data.name,
      email: invite.email,
      passwordHash,
      role: invite.role,
    })

    await usersRepository.acceptInvite(data.token)

    return user
  },

  async updateRole(id: string, role: UserRole, requesterId: string) {
    if (id === requesterId) {
      throw new AppError(422, 'CANNOT_CHANGE_OWN_ROLE', 'Você não pode alterar o seu próprio perfil')
    }
    const user = await usersRepository.updateRole(id, role)
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')
    return user
  },

  async deactivate(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new AppError(422, 'CANNOT_DEACTIVATE_SELF', 'Você não pode desativar sua própria conta')
    }
    const user = await usersRepository.setActive(id, false)
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')
    return user
  },

  async reactivate(id: string) {
    const user = await usersRepository.setActive(id, true)
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado')
    return user
  },
}
