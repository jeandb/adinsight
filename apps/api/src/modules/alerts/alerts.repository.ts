import { db } from '../../shared/database/client'
import type {
  AlertRuleRow,
  AlertEventRow,
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
  AlertMetric,
  AlertOperator,
} from './alerts.types'

export const alertsRepository = {
  // ─── Rules ───────────────────────────────────────────────────────────────

  async findAllRules(): Promise<AlertRuleRow[]> {
    const { rows } = await db.query<AlertRuleRow>(
      `SELECT * FROM alert_rules ORDER BY created_at DESC`,
    )
    return rows
  },

  async findRuleById(id: string): Promise<AlertRuleRow | null> {
    const { rows } = await db.query<AlertRuleRow>(
      `SELECT * FROM alert_rules WHERE id = $1`,
      [id],
    )
    return rows[0] ?? null
  },

  async findEnabledRules(): Promise<AlertRuleRow[]> {
    const { rows } = await db.query<AlertRuleRow>(
      `SELECT * FROM alert_rules WHERE enabled = TRUE`,
    )
    return rows
  },

  async createRule(input: CreateAlertRuleInput, createdBy: string): Promise<AlertRuleRow> {
    const { rows } = await db.query<AlertRuleRow>(
      `INSERT INTO alert_rules
         (name, metric, operator, threshold, period_days, platform, channel_id, recipients, created_by)
       VALUES ($1, $2::alert_metric, $3::alert_operator, $4, $5, $6::platform_type, $7, $8, $9)
       RETURNING *`,
      [
        input.name,
        input.metric,
        input.operator,
        input.threshold,
        input.periodDays ?? 7,
        input.platform ?? null,
        input.channelId ?? null,
        input.recipients ?? [],
        createdBy,
      ],
    )
    return rows[0]
  },

  async updateRule(id: string, input: UpdateAlertRuleInput): Promise<AlertRuleRow | null> {
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1

    if (input.name !== undefined)       { fields.push(`name = $${i++}`);                     values.push(input.name) }
    if (input.metric !== undefined)     { fields.push(`metric = $${i++}::alert_metric`);      values.push(input.metric) }
    if (input.operator !== undefined)   { fields.push(`operator = $${i++}::alert_operator`);  values.push(input.operator) }
    if (input.threshold !== undefined)  { fields.push(`threshold = $${i++}`);                 values.push(input.threshold) }
    if (input.periodDays !== undefined) { fields.push(`period_days = $${i++}`);               values.push(input.periodDays) }
    if ('platform' in input)            { fields.push(`platform = $${i++}::platform_type`);   values.push(input.platform ?? null) }
    if ('channelId' in input)           { fields.push(`channel_id = $${i++}`);                values.push(input.channelId ?? null) }
    if (input.recipients !== undefined) { fields.push(`recipients = $${i++}`);                values.push(input.recipients) }
    if (input.enabled !== undefined)    { fields.push(`enabled = $${i++}`);                   values.push(input.enabled) }

    if (fields.length === 0) return alertsRepository.findRuleById(id)

    values.push(id)
    const { rows } = await db.query<AlertRuleRow>(
      `UPDATE alert_rules SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    )
    return rows[0] ?? null
  },

  async deleteRule(id: string): Promise<boolean> {
    const { rowCount } = await db.query(
      `DELETE FROM alert_rules WHERE id = $1`,
      [id],
    )
    return (rowCount ?? 0) > 0
  },

  // ─── Events ──────────────────────────────────────────────────────────────

  async createEvent(
    ruleId: string,
    ruleName: string,
    metric: AlertMetric,
    operator: AlertOperator,
    threshold: number,
    metricValue: number,
    message: string,
  ): Promise<AlertEventRow> {
    const { rows } = await db.query<AlertEventRow>(
      `INSERT INTO alert_events
         (rule_id, rule_name, metric, operator, threshold, metric_value, message)
       VALUES ($1, $2, $3::alert_metric, $4::alert_operator, $5, $6, $7)
       RETURNING *`,
      [ruleId, ruleName, metric, operator, threshold, metricValue, message],
    )
    return rows[0]
  },

  async findRecentEvents(limit = 50): Promise<AlertEventRow[]> {
    const { rows } = await db.query<AlertEventRow>(
      `SELECT * FROM alert_events ORDER BY triggered_at DESC LIMIT $1`,
      [limit],
    )
    return rows
  },

  async markNotified(eventId: string): Promise<void> {
    await db.query(
      `UPDATE alert_events SET notified = TRUE WHERE id = $1`,
      [eventId],
    )
  },

  // ─── Evaluation helpers ──────────────────────────────────────────────────

  /**
   * Returns aggregated metrics for the given period (platform + channel optional).
   */
  async getAggregates(
    periodDays: number,
    platform: string | null,
    channelId: string | null,
  ): Promise<{
    revenue_cents: string
    spend_cents: string
    leads: string
    clicks: string
    impressions: string
  }> {
    const { rows } = await db.query<{
      revenue_cents: string
      spend_cents: string
      leads: string
      clicks: string
      impressions: string
    }>(
      `SELECT
         COALESCE(SUM(ms.revenue_cents), 0)::text AS revenue_cents,
         COALESCE(SUM(ms.spend_cents), 0)::text   AS spend_cents,
         COALESCE(SUM(ms.leads), 0)::text         AS leads,
         COALESCE(SUM(ms.clicks), 0)::text        AS clicks,
         COALESCE(SUM(ms.impressions), 0)::text   AS impressions
       FROM metric_snapshots ms
       JOIN campaigns c  ON c.id = ms.campaign_id
       JOIN ad_platforms p ON p.id = c.platform_id
       WHERE ms.snapshot_date >= (NOW() - ($1 || ' days')::INTERVAL)::DATE
         AND ($2::text IS NULL OR p.type = $2::platform_type)
         AND ($3::uuid IS NULL OR c.channel_id = $3::uuid)`,
      [periodDays, platform, channelId],
    )
    return rows[0]
  },
}
