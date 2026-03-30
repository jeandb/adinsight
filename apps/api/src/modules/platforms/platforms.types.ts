export type PlatformType = 'META' | 'GOOGLE' | 'TIKTOK' | 'PINTEREST'
export type PlatformStatus = 'ACTIVE' | 'ERROR' | 'NOT_CONFIGURED'

export interface PlatformRow {
  id: string
  type: PlatformType
  status: PlatformStatus
  credentials_encrypted: string | null
  last_sync_at: Date | null
  last_error: string | null
  created_at: Date
  updated_at: Date
}

export interface PlatformCredentials {
  [key: string]: string
}

export const PLATFORM_CREDENTIAL_FIELDS: Record<PlatformType, string[]> = {
  META:      ['app_id', 'app_secret', 'access_token'],
  GOOGLE:    ['developer_token', 'client_id', 'client_secret', 'refresh_token'],
  TIKTOK:    ['app_id', 'app_secret', 'access_token'],
  PINTEREST: ['app_id', 'app_secret', 'access_token'],
}
