import * as XLSX from 'xlsx'
import crypto from 'crypto'
import type { WooOrderData, WooOrderStatus } from './woo-stores.types'

// ─── Column name aliases (case-insensitive) ───────────────────────────────────

const DATE_ALIASES    = ['data', 'date', 'data_pedido', 'order_date', 'data do pedido', 'data venda', 'dt_venda']
const AMOUNT_ALIASES  = ['valor', 'total', 'amount', 'receita', 'faturamento', 'total_pedido', 'valor_total', 'price', 'preco', 'preço']
const EMAIL_ALIASES   = ['email', 'cliente', 'customer_email', 'email_cliente', 'e-mail', 'comprador']
const STATUS_ALIASES  = ['status', 'situação', 'situacao', 'estado']
const ID_ALIASES      = ['id', 'pedido', 'order_id', 'numero', 'número', 'num_pedido', 'external_id', 'cod_pedido']

function findColumn(headers: string[], aliases: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim())
  for (const alias of aliases) {
    const idx = lower.indexOf(alias)
    if (idx !== -1) return headers[idx]
  }
  return null
}

/** Parse a Brazilian or international currency string to cents */
function parseToCents(raw: unknown): number {
  if (raw == null) return 0
  const s = String(raw)
    .replace(/R\$\s*/gi, '')
    .replace(/\s/g, '')
    .trim()

  // Detect BRL format: 1.234,56 vs EN format: 1,234.56
  const hasBrlComma = /\d,\d{1,2}$/.test(s)  // ends with ,XX
  const value = hasBrlComma
    ? parseFloat(s.replace(/\./g, '').replace(',', '.'))
    : parseFloat(s.replace(/,/g, ''))

  return isNaN(value) ? 0 : Math.round(value * 100)
}

/** Parse a date string to ISO format (YYYY-MM-DDTHH:mm:ssZ) */
function parseDate(raw: unknown): string {
  if (raw == null) return new Date().toISOString()

  // Excel serial date number
  if (typeof raw === 'number') {
    const date = XLSX.SSF.parse_date_code(raw)
    if (date) {
      const d = new Date(Date.UTC(date.y, date.m - 1, date.d))
      return d.toISOString()
    }
  }

  const s = String(raw).trim()

  // Common BR formats: dd/mm/yyyy or dd-mm-yyyy
  const brDate = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (brDate) {
    const [, d, m, y] = brDate
    const year = y.length === 2 ? `20${y}` : y
    const date = new Date(Date.UTC(parseInt(year), parseInt(m) - 1, parseInt(d)))
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  const parsed = new Date(s)
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function parseStatus(raw: unknown): WooOrderStatus {
  if (raw == null) return 'completed'
  const s = String(raw).toLowerCase().trim()
  const map: Record<string, WooOrderStatus> = {
    completed:   'completed',
    concluido:   'completed',
    concluído:   'completed',
    pago:        'completed',
    aprovado:    'completed',
    processing:  'processing',
    processando: 'processing',
    pending:     'pending',
    pendente:    'pending',
    cancelled:   'cancelled',
    cancelado:   'cancelled',
    refunded:    'refunded',
    reembolsado: 'refunded',
    failed:      'failed',
    falhou:      'failed',
  }
  return map[s] ?? 'completed'
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export function parseFileToOrders(buffer: Buffer, filename: string): WooOrderData[] {
  const ext = filename.split('.').pop()?.toLowerCase()

  let rows: Record<string, unknown>[]

  if (ext === 'csv') {
    const workbook = XLSX.read(buffer, { type: 'buffer', raw: false, dateNF: 'yyyy-mm-dd' })
    const sheet    = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  } else {
    // .xlsx / .xls
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheet    = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  }

  if (!rows.length) return []

  const headers = Object.keys(rows[0])
  const colDate   = findColumn(headers, DATE_ALIASES)
  const colAmount = findColumn(headers, AMOUNT_ALIASES)
  const colEmail  = findColumn(headers, EMAIL_ALIASES)
  const colStatus = findColumn(headers, STATUS_ALIASES)
  const colId     = findColumn(headers, ID_ALIASES)

  if (!colAmount) {
    throw new Error(
      `Coluna de valor não encontrada. Esperado: ${AMOUNT_ALIASES.slice(0, 4).join(', ')}. ` +
      `Colunas encontradas: ${headers.join(', ')}`,
    )
  }

  return rows
    .filter((row) => {
      const amount = parseToCents(colAmount ? row[colAmount] : null)
      return amount > 0
    })
    .map((row) => ({
      externalId:    colId && row[colId] != null ? String(row[colId]) : crypto.randomUUID(),
      status:        parseStatus(colStatus ? row[colStatus] : null),
      customerEmail: colEmail && row[colEmail] != null ? String(row[colEmail]) : null,
      totalCents:    parseToCents(colAmount ? row[colAmount] : null),
      paidAt:        colDate && row[colDate] != null ? parseDate(row[colDate]) : null,
      orderDate:     colDate && row[colDate] != null ? parseDate(row[colDate]) : new Date().toISOString(),
    }))
}

/** Returns a CSV template as a Buffer for download */
export function generateImportTemplate(): Buffer {
  const header = 'data,valor,email,status,id_pedido\n'
  const example = [
    '15/01/2024,97.00,cliente@email.com,completed,1001',
    '16/01/2024,"R$ 197,00",outro@email.com,completed,1002',
    '17/01/2024,47.00,,completed,1003',
  ].join('\n')
  return Buffer.from(header + example, 'utf-8')
}
