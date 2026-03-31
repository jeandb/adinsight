import { db } from '../../shared/database/client'
import type { ScheduledReportRow, CreateReportInput } from './reports.types'

function nextSendAt(frequency: string): Date {
  const d = new Date()
  if (frequency === 'daily')   d.setDate(d.getDate() + 1)
  if (frequency === 'weekly')  d.setDate(d.getDate() + 7)
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1)
  d.setHours(7, 0, 0, 0)
  return d
}

export const reportsRepository = {
  async findAll(): Promise<ScheduledReportRow[]> {
    const { rows } = await db.query<ScheduledReportRow>(
      `SELECT * FROM scheduled_reports ORDER BY created_at DESC`,
    )
    return rows
  },

  async findById(id: string): Promise<ScheduledReportRow | null> {
    const { rows } = await db.query<ScheduledReportRow>(
      `SELECT * FROM scheduled_reports WHERE id = $1`,
      [id],
    )
    return rows[0] ?? null
  },

  async findDue(): Promise<ScheduledReportRow[]> {
    const { rows } = await db.query<ScheduledReportRow>(
      `SELECT * FROM scheduled_reports
       WHERE is_active = TRUE AND next_send_at IS NOT NULL AND next_send_at <= NOW()`,
    )
    return rows
  },

  async create(input: CreateReportInput, createdBy: string): Promise<ScheduledReportRow> {
    const next = nextSendAt(input.frequency)
    const { rows } = await db.query<ScheduledReportRow>(
      `INSERT INTO scheduled_reports
         (name, frequency, format, scope, recipients, period_days, next_send_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.name,
        input.frequency,
        input.format,
        input.scope,
        JSON.stringify(input.recipients),
        input.periodDays ?? 30,
        next,
        createdBy,
      ],
    )
    return rows[0]
  },

  async update(id: string, input: Partial<CreateReportInput & { isActive: boolean }>): Promise<ScheduledReportRow | null> {
    const sets: string[] = []
    const params: unknown[] = []
    let i = 1

    if (input.name       !== undefined) { sets.push(`name = $${i++}`);        params.push(input.name) }
    if (input.frequency  !== undefined) { sets.push(`frequency = $${i++}`);   params.push(input.frequency);
                                          sets.push(`next_send_at = $${i++}`); params.push(nextSendAt(input.frequency)) }
    if (input.format     !== undefined) { sets.push(`format = $${i++}`);      params.push(input.format) }
    if (input.scope      !== undefined) { sets.push(`scope = $${i++}`);       params.push(input.scope) }
    if (input.recipients !== undefined) { sets.push(`recipients = $${i++}`);  params.push(JSON.stringify(input.recipients)) }
    if (input.periodDays !== undefined) { sets.push(`period_days = $${i++}`); params.push(input.periodDays) }
    if (input.isActive   !== undefined) { sets.push(`is_active = $${i++}`);   params.push(input.isActive) }

    if (sets.length === 0) return this.findById(id)

    params.push(id)
    const { rows } = await db.query<ScheduledReportRow>(
      `UPDATE scheduled_reports SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      params,
    )
    return rows[0] ?? null
  },

  async markSent(id: string): Promise<void> {
    const row = await this.findById(id)
    if (!row) return
    await db.query(
      `UPDATE scheduled_reports SET last_sent_at = NOW(), next_send_at = $1 WHERE id = $2`,
      [nextSendAt(row.frequency), id],
    )
  },

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await db.query(
      `DELETE FROM scheduled_reports WHERE id = $1`,
      [id],
    )
    return (rowCount ?? 0) > 0
  },
}
