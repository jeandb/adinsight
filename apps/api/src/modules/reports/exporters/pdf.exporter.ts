import PDFDocument from 'pdfkit'
import type { ExportOptions } from '../reports.types'
import { fetchCampaignsForExport, fetchRevenueForExport } from './data.fetcher'

const BLUE   = '#3b82f6'
const GRAY   = '#6b7280'
const BLACK  = '#111827'
const LIGHT  = '#f3f4f6'

function fmtR(val: number): string {
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function generatePdf(opts: ExportOptions): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true })
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end',  () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc.rect(0, 0, doc.page.width, 56).fill(BLUE)
    doc.fillColor('#fff').fontSize(18).font('Helvetica-Bold').text('AdInsight', 40, 16)
    doc.fontSize(10).font('Helvetica').text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}  ·  Período: ${opts.from} a ${opts.to}`, 40, 38)
    doc.fillColor(BLACK)

    let y = 76

    // Campaigns section
    if (opts.scope === 'campaigns' || opts.scope === 'all') {
      const rows = await fetchCampaignsForExport(opts.from, opts.to)

      // KPI bar
      const spend   = rows.reduce((s, r) => s + r.spend,   0)
      const revenue = rows.reduce((s, r) => s + r.revenue, 0)
      const leads   = rows.reduce((s, r) => s + r.leads,   0)
      const roas    = spend > 0 ? (revenue / spend).toFixed(2) + 'x' : '-'

      doc.fontSize(13).font('Helvetica-Bold').fillColor(BLACK).text('Campanhas', 40, y)
      y += 20

      const kpis = [
        { label: 'Investimento', value: fmtR(spend) },
        { label: 'Receita',      value: fmtR(revenue) },
        { label: 'Leads',        value: leads.toLocaleString('pt-BR') },
        { label: 'ROAS',         value: roas },
      ]
      const kpiW = (doc.page.width - 80) / kpis.length
      kpis.forEach((k, i) => {
        const x = 40 + i * kpiW
        doc.rect(x, y, kpiW - 8, 44).fill(LIGHT)
        doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(k.label, x + 8, y + 8, { width: kpiW - 16 })
        doc.fillColor(BLACK).fontSize(12).font('Helvetica-Bold').text(k.value, x + 8, y + 20, { width: kpiW - 16 })
      })
      doc.fillColor(BLACK)
      y += 56

      // Table header
      const cols = [180, 72, 80, 60, 60, 60]
      const headers = ['Campanha', 'Plataforma', 'Canal', 'Invest.', 'Leads', 'ROAS']
      let x = 40
      doc.rect(40, y, doc.page.width - 80, 18).fill(BLUE)
      doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold')
      headers.forEach((h, i) => { doc.text(h, x + 4, y + 5, { width: cols[i] - 4 }); x += cols[i] })
      y += 18

      const maxRows = Math.min(rows.length, 25)
      for (let ri = 0; ri < maxRows; ri++) {
        const r = rows[ri]
        if (y > doc.page.height - 80) { doc.addPage(); y = 40 }
        doc.rect(40, y, doc.page.width - 80, 16).fill(ri % 2 === 0 ? '#fff' : LIGHT)
        doc.fillColor(BLACK).fontSize(7.5).font('Helvetica')
        x = 40
        const cells = [r.name, r.platform, r.channel, fmtR(r.spend), String(r.leads), r.roas]
        cells.forEach((cell, i) => {
          doc.text(cell, x + 4, y + 4, { width: cols[i] - 8, lineBreak: false, ellipsis: true })
          x += cols[i]
        })
        y += 16
      }
      if (rows.length > 25) {
        doc.fillColor(GRAY).fontSize(8).text(`... e mais ${rows.length - 25} campanhas`, 40, y + 4)
        y += 16
      }
      y += 16
    }

    // Revenue section
    if (opts.scope === 'revenue' || opts.scope === 'all') {
      if (y > doc.page.height - 120) { doc.addPage(); y = 40 }

      const rows = await fetchRevenueForExport(opts.from, opts.to)
      const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)
      const totalOrders  = rows.reduce((s, r) => s + r.orders,  0)

      doc.fillColor(BLACK).fontSize(13).font('Helvetica-Bold').text('Faturamento WooCommerce', 40, y)
      y += 20

      // KPIs
      const kpis2 = [
        { label: 'Receita total',   value: fmtR(totalRevenue) },
        { label: 'Total de pedidos', value: totalOrders.toLocaleString('pt-BR') },
      ]
      const kpiW2 = (doc.page.width - 80) / 4
      kpis2.forEach((k, i) => {
        const kx = 40 + i * kpiW2
        doc.rect(kx, y, kpiW2 - 8, 44).fill(LIGHT)
        doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(k.label, kx + 8, y + 8, { width: kpiW2 - 16 })
        doc.fillColor(BLACK).fontSize(12).font('Helvetica-Bold').text(k.value, kx + 8, y + 20, { width: kpiW2 - 16 })
      })
      doc.fillColor(BLACK)
      y += 56

      // Table
      const cols2 = [90, 180, 80, 90]
      const headers2 = ['Data', 'Loja', 'Pedidos', 'Receita']
      let x2 = 40
      doc.rect(40, y, doc.page.width - 80, 18).fill(BLUE)
      doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold')
      headers2.forEach((h, i) => { doc.text(h, x2 + 4, y + 5, { width: cols2[i] - 4 }); x2 += cols2[i] })
      y += 18

      const maxRows2 = Math.min(rows.length, 30)
      for (let ri = 0; ri < maxRows2; ri++) {
        const r = rows[ri]
        if (y > doc.page.height - 80) { doc.addPage(); y = 40 }
        doc.rect(40, y, doc.page.width - 80, 16).fill(ri % 2 === 0 ? '#fff' : LIGHT)
        doc.fillColor(BLACK).fontSize(7.5).font('Helvetica')
        x2 = 40
        const cells2 = [r.date, r.store, String(r.orders), fmtR(r.revenue)]
        cells2.forEach((cell, i) => {
          doc.text(cell, x2 + 4, y + 4, { width: cols2[i] - 8, lineBreak: false })
          x2 += cols2[i]
        })
        y += 16
      }
    }

    // Footer
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
        .text(`Página ${i - range.start + 1} de ${range.count}  ·  AdInsight`, 40, doc.page.height - 30, { align: 'center', width: doc.page.width - 80 })
    }

    doc.end()
  })
}
