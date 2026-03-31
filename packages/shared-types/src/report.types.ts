export interface ScheduledReport {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  format: 'pdf' | 'csv' | 'excel'
  scope: 'campaigns' | 'revenue' | 'all'
  recipients: string[]
  periodDays: number
  isActive: boolean
  lastSentAt: string | null
  nextSendAt: string | null
  createdAt: string
}
