import { AppError } from '../../shared/middleware/error.middleware'
import { alertsRepository } from './alerts.repository'
import { evaluateAllRules } from './alerts.evaluator'
import type { AlertRuleRow, AlertEventRow, CreateAlertRuleInput, UpdateAlertRuleInput } from './alerts.types'

function sanitizeRule(row: AlertRuleRow) {
  return {
    id:          row.id,
    name:        row.name,
    metric:      row.metric,
    operator:    row.operator,
    threshold:   parseFloat(row.threshold),
    periodDays:  row.period_days,
    platform:    row.platform,
    channelId:   row.channel_id,
    recipients:  row.recipients,
    enabled:     row.enabled,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  }
}

function sanitizeEvent(row: AlertEventRow) {
  return {
    id:          row.id,
    ruleId:      row.rule_id,
    ruleName:    row.rule_name,
    metric:      row.metric,
    operator:    row.operator,
    threshold:   parseFloat(row.threshold),
    metricValue: parseFloat(row.metric_value),
    message:     row.message,
    notified:    row.notified,
    triggeredAt: row.triggered_at,
  }
}

export const alertsService = {
  async listRules() {
    const rows = await alertsRepository.findAllRules()
    return rows.map(sanitizeRule)
  },

  async createRule(input: CreateAlertRuleInput, userId: string) {
    const row = await alertsRepository.createRule(input, userId)
    return sanitizeRule(row)
  },

  async updateRule(id: string, input: UpdateAlertRuleInput) {
    const row = await alertsRepository.updateRule(id, input)
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Regra não encontrada')
    return sanitizeRule(row)
  },

  async deleteRule(id: string) {
    const deleted = await alertsRepository.deleteRule(id)
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Regra não encontrada')
  },

  async listEvents(limit = 50) {
    const rows = await alertsRepository.findRecentEvents(limit)
    return rows.map(sanitizeEvent)
  },

  async evaluate() {
    const count = await evaluateAllRules()
    return { evaluated: true, triggered: count }
  },
}
