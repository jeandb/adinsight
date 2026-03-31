import { db } from '../../shared/database/client'
import type { CampaignSyncData, MetricSyncData } from '../platforms/platforms.adapter.types'

const OBJECTIVE_MAP: Record<string, string> = {
  AWARENESS: 'AWARENESS',
  TRAFFIC: 'TRAFFIC',
  ENGAGEMENT: 'ENGAGEMENT',
  LEADS: 'LEADS',
  APP_PROMOTION: 'APP_PROMOTION',
  SALES: 'SALES',
}

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
}

function safeObjective(val: string): string {
  return OBJECTIVE_MAP[val.toUpperCase()] ?? 'TRAFFIC'
}

function safeStatus(val: string): string {
  return STATUS_MAP[val.toUpperCase()] ?? 'PAUSED'
}

export interface UnassignedCampaignRow {
  id: string
  name: string
  objective: string
  status: string
  platform_type: string
  last_synced_at: Date | null
}

export const campaignsRepository = {
  async upsertCampaign(
    platformId: string,
    data: CampaignSyncData,
    channelId?: string,
  ): Promise<{ id: string; externalId: string }> {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO campaigns (platform_id, external_id, name, channel_id, objective, status, daily_budget_cents, last_synced_at)
       VALUES ($1, $2, $3, $4, $5::campaign_objective, $6::campaign_status, $7, NOW())
       ON CONFLICT (platform_id, external_id) DO UPDATE
         SET name              = EXCLUDED.name,
             status            = EXCLUDED.status,
             daily_budget_cents = EXCLUDED.daily_budget_cents,
             last_synced_at    = NOW(),
             updated_at        = NOW()
       RETURNING id`,
      [
        platformId,
        data.externalId,
        data.name,
        channelId ?? null,
        safeObjective(data.objective),
        safeStatus(data.status),
        data.dailyBudgetCents,
      ],
    )
    return { id: rows[0].id, externalId: data.externalId }
  },

  async upsertMetricSnapshot(campaignId: string, data: MetricSyncData): Promise<void> {
    await db.query(
      `INSERT INTO metric_snapshots
         (campaign_id, snapshot_date, impressions, clicks, spend_cents, leads, purchases, revenue_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (campaign_id, snapshot_date) DO UPDATE
         SET impressions   = EXCLUDED.impressions,
             clicks        = EXCLUDED.clicks,
             spend_cents   = EXCLUDED.spend_cents,
             leads         = EXCLUDED.leads,
             purchases     = EXCLUDED.purchases,
             revenue_cents = EXCLUDED.revenue_cents,
             updated_at    = NOW()`,
      [
        campaignId,
        data.date,
        data.impressions,
        data.clicks,
        data.spendCents,
        data.leads,
        data.purchases,
        data.revenueCents,
      ],
    )
  },

  async getPlatformIdByType(platformType: string): Promise<string | null> {
    const { rows } = await db.query<{ id: string }>(
      `SELECT id FROM ad_platforms WHERE type = $1::platform_type`,
      [platformType],
    )
    return rows[0]?.id ?? null
  },

  /**
   * Auto-assigns the best-matching active channel by keyword lookup in the campaign name.
   * Only runs when channel_locked = FALSE and channel_id IS NULL.
   * Prefers the channel with the most keywords (most specific).
   */
  async autoAssignChannel(campaignId: string, campaignName: string): Promise<void> {
    await db.query(
      `UPDATE campaigns
       SET channel_id = (
         SELECT id
         FROM business_channels
         WHERE status = 'ACTIVE'
           AND EXISTS (
             SELECT 1 FROM unnest(keywords) AS kw
             WHERE length(kw) > 2
               AND lower($2) LIKE '%' || lower(kw) || '%'
           )
         ORDER BY cardinality(keywords) DESC
         LIMIT 1
       )
       WHERE id = $1
         AND channel_locked = FALSE
         AND channel_id IS NULL`,
      [campaignId, campaignName],
    )
  },

  /**
   * Manually assigns (or clears) a channel for a campaign.
   * Sets channel_locked = TRUE when assigning, FALSE when clearing.
   */
  async updateChannel(
    campaignId: string,
    channelId: string | null,
  ): Promise<{ id: string; channel_id: string | null; channel_locked: boolean } | null> {
    const { rows } = await db.query<{ id: string; channel_id: string | null; channel_locked: boolean }>(
      `UPDATE campaigns
       SET channel_id     = $1,
           channel_locked = $2,
           updated_at     = NOW()
       WHERE id = $3
       RETURNING id, channel_id, channel_locked`,
      [channelId, channelId !== null, campaignId],
    )
    return rows[0] ?? null
  },

  /**
   * Returns paginated campaigns that have no channel assigned.
   */
  async listUnassigned(
    page: number,
    limit: number,
  ): Promise<{ rows: UnassignedCampaignRow[]; total: number }> {
    const offset = (page - 1) * limit

    const [{ rows }, { rows: countRows }] = await Promise.all([
      db.query<UnassignedCampaignRow>(
        `SELECT
           c.id,
           c.name,
           c.objective,
           c.status,
           p.type AS platform_type,
           c.last_synced_at
         FROM campaigns c
         JOIN ad_platforms p ON p.id = c.platform_id
         WHERE c.channel_id IS NULL
         ORDER BY c.name ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      db.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM campaigns WHERE channel_id IS NULL`,
      ),
    ])

    return { rows, total: parseInt(countRows[0].count, 10) }
  },
}
