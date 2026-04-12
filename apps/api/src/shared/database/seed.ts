/**
 * DEVELOPMENT SEED — NOT PRODUCTION DATA
 *
 * Populates the database with synthetic campaign data for local
 * development and demo purposes. Never run in production.
 *
 * Run with: pnpm --filter api db:seed
 *
 * Creates:
 *   - 5 business channels (matching production channel names)
 *   - 20 synthetic campaigns across META, GOOGLE, TIKTOK, PINTEREST
 *   - 90 days of generated metric_snapshots per campaign (~1,800 rows)
 *
 * Campaign names follow the [PLATFORM | Channel | Objective] convention.
 * These are NOT real campaigns. All have external_id prefixed with "seed_".
 */
import 'dotenv/config'
import { db } from './client'

// ── Channels ─────────────────────────────────────────────────────────────────

const CHANNELS = [
  { name: 'Loja das Profs',           description: 'Campanhas de tráfego e conversão para lojadasprofs.com.br', color: '#10B981', keywords: ['loja', 'lojadasprofs', 'loja-profs', 'loja das profs'] },
  { name: 'Clube das Profs',          description: 'Campanhas de assinatura anual do Clube das Profs',           color: '#6366F1', keywords: ['clube', 'clubedasprofs', 'clube-profs', 'assinatura'] },
  { name: 'Tudo de Prof',             description: 'Campanhas do marketplace Tudo de Prof',                       color: '#F59E0B', keywords: ['tudodeprof', 'tudo de prof', 'marketplace', 'tdp'] },
  { name: 'Mentoria Do Giz ao Digital', description: 'Campanhas de captação para a mentoria',                    color: '#EC4899', keywords: ['mentoria', 'giz', 'digital', 'dgd', 'giz ao digital'] },
  { name: 'Lançamentos',              description: 'Canais temporários criados por evento de lançamento',         color: '#8B5CF6', keywords: ['lancamento', 'lançamento', 'evento', 'curso'] },
]

// ── Campaign definitions ──────────────────────────────────────────────────────

// Profile: base metrics per day; actual values will be varied by seeded RNG
interface CampaignProfile {
  name: string
  platform: string
  channel: string
  objective: string
  dailyBudgetCents: number
  // Base daily metrics (will be varied ±30%)
  baseImpressions: number
  baseClicks: number
  baseLeads: number
  basePurchases: number
  baseRevenueCents: number
}

