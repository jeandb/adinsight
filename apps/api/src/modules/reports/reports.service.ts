import { AppError } from '../../shared/middleware/error.middleware'
import { reportsRepository } from './reports.repository'
import { generateExcel, generateCsv } from './exporters/excel.exporter'
import { generatePdf } from './exporters/pdf.exporter'
import { sendReportEmail } from '../../shared/mailer'
import type { ScheduledReportRow, CreateReportInput, ExportOptions } from './reports.types'

function sanitize(row: ScheduledReportRow) {
  return {
    id:          row.id,
    name:        row.name,
    frequency:   row.frequency,
    format:      row.format,
    scope:       row.scope,
    recipients:  row.recipients,
    periodDays:  row.period_days,
    isActive:    row.is_active,
    lastSentAt:  row.last_sent_at,
    nextSendAt:  row.next_send_at,
    createdAt:   row.created_at,
  }
}

export const reportsService = {
  async list() {
    const rows = await reportsRepository.findAll()
    return rows.map(sanitize)
  },

  async create(input: CreateReportInput, userId: string) {
    const row = await reportsRepository.create(input, userId)
    return sanitize(row)
  },

  async update(id: string, input: Partial<CreateReportInput & { isActive: boolean }>) {
    const row = await reportsRepository.update(id, input)
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Relatório não encontrado')
    return sanitize(row)
  },

  async delete(id: string) {
    const deleted = await reportsRepository.delete(id)
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Relatório não encontrado')
  },

  async export(opts: ExportOptions): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const date = new Date().toISOString().slice(0, 10)
    const base = `adinsight-${opts.scope}-${date}`

    switch (opts.format) {
      case 'pdf': {
        const buffer = await generatePdf(opts)
        return { buffer, mimeType: 'application/pdf', filename: `${base}.pdf` }
      }
      case 'excel': {
        const buffer = await generateExcel(opts)
        return { buffer, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `${base}.xlsx` }
      }
      case 'csv': {
        const buffer = await generateCsv(opts)
        return { buffer, mimeType: 'text/csv; charset=utf-8', filename: `${base}.csv` }
      }
    }
  },

  async sendNow(id: string) {
    const row = await reportsRepository.findById(id)
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Relatório não encontrado')

    const to   = new Date().toISOString().slice(0, 10)
    const from = new Date(Date.now() - row.period_days * 86_400_000).toISOString().slice(0, 10)
    const opts: ExportOptions = { scope: row.scope, format: row.format, from, to }
    const { buffer, mimeType, filename } = await reportsService.export(opts)

    await sendReportEmail({
      to: row.recipients,
      reportName: row.name,
      periodFrom: from,
      periodTo: to,
      attachment: { buffer, mimeType, filename },
    })

    await reportsRepository.markSent(id)
  },

  async processDue() {
    const due = await reportsRepository.findDue()
    let sent = 0
    for (const report of due) {
      try {
        await reportsService.sendNow(report.id)
        sent++
      } catch (err) {
        console.error(`[reports] Falha ao enviar relatório "${report.name}":`, err)
      }
    }
    return { processed: due.length, sent }
  },
}
