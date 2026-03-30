import { apiClient } from '@/lib/api/client'
import type { LoginRequest, LoginResponse, SetupRequest, AuthTokens } from '@adinsight/shared-types'

export const authApi = {
  checkSetup: () =>
    apiClient.get<{ data: { needsSetup: boolean } }>('/auth/check-setup').then((r) => r.data.data),

  setup: (body: SetupRequest) =>
    apiClient.post<{ data: LoginResponse }>('/auth/setup', body).then((r) => r.data.data),

  login: (body: LoginRequest) =>
    apiClient.post<{ data: LoginResponse }>('/auth/login', body).then((r) => r.data.data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken }).then((r) => r.data.data),

  me: () =>
    apiClient.get('/auth/me').then((r) => r.data.data),
}
