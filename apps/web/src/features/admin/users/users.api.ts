import { apiClient } from '@/lib/api/client'
import type { UserRole } from '@adinsight/shared-types'

export interface UserItem {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export const usersApi = {
  list: () =>
    apiClient.get<{ data: UserItem[] }>('/users').then((r) => r.data.data),

  invite: (email: string, role: UserRole) =>
    apiClient.post('/users/invite', { email, role }).then((r) => r.data),

  updateRole: (id: string, role: UserRole) =>
    apiClient.patch<{ data: UserItem }>(`/users/${id}/role`, { role }).then((r) => r.data.data),

  deactivate: (id: string) =>
    apiClient.patch<{ data: UserItem }>(`/users/${id}/deactivate`).then((r) => r.data.data),

  reactivate: (id: string) =>
    apiClient.patch<{ data: UserItem }>(`/users/${id}/reactivate`).then((r) => r.data.data),
}
