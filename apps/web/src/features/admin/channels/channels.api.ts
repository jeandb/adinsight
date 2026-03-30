import { apiClient } from '@/lib/api/client'
import type { Channel, CreateChannelInput, UpdateChannelInput } from '@adinsight/shared-types'

export { type Channel }

export const channelsApi = {
  list: () =>
    apiClient.get<{ data: Channel[] }>('/channels').then((r) => r.data.data),

  create: (input: CreateChannelInput) =>
    apiClient.post<{ data: Channel }>('/channels', input).then((r) => r.data.data),

  update: (id: string, input: UpdateChannelInput) =>
    apiClient.put<{ data: Channel }>(`/channels/${id}`, input).then((r) => r.data.data),

  archive: (id: string) =>
    apiClient.patch<{ data: Channel }>(`/channels/${id}/archive`).then((r) => r.data.data),

  restore: (id: string) =>
    apiClient.patch<{ data: Channel }>(`/channels/${id}/restore`).then((r) => r.data.data),
}
