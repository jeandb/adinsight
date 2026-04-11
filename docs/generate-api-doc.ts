import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

const OUT = path.resolve(__dirname, 'AdInsight_Google_Ads_API_Design_Documentation.pdf')

const BLUE   = '#1a56db'
const DARK   = '#111827'
const GRAY   = '#6b7280'
const LIGHT  = '#f0f4ff'
const WHITE  = '#ffffff'
const LINE   = '#e5e7eb'

const doc = new PDFDocument({ size: 'A4', margin: 56, bufferPages: true })
const out  = fs.createWriteStream(OUT)
doc.pipe(out)

// ─── helpers ──────────────────────────────────────────────────────────────────
function h1(text: string) {
  doc.moveDown(0.5)
  doc.fontSize(18).font('Helvetica-Bold').fillColor(BLUE).text(text)
  doc.moveDown(0.3)
  doc.rect(56, doc.y, doc.page.width - 112, 2).fill(BLUE)
  doc.fillColor(DARK).moveDown(0.6)
}

function h2(text: string) {
  doc.moveDown(0.4)
  doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text(text)
  doc.moveDown(0.25)
}

function body(text: string) {
  doc.fontSize(10).font('Helvetica').fillColor(DARK).text(text, { lineGap: 3 })
  doc.moveDown(0.3)
}

function bullet(items: string[]) {
  for (const item of items) {
    doc.fontSize(10).font('Helvetica').fillColor(DARK)
       .text(`• ${item}`, { indent: 16, lineGap: 3 })
  }
  doc.moveDown(0.3)
}

function infoBox(label: string, value: string) {
  const bx = 56, bw = doc.page.width - 112
  doc.rect(bx, doc.y, bw, 28).fill(LIGHT)
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text(label, bx + 10, doc.y - 22)
  doc.fontSize(10).font('Helvetica').fillColor(DARK).text(value, bx + 10, doc.y - 12, { width: bw - 20 })
  doc.moveDown(0.6)
}

function table(headers: string[], rows: string[][], colWidths: number[]) {
  const x0 = 56, rowH = 22
  let y = doc.y
  const totalW = colWidths.reduce((a, b) => a + b, 0)

  // header row
  doc.rect(x0, y, totalW, rowH).fill(BLUE)
  let cx = x0
  for (let i = 0; i < headers.length; i++) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE)
       .text(headers[i], cx + 6, y + 7, { width: colWidths[i] - 8, lineBreak: false })
    cx += colWidths[i]
  }
  y += rowH

  // data rows
  for (let ri = 0; ri < rows.length; ri++) {
    doc.rect(x0, y, totalW, rowH).fill(ri % 2 === 0 ? WHITE : LIGHT)
    cx = x0
    for (let ci = 0; ci < rows[ri].length; ci++) {
      doc.fontSize(9).font('Helvetica').fillColor(DARK)
         .text(rows[ri][ci], cx + 6, y + 7, { width: colWidths[ci] - 8, lineBreak: false })
      cx += colWidths[ci]
    }
    // bottom border
    doc.rect(x0, y, totalW, rowH).stroke(LINE)
    y += rowH
  }
  doc.y = y + 8
  doc.moveDown(0.4)
}