const CAMPAIGN_PROFILES: CampaignProfile[] = [
  // META
  { name: 'META | Loja das Profs | Conversão', platform: 'META', channel: 'Loja das Profs', objective: 'SALES', dailyBudgetCents: 5000_00, baseImpressions: 12000, baseClicks: 480, baseLeads: 24, basePurchases: 8, baseRevenueCents: 160000 },
  { name: 'META | Loja das Profs | Tráfego',   platform: 'META', channel: 'Loja das Profs', objective: 'TRAFFIC', dailyBudgetCents: 3000_00, baseImpressions: 20000, baseClicks: 900, baseLeads: 15, basePurchases: 4, baseRevenueCents: 80000 },
  { name: 'META | Clube das Profs | Leads',    platform: 'META', channel: 'Clube das Profs', objective: 'LEADS', dailyBudgetCents: 4000_00, baseImpressions: 8000, baseClicks: 280, baseLeads: 35, basePurchases: 6, baseRevenueCents: 120000 },
  { name: 'META | Mentoria | Leads',           platform: 'META', channel: 'Mentoria Do Giz ao Digital', objective: 'LEADS', dailyBudgetCents: 6000_00, baseImpressions: 10000, baseClicks: 220, baseLeads: 18, basePurchases: 3, baseRevenueCents: 150000 },
  { name: 'META | Lançamentos | Conversão',    platform: 'META', channel: 'Lançamentos', objective: 'SALES', dailyBudgetCents: 12000_00, baseImpressions: 25000, baseClicks: 750, baseLeads: 60, basePurchases: 15, baseRevenueCents: 450000 },
  // GOOGLE
  { name: 'GOOGLE | Loja das Profs | Search',  platform: 'GOOGLE', channel: 'Loja das Profs', objective: 'TRAFFIC', dailyBudgetCents: 2500_00, baseImpressions: 5000, baseClicks: 700, baseLeads: 20, basePurchases: 7, baseRevenueCents: 140000 },
  { name: 'GOOGLE | Tudo de Prof | Shopping',  platform: 'GOOGLE', channel: 'Tudo de Prof', objective: 'SALES', dailyBudgetCents: 3500_00, baseImpressions: 8000, baseClicks: 500, baseLeads: 12, basePurchases: 10, baseRevenueCents: 200000 },
  { name: 'GOOGLE | Clube das Profs | Display', platform: 'GOOGLE', channel: 'Clube das Profs', objective: 'AWARENESS', dailyBudgetCents: 1500_00, baseImpressions: 40000, baseClicks: 200, baseLeads: 8, basePurchases: 2, baseRevenueCents: 40000 },
  { name: 'GOOGLE | Mentoria | Search',        platform: 'GOOGLE', channel: 'Mentoria Do Giz ao Digital', objective: 'LEADS', dailyBudgetCents: 4000_00, baseImpressions: 3500, baseClicks: 420, baseLeads: 22, basePurchases: 4, baseRevenueCents: 200000 },
  { name: 'GOOGLE | Lançamentos | Search',     platform: 'GOOGLE', channel: 'Lançamentos', objective: 'SALES', dailyBudgetCents: 8000_00, baseImpressions: 6000, baseClicks: 800, baseLeads: 45, basePurchases: 12, baseRevenueCents: 360000 },
  // TIKTOK
  { name: 'TIKTOK | Loja das Profs | Vídeo',   platform: 'TIKTOK', channel: 'Loja das Profs', objective: 'TRAFFIC', dailyBudgetCents: 2000_00, baseImpressions: 35000, baseClicks: 1200, baseLeads: 18, basePurchases: 5, baseRevenueCents: 100000 },
  { name: 'TIKTOK | Clube das Profs | Leads',  platform: 'TIKTOK', channel: 'Clube das Profs', objective: 'LEADS', dailyBudgetCents: 2500_00, baseImpressions: 28000, baseClicks: 700, baseLeads: 28, basePurchases: 4, baseRevenueCents: 80000 },
  { name: 'TIKTOK | Mentoria | Awareness',     platform: 'TIKTOK', channel: 'Mentoria Do Giz ao Digital', objective: 'AWARENESS', dailyBudgetCents: 1800_00, baseImpressions: 60000, baseClicks: 900, baseLeads: 10, basePurchases: 2, baseRevenueCents: 100000 },
  { name: 'TIKTOK | Lançamentos | Vídeo',      platform: 'TIKTOK', channel: 'Lançamentos', objective: 'ENGAGEMENT', dailyBudgetCents: 5000_00, baseImpressions: 80000, baseClicks: 2500, baseLeads: 55, basePurchases: 10, baseRevenueCents: 300000 },
  { name: 'TIKTOK | Tudo de Prof | Vídeo',     platform: 'TIKTOK', channel: 'Tudo de Prof', objective: 'TRAFFIC', dailyBudgetCents: 1500_00, baseImpressions: 22000, baseClicks: 600, baseLeads: 8, basePurchases: 3, baseRevenueCents: 60000 },
  // PINTEREST
  { name: 'PINTEREST | Loja das Profs | Shopping', platform: 'PINTEREST', channel: 'Loja das Profs', objective: 'SALES', dailyBudgetCents: 1200_00, baseImpressions: 18000, baseClicks: 300, baseLeads: 6, basePurchases: 4, baseRevenueCents: 80000 },
  { name: 'PINTEREST | Clube das Profs | Promoted', platform: 'PINTEREST', channel: 'Clube das Profs', objective: 'TRAFFIC', dailyBudgetCents: 800_00, baseImpressions: 14000, baseClicks: 180, baseLeads: 5, basePurchases: 2, baseRevenueCents: 40000 },
  { name: 'PINTEREST | Lançamentos | Promoted', platform: 'PINTEREST', channel: 'Lançamentos', objective: 'AWARENESS', dailyBudgetCents: 2000_00, baseImpressions: 30000, baseClicks: 400, baseLeads: 12, basePurchases: 5, baseRevenueCents: 150000 },
  { name: 'PINTEREST | Tudo de Prof | Shopping', platform: 'PINTEREST', channel: 'Tudo de Prof', objective: 'SALES', dailyBudgetCents: 1000_00, baseImpressions: 12000, baseClicks: 250, baseLeads: 5, basePurchases: 3, baseRevenueCents: 60000 },
  { name: 'PINTEREST | Mentoria | Promoted',   platform: 'PINTEREST', channel: 'Mentoria Do Giz ao Digital', objective: 'LEADS', dailyBudgetCents: 1500_00, baseImpressions: 10000, baseClicks: 150, baseLeads: 8, basePurchases: 2, baseRevenueCents: 100000 },
]

