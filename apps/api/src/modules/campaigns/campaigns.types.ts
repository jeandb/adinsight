export type CampaignObjective =
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED'

export interface AssignChannelInput {
  channelId: string | null
}
