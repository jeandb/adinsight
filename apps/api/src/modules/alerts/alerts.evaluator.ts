import { alertsRepository } from './alerts.repository'
import { sendAlertEmail } from '../../shared/mailer'
import { broadcast } from '../../shared/websocket/websocket.server'
import type { AlertMetric, AlertOperator, AlertRuleRow } from './alerts.types'

function computeMetric(
  metric: AlertMetric,
  agg: { revenue_cents: string; spend_cents: string; leads: string; clicks: string; impressions: string },
): number {
  const spend    = parseInt(agg.spend_cents, 10)
  const revenue  = parseInt(agg.revenue_cents, 10)
  const leads    = parseInt(agg.leads, 10)
  const clicks   = parseInt(agg.clicks, 10)
  const impressions = parseInt(agg.impressions, 10)

  switch (metric) {
    case 'roas':        return spend > 0 ? revenue / spend : 0
    case 'cpl':         return leads > 0 ? spend / 100 / leads : 0
    case 'cpc':         return clicks > 0 ? spend / 100 / clicks : 0
    case 'ctr':         return impressions > 0 ? (clicks / impressions) * 100 : 0
    case 'spend':       return spend / 100
    case 'impressions': return impressions
    case 'clicks':      return clicks
    case 'leads':       return leads
    default:            return 0
  }
}

function checkCondition(value: number, operator: AlertOperator, threshold: number): boolean {
  switch (operator) {
    case 'lt':  return value < threshold
    case 'lte': return value <= threshold
    case 'gt':  return value > threshold
    case 'gte': return value >= threshold
  }
}

function formatValue(metric: AlertMetric, value: number): string {
  if (metric === 'roas') return `${value.toFixed(2)}x`
  if (['cpl', 'cpc', 'spend'].includes(metric))
    return `R$ ${value.toFixed(2)}`
  if (metric === 'ctr') return `${value.toFixed(2)}%`
  return value.toFixed(0)
}

function buildMessage(rule: AlertRuleRow, metricValue: number): string {
  const val  = formatValue(rule.metric, metricValue)
  const thr  = formatValue(rule.metric, parseFloat(rule.threshold))
  const opMap: Record<AlertOperator, string> = { lt: '<', lte: '≤', gt: '>', gte: '≥' }
  return `Alerta "${rule.name}": ${rule.metric.toUpperCase()} = ${val} ${opMap[rule.operator]} ${thr}`
}

export async function evaluateAllRules(): Promise<number> {
  const rules = await alertsRepository.findEnabledRules()
  let triggered = 0

  for (const rule of rules) {
    try {
      const agg = await alertsRepository.getAggregates(
        rule.period_days,
        rule.platform,
        rule.channel_id,
      )

      const metricValue = computeMetric(rule.metric, agg)
      const threshold = parseFloat(rule.threshold)

      if (!checkCondition(metricValue, rule.operator, threshold)) continue

      const message = buildMessage(rule, metricValue)

      const event = await alertsRepository.createEvent(
        rule.id,
        rule.name,
        rule.metric,
        rule.operator,
        threshold,
        metricValue,
        message,
      )

      // Broadcast via WebSocket
      broadcast({
        type: 'alert:triggered',
        payload: {
          eventId:  event.id,
          ruleId:   rule.id,
          ruleName: rule.name,
          message,
          triggeredAt: event.triggered_at.toISOString(),
        },
      })

      // Send email if recipients configured
      if (rule.recipients.length > 0) {
        try {
          await sendAlertEmail({ to: rule.recipients, ruleName: rule.name, message })
          await alertsRepository.markNotified(event.id)
        } catch (emailErr) {
          console.error(`[alerts] Falha ao enviar email para regra ${rule.id}:`, (emailErr as Error).message)
        }
      }

      triggered++
      console.log(`[alerts] Disparado: ${message}`)
    } catch (err) {
      console.error(`[alerts] Erro ao avaliar regra ${rule.id}:`, (err as Error).message)
    }
  }

  return triggered
}
