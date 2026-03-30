import { db } from '../../shared/database/client'
import type { PlatformRow, PlatformType, PlatformStatus } from './platforms.types'

export const platformsRepository = {
  async findAll(): Promise<PlatformRow[]> {
    const { rows } = await db.query<PlatformRow>(
      `SELECT * FROM ad_platforms ORDER BY type ASC`,
    )
    return rows
  },

  async findByType(type: PlatformType): Promise<PlatformRow | null> {
    const { rows } = await db.query<PlatformRow>(
      `SELECT * FROM ad_platforms WHERE type = $1`,
      [type],
    )
    return rows[0] ?? null
  },

  async saveCredentials(type: PlatformType, encrypted: string): Promise<PlatformRow> {
    const { rows } = await db.query<PlatformRow>(
      `UPDATE ad_platforms
       SET credentials_encrypted = $1, status = 'NOT_CONFIGURED', last_error = NULL
       WHERE type = $2 RETURNING *`,
      [encrypted, type],
    )
    return rows[0]
  },

  async updateStatus(
    type: PlatformType,
    status: PlatformStatus,
    lastError?: string,
  ): Promise<void> {
    await db.query(
      `UPDATE ad_platforms
       SET status = $1::platform_status,
           last_error = $2,
           last_sync_at = CASE WHEN $1::text = 'ACTIVE' THEN NOW() ELSE last_sync_at END
       WHERE type = $3::platform_type`,
      [status, lastError ?? null, type],
    )
  },

  async clearCredentials(type: PlatformType): Promise<PlatformRow> {
    const { rows } = await db.query<PlatformRow>(
      `UPDATE ad_platforms
       SET credentials_encrypted = NULL, status = 'NOT_CONFIGURED', last_error = NULL, last_sync_at = NULL
       WHERE type = $1 RETURNING *`,
      [type],
    )
    return rows[0]
  },
}