// ── Simple seeded PRNG (mulberry32) ──────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// ── Main seed ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Iniciando seed...\n')

  // 1. Channels
  console.log('📂 Canais de negócio:')
  const channelIds: Record<string, string> = {}
  for (const ch of CHANNELS) {
    const { rows } = await db.query(`SELECT id FROM business_channels WHERE name = $1`, [ch.name])
    if (rows.length > 0) {
      channelIds[ch.name] = rows[0].id
      console.log(`  ⏭️  "${ch.name}" já existe`)
    } else {
      const { rows: ins } = await db.query(
        `INSERT INTO business_channels (name, description, color, keywords) VALUES ($1,$2,$3,$4) RETURNING id`,
        [ch.name, ch.description, ch.color, ch.keywords],
      )
      channelIds[ch.name] = ins[0].id
      console.log(`  ✅ "${ch.name}" criado`)
    }
  }

  // 2. Platform IDs
  const { rows: platforms } = await db.query(`SELECT id, type FROM ad_platforms`)
  const platformIds: Record<string, string> = {}
  for (const p of platforms) platformIds[p.type] = p.id

  // 3. Campaigns + metric_snapshots
  console.log('\n📊 Campanhas e métricas:')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = addDays(today, -90)

  for (let i = 0; i < CAMPAIGN_PROFILES.length; i++) {
    const profile = CAMPAIGN_PROFILES[i]
    const rng = mulberry32(i * 1000 + 42)

    // Check if campaign already exists
    const platformId = platformIds[profile.platform]
    const externalId = `seed_${profile.platform.toLowerCase()}_${i + 1}`

    const { rows: existing } = await db.query(
      `SELECT id FROM campaigns WHERE platform_id = $1 AND external_id = $2`,
      [platformId, externalId],
    )

    let campaignId: string
    if (existing.length > 0) {
      campaignId = existing[0].id
      console.log(`  ⏭️  "${profile.name}" já existe`)
    } else {
      const { rows: ins } = await db.query(
        `INSERT INTO campaigns (platform_id, external_id, name, channel_id, objective, status, daily_budget_cents, started_at)
         VALUES ($1,$2,$3,$4,$5::campaign_objective,$6::campaign_status,$7,$8) RETURNING id`,
        [
          platformId,
          externalId,
          profile.name,
          channelIds[profile.channel],
          profile.objective,
          'ACTIVE',
          profile.dailyBudgetCents,
          toISODate(startDate),
        ],
      )
      campaignId = ins[0].id
      console.log(`  ✅ "${profile.name}"`)
    }

    // Generate 90 days of metric_snapshots
    const snapshotValues: unknown[][] = []
    for (let d = 0; d < 90; d++) {
      const date = addDays(startDate, d)
      const dayOfWeek = date.getDay() // 0=Sun, 5=Fri, 6=Sat

      // Sazonalidade: sexta/sábado +30%, segunda -20%, resto neutro
      const dayMult = dayOfWeek === 5 || dayOfWeek === 6 ? 1.3
        : dayOfWeek === 1 ? 0.8
        : 1.0

      // Variação aleatória ±30%
      const vary = (base: number) => Math.max(0, Math.round(base * dayMult * (0.7 + rng() * 0.6)))

      const impressions  = vary(profile.baseImpressions)
      const clicks       = Math.min(vary(profile.baseClicks), impressions)
      const leads        = vary(profile.baseLeads)
      const purchases    = vary(profile.basePurchases)
      const spendCents   = vary(profile.dailyBudgetCents)
      const revenueCents = vary(profile.baseRevenueCents)

      snapshotValues.push([campaignId, toISODate(date), impressions, clicks, spendCents, leads, purchases, revenueCents])
    }

    // Batch insert with ON CONFLICT DO NOTHING (idempotent)
    for (const row of snapshotValues) {
      await db.query(
        `INSERT INTO metric_snapshots (campaign_id, snapshot_date, impressions, clicks, spend_cents, leads, purchases, revenue_cents)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (campaign_id, snapshot_date) DO NOTHING`,
        row,
      )
    }
  }

  console.log('\n✅ Seed concluído')
  await db.end()
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err)
  process.exit(1)
})
