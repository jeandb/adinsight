export type AlertMetric = 'roas' | 'cpl' | 'cpc' | 'ctr' | 'spend' | 'impressions' | 'clicks' | 'leads'
export type AlertOperator = 'lt' | 'lte' | 'gt' | 'gte'

export interface AlertRuleRow {
  id: string
  name: string
  metric: AlertMetric
  operator: AlertOperator
  threshold: string
  period_days: number
  platform: string | null
  channel_id: string | null
  recipients: string[]
  enabled: boolean
  created_by: string | null
  created_at: Date
  updated_at: Date
}

export interface AlertEventRow {
  id: string
  rule_id: string
  rule_name: string
  metric: AlertMetric
  operator: AlertOperator
  threshold: string
  metric_value: string
  message: string
  notified: boolean
  triggered_at: Date
}

export interface CreateAlertRuleInput {
  name: string
  metric: AlertMetric
  operator: AlertOperator
  threshold: number
  periodDays?: number
  platform?: string | null
  channelId?: string | null
  recipients?: string[]
}

export interface UpdateAlertRuleInput {
  name?: string
  metric?: AlertMetric
  operator?: AlertOperator
  threshold?: number
  periodDays?: number
  platform?: string | null
  channelId?: string | null
  recipients?: string[]
  enabled?: boolean
}

export const ALERT_METRIC_LABELS: Record<AlertMetric, string> = {
  roas: 'ROAS',
  cpl: 'CPL (R$)',
  cpc: 'CPC (R$)',
  ctr: 'CTR (%)',
  spend: 'Gasto (R$)',
  impressions: 'Impressões',
  clicks: 'Cliques',
  leads: 'Leads',
}

export const ALERT_OPERATOR_LABELS: Record<AlertOperator, string> = {
  lt:  'menor que (<)',
  lte: 'menor ou igual (≤)',
  gt:  'maior que (>)',
  gte: 'maior ou igual (≥)',
}
