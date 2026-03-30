export type ChannelStatus = 'ACTIVE' | 'ARCHIVED'

export interface ChannelRow {
  id: string
  name: string
  description: string | null
  color: string
  keywords: string[]
  status: ChannelStatus
  created_by: string | null
  created_at: Date
  updated_at: Date
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
