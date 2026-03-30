import type { UserRole } from '@adinsight/shared-types'

export interface UserRow {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface InviteRow {
  id: string
  email: string
  role: UserRole
  token: string
  invited_by: string
  expires_at: Date
  accepted_at: Date | null
  created_at: Date
}
