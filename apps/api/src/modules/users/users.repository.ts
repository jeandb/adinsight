import { db } from '../../shared/database/client'
import type { UserRow, InviteRow } from './users.types'
import type { UserRole } from '@adinsight/shared-types'

export const usersRepository = {
  async findAll(): Promise<UserRow[]> {
    const { rows } = await db.query<UserRow>(
      `SELECT id, name, email, role, is_active, last_login_at, created_at, updated_at
       FROM users ORDER BY created_at ASC`,
    )
    return rows
  },

  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await db.query<UserRow>(
      `SELECT id, name, email, role, is_active, last_login_at, created_at, updated_at
       FROM users WHERE id = $1`,
      [id],
    )
    return rows[0] ?? null
  },

  async updateRole(id: string, role: UserRole): Promise<UserRow | null> {
    const { rows } = await db.query<UserRow>(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, name, email, role, is_active, last_login_at, created_at, updated_at`,
      [role, id],
    )
    return rows[0] ?? null
  },

  async setActive(id: string, isActive: boolean): Promise<UserRow | null> {
    const { rows } = await db.query<UserRow>(
      `UPDATE users SET is_active = $1 WHERE id = $2
       RETURNING id, name, email, role, is_active, last_login_at, created_at, updated_at`,
      [isActive, id],
    )
    return rows[0] ?? null
  },

  async createInvite(data: {
    email: string
    role: UserRole
    token: string
    invitedBy: string
    expiresAt: Date
  }): Promise<InviteRow> {
    const { rows } = await db.query<InviteRow>(
      `INSERT INTO user_invites (email, role, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.email.toLowerCase(), data.role, data.token, data.invitedBy, data.expiresAt],
    )
    return rows[0]
  },

  async findInviteByToken(token: string): Promise<InviteRow | null> {
    const { rows } = await db.query<InviteRow>(
      `SELECT * FROM user_invites
       WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
      [token],
    )
    return rows[0] ?? null
  },

  async acceptInvite(token: string): Promise<void> {
    await db.query(
      `UPDATE user_invites SET accepted_at = NOW() WHERE token = $1`,
      [token],
    )
  },

  async createFromInvite(data: {
    name: string
    email: string
    passwordHash: string
    role: UserRole
  }): Promise<UserRow> {
    const { rows } = await db.query<UserRow>(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, name, email, role, is_active, last_login_at, created_at, updated_at`,
      [data.name, data.email.toLowerCase(), data.passwordHash, data.role],
    )
    return rows[0]
  },

  async emailExists(email: string): Promise<boolean> {
    const { rows } = await db.query<{ count: string }>(
      `SELECT COUNT(*) FROM users WHERE email = $1`,
      [email.toLowerCase()],
    )
    return parseInt(rows[0].count, 10) > 0
  },
}
