export type ChannelStatus = 'ACTIVE' | 'ARCHIVED'

export interface Channel {
  id: string
  name: string
  description: string | null
  color: string
  keywords: string[]
  status: ChannelStatus
  createdAt: string
  updatedAt: string
}

export interface CreateChannelInput {
  name: string
  description?: string
  color: string
  keywords: string[]
}

export interface UpdateChannelInput {
  name?: string
  description?: string
  color?: string
  keywords?: string[]
}
