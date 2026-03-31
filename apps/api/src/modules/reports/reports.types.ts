export interface ScheduledReportRow {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  format: 'pdf' | 'csv' | 'excel'
  scope: 'campaigns' | 'revenue' | 'all'
  recipients: string[]
  period_days: number
  is_active: boolean
  last_sent_at: Date | null
  next_send_at: Date | null
  created_by: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateReportInput {
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  format: 'pdf' | 'csv' | 'excel'
  scope: 'campaigns' | 'revenue' | 'all'
  recipients: string[]
  periodDays?: number
}

export interface ExportOptions {
  scope: 'campaigns' | 'revenue' | 'all'
  format: 'pdf' | 'csv' | 'excel'
  from: string
  to: string
}