// ─── Cover ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 180).fill(BLUE)
doc.fillColor(WHITE).fontSize(28).font('Helvetica-Bold').text('AdInsight', 56, 48)
doc.fontSize(14).font('Helvetica').text('Google Ads API — Tool Design Documentation', 56, 82)
doc.fontSize(10).text('Prepared for Google Ads API Basic Access Application', 56, 108)
doc.fontSize(9).fillColor('#bfdbfe').text(`Document date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 56, 130)
doc.fillColor(DARK)
doc.y = 200

// ─── 1. Tool Overview ─────────────────────────────────────────────────────────
h1('1. Tool Overview')

infoBox('Tool Name', 'AdInsight')
infoBox('Tool Type', 'Internal SaaS dashboard — single-tenant, private use')
infoBox('Organization', 'Prof Jaque Mendes — Content Creator & Digital Educator')
infoBox('Primary Users', 'Business owner and her traffic management team (2–5 users)')

body(
  'AdInsight is a private, internal business intelligence dashboard developed exclusively for ' +
  'Prof Jaque Mendes, a Brazilian digital educator and content creator who sells pedagogical ' +
  'products through WooCommerce stores and runs paid advertising campaigns across multiple platforms ' +
  'including Google Ads, Meta Ads, TikTok Ads, and Pinterest Ads.',
)
body(
  'The tool centralizes advertising performance data, e-commerce revenue, and AI-powered analysis ' +
  'in a single interface, replacing manual spreadsheet reporting. It is not a public product, ' +
  'not sold to third parties, and not distributed in any form.',
)

// ─── 2. Purpose of Google Ads API Usage ───────────────────────────────────────
h1('2. Purpose of Google Ads API Usage')

h2('2.1 Why Google Ads API is Needed')
body(
  'AdInsight uses the Google Ads API exclusively to retrieve campaign performance data from the ' +
  "advertiser's own Google Ads account. The goal is to consolidate this data alongside Meta, TikTok, " +
  'and Pinterest campaign data into a unified dashboard, eliminating the need to log into each ' +
  'platform separately.',
)

h2('2.2 Specific API Operations')
table(
  ['API Operation', 'Purpose', 'Frequency'],
  [
    ['GoogleAdsService.SearchStream', 'Fetch campaigns list with status, budget, objective', 'Hourly (scheduled)'],
    ['GoogleAdsService.SearchStream', 'Fetch daily performance metrics per campaign', 'Hourly (scheduled)'],
    ['CustomerService.ListAccessibleCustomers', 'Verify account access on connection test', 'On demand'],
  ],
  [230, 200, 100],
)

h2('2.3 Data Retrieved')
bullet([
  'Campaign names, IDs, statuses (ENABLED, PAUSED, REMOVED)',
  'Daily metrics: impressions, clicks, cost (spend), conversions, conversion value',
  'Campaign objectives / advertising channel types',
  'Date ranges: last 7 days by default, configurable up to 90 days',
])

h2('2.4 What the API is NOT Used For')
bullet([
  'Creating, modifying, or deleting campaigns or ad groups',
  'Managing bids or budgets',
  'Accessing data from any account other than the advertiser\'s own',
  'Reselling, sharing, or redistributing data to third parties',
  'Any automated bidding or campaign optimization actions',
])

// ─── 3. Architecture ──────────────────────────────────────────────────────────
doc.addPage()
h1('3. System Architecture')

h2('3.1 Architecture Overview')
body(
  'AdInsight follows a three-tier architecture running entirely on private infrastructure:',
)
bullet([
  'Frontend: React + TypeScript single-page application (private URL, authenticated access only)',
  'Backend API: Node.js + Express + TypeScript REST API',
  'Data layer: PostgreSQL database (campaign data cached locally) + Redis (job queue)',
])

h2('3.2 Google Ads Integration Flow')
const flowSteps = [
  ['1', 'Admin enters OAuth 2.0 credentials via the Admin → Integrations panel'],
  ['2', 'Credentials (Client ID, Client Secret, Refresh Token, Developer Token) are stored AES-256-GCM encrypted in PostgreSQL'],
  ['3', 'A BullMQ scheduled job runs every hour per platform'],
  ['4', 'The Google Ads adapter calls the API using the stored credentials'],
  ['5', 'Retrieved campaigns and metrics are upserted into the local PostgreSQL cache'],
  ['6', 'Dashboard queries the local cache — no live API calls during user page loads'],
  ['7', 'WebSocket events notify the frontend when sync completes'],
]
table(
  ['Step', 'Action'],
  flowSteps,
  [40, 450],
)

h2('3.3 Security Measures')
bullet([
  'All API credentials encrypted at rest using AES-256-GCM before database storage',
  'Credentials never logged, never returned in API responses (masked as ••••••••)',
  'JWT authentication required for all dashboard access (8-hour access tokens)',
  'Role-based access control — only ADMIN role can view or manage integrations',
  'HTTPS enforced in production; CORS restricted to the frontend origin',
  'No credentials stored in environment variables or source code',
])

// ─── 4. Data Handling ─────────────────────────────────────────────────────────
h1('4. Data Handling & Privacy')

h2('4.1 Data Storage')
body(
  'Retrieved Google Ads data is stored in a private PostgreSQL database accessible only to ' +
  'the AdInsight application server. The database runs on private infrastructure controlled ' +
  'exclusively by the tool owner.',
)

h2('4.2 Data Retention')
bullet([
  'Campaign and metric data is stored indefinitely for historical analysis',
  'No data is shared with or transmitted to any third-party service',
  'Data is used solely for internal reporting and analysis by the business owner and her team',
])

h2('4.3 Access Control')
bullet([
  'Access to the dashboard requires email/password authentication',
  'User roles: Admin (full access), Traffic Manager (operational), Director (read-only executive view), Viewer (read-only)',
  'Maximum 5 user accounts — internal team only',
  'No public registration or open access',
])

// ─── 5. User Workflow ─────────────────────────────────────────────────────────
h1('5. User Workflow & Interface')

h2('5.1 Primary Use Cases')
bullet([
  'View consolidated KPI dashboard: total ad spend, impressions, clicks, CTR, CPC, leads, ROAS',
  'Compare campaign performance across Google Ads, Meta, TikTok, and Pinterest in one view',
  'Filter by date range, platform, business channel, or campaign objective',
  'Identify top-performing and underperforming campaigns via ranked tables',
  'Cross-reference ad spend with WooCommerce revenue to calculate real ROAS',
  'Receive automated alerts when key metrics exceed configured thresholds',
  'Export reports as PDF, Excel, or CSV for stakeholder review',
])

h2('5.2 Admin Workflow for Google Ads Setup')
bullet([
  'Admin navigates to Admin → Integrations → Google',
  'Enters Developer Token, OAuth Client ID, Client Secret, and Refresh Token',
  'Clicks "Test Connection" — AdInsight calls CustomerService.ListAccessibleCustomers to validate',
  'On success, the integration is activated and the hourly sync scheduler begins',
  'Admin can trigger a manual sync at any time via the "Sync Now" button',
])

// ─── 6. Technical Specifications ──────────────────────────────────────────────
doc.addPage()
h1('6. Technical Specifications')

table(
  ['Component', 'Technology'],
  [
    ['Backend runtime',       'Node.js 20 + TypeScript'],
    ['Backend framework',     'Express.js'],
    ['Google Ads SDK',        'google-ads-api (npm) — official Google Ads API client'],
    ['Database',              'PostgreSQL 16'],
    ['Job queue',             'Redis 7 + BullMQ'],
    ['Frontend',              'React 18 + TypeScript + Vite'],
    ['Authentication',        'JWT (bcrypt passwords, AES-256-GCM encrypted credentials)'],
    ['Deployment',            'Private server / VPS — single-tenant'],
    ['API version targeted',  'Google Ads API v17'],
  ],
  [220, 270],
)

h2('6.1 API Call Volume Estimate')
body(
  'Given the single-advertiser, internal nature of the tool, API call volume is minimal:',
)
bullet([
  'Hourly sync: ~2 API calls per sync (campaigns + metrics) = ~48 calls/day',
  'Manual syncs: estimated 5–10 additional calls/day',
  'Connection tests: occasional, estimated <5/day',
  'Total estimated daily calls: <100',
  'The tool accesses a single Google Ads account (no MCC multi-account traversal)',
])

// ─── 7. Compliance ────────────────────────────────────────────────────────────
h1('7. Compliance & Policy Adherence')

bullet([
  'Data is used solely for the advertiser\'s own reporting — no cross-advertiser data access',
  'No automated campaign management, bid changes, or budget modifications',
  'No data resale, data brokering, or sharing with unauthorized parties',
  'API credentials are stored securely and never exposed to end users',
  'The tool complies with Google Ads API Terms of Service regarding data usage',
  'User data is processed in accordance with LGPD (Brazilian General Data Protection Law)',
])

// ─── Footer ───────────────────────────────────────────────────────────────────
const range = doc.bufferedPageRange()
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i)
  const pageNum = i - range.start + 1
  doc.rect(0, doc.page.height - 36, doc.page.width, 36).fill('#f9fafb')
  doc.fontSize(8).font('Helvetica').fillColor(GRAY)
     .text(
       `AdInsight — Google Ads API Design Documentation  ·  Page ${pageNum} of ${range.count}  ·  Confidential`,
       56, doc.page.height - 22,
       { align: 'center', width: doc.page.width - 112 },
     )
}

doc.end()
out.on('finish', () => console.log(`✅ PDF gerado: ${OUT}`))
out.on('error',  (e) => { console.error('Erro:', e); process.exit(1) })
