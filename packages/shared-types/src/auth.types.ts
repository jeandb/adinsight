import type { UserSession } from './user.types'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserSession
  tokens: AuthTokens
}

export interface SetupRequest {
  name: string
  email: string
  password: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface ApiResponse<T = unknown> {
  success: true
  data: T
  meta?: {
    page?: number
    total?: number
    limit?: number
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}
