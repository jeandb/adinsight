import { apiClient } from '@/lib/api/client'

export type PlatformType = 'META' | 'GOOGLE' | 'TIKTOK' | 'PINTEREST'
export type PlatformStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR'

export interface PlatformItem {
  id: string
  type: PlatformType
  name: string
  status: PlatformStatus
  hasCredentials: boolean
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PlatformCredentialField {
  key: string
  label: string
  placeholder?: string
}

export const PLATFORM_META: PlatformCredentialField[] = [
  { key: 'app_id', label: 'App ID', placeholder: 'Ex: 123456789012345' },
  { key: 'app_secret', label: 'App Secret', placeholder: '32 caracteres' },
  { key: 'access_token', label: 'Access Token' },
]

export const PLATFORM_GOOGLE: PlatformCredentialField[] = [
  { key: 'developer_token', label: 'Developer Token' },
  { key: 'client_id', label: 'Client ID' },
  { key: 'client_secret', label: 'Client Secret' },
  { key: 'refresh_token', label: 'Refresh Token' },
]

export const PLATFORM_TIKTOK: PlatformCredentialField[] = [
  { key: 'app_id', label: 'App ID' },
  { key: 'app_secret', label: 'App Secret' },
  { key: 'access_token', label: 'Access Token' },
]

export const PLATFORM_PINTEREST: PlatformCredentialField[] = [
  { key: 'app_id', label: 'App ID' },
  { key: 'app_secret', label: 'App Secret' },
  { key: 'access_token', label: 'Access Token' },
]

export const PLATFORM_FIELDS: Record<PlatformType, PlatformCredentialField[]> = {
  META: PLATFORM_META,
  GOOGLE: PLATFORM_GOOGLE,
  TIKTOK: PLATFORM_TIKTOK,
  PINTEREST: PLATFORM_PINTEREST,
}

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  META: 'Meta Ads',
  GOOGLE: 'Google Ads',
  TIKTOK: 'TikTok Ads',
  PINTEREST: 'Pinterest Ads',
}

export const platformsApi = {
  list: () =>
    apiClient.get<{ data: PlatformItem[] }>('/platforms').then((r) => r.data.data),

  saveCredentials: (type: PlatformType, credentials: Record<string, string>) =>
    apiClient.put<{ data: PlatformItem }>(`/platforms/${type}/credentials`, { credentials }).then((r) => r.data.data),

  testConnection: (type: PlatformType) =>
    apiClient.post<{ data: { success: boolean; message: string } }>(`/platforms/${type}/test-connection`).then((r) => r.data.data),

  clearCredentials: (type: PlatformType) =>
    apiClient.delete<{ data: PlatformItem }>(`/platforms/${type}/credentials`).then((r) => r.data.data),
}
