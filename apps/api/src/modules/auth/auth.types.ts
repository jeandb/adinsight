import type { UserRole } from '@adinsight/shared-types'

export interface UserRow {
  id: string
  name: string
  email: string
  password_hash: string
  role: UserRole
  is_active: boolean
  invite_token: string | null
  invite_expires_at: Date | null
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}
