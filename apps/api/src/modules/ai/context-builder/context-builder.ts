import { db } from '../../../shared/database/client'

function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const contextBuilder = {
  async buildContext(): Promise<string> {
    const from = daysAgo(30)
    const to = yesterday()

    // KPIs
    const { rows: kpiRows } = await db.query<{
      impressions: string
      clicks: string
      spend_cents: string
      leads: string
      revenue_cents: string
    }>(
      `SELECT
        COALESCE(SUM(ms.impressions), 0)   AS impressions,
        COALESCE(SUM(ms.clicks), 0)        AS clicks,
        COALESCE(SUM(ms.spend_cents), 0)   AS spend_cents,
        COALESCE(SUM(ms.leads), 0)         AS leads,
        COALESCE(SUM(ms.revenue_cents), 0) AS revenue_cents
       FROM metric_snapshots ms
       WHERE ms.snapshot_date BETWEEN $1 AND $2`,
      [from, to],
    )

    // Top campaigns
    const { rows: campaignRows } = await db.query<{
      name: string
      platform_type: string
      channel_name: string | null
      spend_cents: string
      leads: string
      revenue_cents: string
    }>(
      `SELECT
        c.name,
        ap.type::text AS platform_type,
        bc.name AS channel_name,
        COALESCE(SUM(ms.spend_cents), 0)   AS spend_cents,
        COALESCE(SUM(ms.leads), 0)         AS leads,
        COALESCE(SUM(ms.revenue_cents), 0) AS revenue_cents
       FROM campaigns c
       JOIN ad_platforms ap ON ap.id = c.platform_id
       LEFT JOIN business_channels bc ON bc.id = c.channel_id
       LEFT JOIN metric_snapshots ms ON ms.campaign_id = c.id
         AND ms.snapshot_date BETWEEN $1 AND $2
       GROUP BY c.id, c.name, ap.type, bc.name
       HAVING SUM(COALESCE(ms.spend_cents, 0)) > 0
       ORDER BY SUM(ms.spend_cents) DESC
       LIMIT 15`,
      [from, to],
    )

    const kpi = kpiRows[0]
    const spendR = (parseInt(kpi.spend_cents) / 100).toFixed(2)
    const revenueR = (parseInt(kpi.revenue_cents) / 100).toFixed(2)
    const roas = parseInt(kpi.spend_cents) > 0
      ? (parseInt(kpi.revenue_cents) / parseInt(kpi.spend_cents)).toFixed(2)
      : '0'

    const campaignLines = campaignRows.map((c) => {
      const spend = (parseInt(c.spend_cents) / 100).toFixed(2)
      const campaignRoas = parseInt(c.spend_cents) > 0
        ? (parseInt(c.revenue_cents) / parseInt(c.spend_cents)).toFixed(2)
        : '0'
      return `- ${c.name} | ${c.platform_type} | Canal: ${c.channel_name ?? 'Sem canal'} | Gasto: R$${spend} | Leads: ${c.leads} | ROAS: ${campaignRoas}x`
    }).join('\n')

    return `## Dados do Dashboard AdInsight (últimos 30 dias: ${from} a ${to})

### KPIs Consolidados
- Investimento total: R$${spendR}
- Impressões: ${parseInt(kpi.impressions).toLocaleString('pt-BR')}
- Cliques: ${parseInt(kpi.clicks).toLocaleString('pt-BR')}
- Leads: ${parseInt(kpi.leads).toLocaleString('pt-BR')}
- Receita atribuída: R$${revenueR}
- ROAS médio: ${roas}x

### Top Campanhas por Investimento
${campaignLines || 'Nenhuma campanha com dados no período.'}

> Dados atualizados até ${to}. Use esses dados como base para sua análise.`
  },
}
