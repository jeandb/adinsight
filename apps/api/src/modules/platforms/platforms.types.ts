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
  META:      ['appId', 'appSecret', 'accessToken', 'adAccountId'],
  GOOGLE:    ['clientId', 'clientSecret', 'refreshToken', 'developerToken', 'customerId'],
  TIKTOK:    ['appId', 'appSecret', 'accessToken', 'advertiserId'],
  PINTEREST: ['appId', 'appSecret', 'accessToken', 'adAccountId'],
}
