import { apiClient } from '@/lib/api/client'

export interface UnassignedCampaign {
  id: string
  name: string
  objective: string
  status: string
  platform_type: string
  last_synced_at: string | null
}

export interface UnassignedCampaignsMeta {
  page: number
  limit: number
  total: number
}

export const campaignsApi = {
  listUnassigned: (page = 1, limit = 20) =>
    apiClient
      .get<{ data: UnassignedCampaign[]; meta: UnassignedCampaignsMeta }>('/campaigns', {
        params: { page, limit },
      })
      .then((r) => ({ rows: r.data.data, meta: r.data.meta })),

  updateChannel: (campaignId: string, channelId: string | null) =>
    apiClient
      .patch<{ data: { id: string; channel_id: string | null; channel_locked: boolean } }>(
        `/campaigns/${campaignId}/channel`,
        { channelId },
      )
      .then((r) => r.data.data),
}
