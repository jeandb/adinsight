import * as XLSX from 'xlsx'
import type { ExportOptions } from '../reports.types'
import { fetchCampaignsForExport, fetchRevenueForExport } from './data.fetcher'

export async function generateExcel(opts: ExportOptions): Promise<Buffer> {
  const wb = XLSX.utils.book_new()

  if (opts.scope === 'campaigns' || opts.scope === 'all') {
    const rows = await fetchCampaignsForExport(opts.from, opts.to)
    const wsData = [
      ['Campanha', 'Plataforma', 'Canal', 'Status', 'Objetivo', 'Investimento (R$)', 'Impressões', 'Cliques', 'CTR', 'CPC', 'Leads', 'CPL', 'Receita (R$)', 'ROAS'],
      ...rows.map((r) => [r.name, r.platform, r.channel, r.status, r.objective, r.spend, r.impressions, r.clicks, r.ctr, r.cpc, r.leads, r.cpl, r.revenue, r.roas]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 8 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Campanhas')
  }

  if (opts.scope === 'revenue' || opts.scope === 'all') {
    const rows = await fetchRevenueForExport(opts.from, opts.to)
    const wsData = [
      ['Data', 'Loja', 'Pedidos', 'Receita (R$)'],
      ...rows.map((r) => [r.date, r.store, r.orders, r.revenue]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 10 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Faturamento')
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(buf)
}

export async function generateCsv(opts: ExportOptions): Promise<Buffer> {
  const lines: string[] = []

  if (opts.scope === 'campaigns' || opts.scope === 'all') {
    lines.push('Campanha,Plataforma,Canal,Status,Objetivo,Investimento,Impressões,Cliques,CTR,CPC,Leads,CPL,Receita,ROAS')
    const rows = await fetchCampaignsForExport(opts.from, opts.to)
    for (const r of rows) {
      lines.push([r.name, r.platform, r.channel, r.status, r.objective, r.spend, r.impressions, r.clicks, r.ctr, r.cpc, r.leads, r.cpl, r.revenue, r.roas].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    }
  }

  if (opts.scope === 'all') lines.push('')

  if (opts.scope === 'revenue' || opts.scope === 'all') {
    lines.push('Data,Loja,Pedidos,Receita')
    const rows = await fetchRevenueForExport(opts.from, opts.to)
    for (const r of rows) {
      lines.push([r.date, r.store, r.orders, r.revenue].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    }
  }

  return Buffer.from('\uFEFF' + lines.join('\r\n'), 'utf-8')
}
