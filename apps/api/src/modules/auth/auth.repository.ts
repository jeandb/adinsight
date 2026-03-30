import { db } from '../../shared/database/client'
import type { UserRow } from './auth.types'
import type { UserRole } from '@adinsight/shared-types'

export const authRepository = {
  async countUsers(): Promise<number> {
    const { rows } = await db.query<{ count: string }>('SELECT COUNT(*) FROM users')
    return parseInt(rows[0].count, 10)
  },

  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await db.query<UserRow>(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE LIMIT 1',
      [email.toLowerCase()],
    )
    return rows[0] ?? null
  },

  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await db.query<UserRow>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id],
    )
    return rows[0] ?? null
  },

  async createAdmin(data: {
    name: string
    email: string
    passwordHash: string
    role: UserRole
  }): Promise<UserRow> {
    const { rows } = await db.query<UserRow>(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [data.name, data.email.toLowerCase(), data.passwordHash, data.role],
    )
    return rows[0]
  },

  async updateLastLogin(id: string): Promise<void> {
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id])
  },
}
