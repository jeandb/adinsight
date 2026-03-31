import { db } from '../../shared/database/client'
import type {
  WooStoreRow,
  WooOrderRow,
  WooSubscriptionRow,
  WooStoreType,
  WooStoreStatus,
  WooOrderData,
  WooSubscriptionData,
} from './woo-stores.types'

export const wooStoresRepository = {
  // ─── Stores ──────────────────────────────────────────────────────────────

  async findAll(): Promise<WooStoreRow[]> {
    const { rows } = await db.query<WooStoreRow>(
      `SELECT * FROM woo_stores ORDER BY type ASC`,
    )
    return rows
  },

  async findByType(type: WooStoreType): Promise<WooStoreRow | null> {
    const { rows } = await db.query<WooStoreRow>(
      `SELECT * FROM woo_stores WHERE type = $1::woo_store_type`,
      [type],
    )
    return rows[0] ?? null
  },

  async saveCredentials(
    type: WooStoreType,
    consumerKeyEncrypted: string,
    consumerSecretEncrypted: string,
    channelId: string | null,
  ): Promise<WooStoreRow> {
    const { rows } = await db.query<WooStoreRow>(
      `UPDATE woo_stores
       SET consumer_key_encrypted    = $1,
           consumer_secret_encrypted = $2,
           channel_id = COALESCE($3::uuid, channel_id),
           status     = 'NOT_CONFIGURED',
           last_error = NULL
       WHERE type = $4::woo_store_type
       RETURNING *`,
      [consumerKeyEncrypted, consumerSecretEncrypted, channelId, type],
    )
    return rows[0]
  },

  async updateStatus(
    type: WooStoreType,
    status: WooStoreStatus,
    lastError?: string,
  ): Promise<void> {
    await db.query(
      `UPDATE woo_stores
       SET status       = $1::woo_store_status,
           last_error   = $2,
           last_sync_at = CASE WHEN $1::text = 'ACTIVE' THEN NOW() ELSE last_sync_at END
       WHERE type = $3::woo_store_type`,
      [status, lastError ?? null, type],
    )
  },

  async clearCredentials(type: WooStoreType): Promise<WooStoreRow> {
    const { rows } = await db.query<WooStoreRow>(
      `UPDATE woo_stores
       SET consumer_key_encrypted    = NULL,
           consumer_secret_encrypted = NULL,
           status     = 'NOT_CONFIGURED',
           last_error = NULL,
           last_sync_at = NULL
       WHERE type = $1::woo_store_type
       RETURNING *`,
      [type],
    )
    return rows[0]
  },

  // ─── Orders ──────────────────────────────────────────────────────────────

  async upsertOrders(storeId: string, orders: WooOrderData[]): Promise<void> {
    if (orders.length === 0) return

    for (const o of orders) {
      await db.query(
        `INSERT INTO woo_orders
           (store_id, external_id, status, customer_email, total_cents, paid_at, order_date)
         VALUES ($1, $2, $3::woo_order_status, $4, $5, $6, $7)
         ON CONFLICT (store_id, external_id) DO UPDATE SET
           status         = EXCLUDED.status,
           customer_email = EXCLUDED.customer_email,
           total_cents    = EXCLUDED.total_cents,
           paid_at        = EXCLUDED.paid_at,
           order_date     = EXCLUDED.order_date`,
        [
          storeId,
          o.externalId,
          o.status,
          o.customerEmail,
          o.totalCents,
          o.paidAt,
          o.orderDate,
        ],
      )
    }
  },

  async findOrders(params: {
    storeId?: string
    after?: string
    before?: string
    status?: string
    page: number
    limit: number
  }): Promise<{ rows: (WooOrderRow & { store_name: string; store_type: string })[]; total: number }> {
    const conditions: string[] = ['1=1']
    const values: unknown[] = []
    let i = 1

    if (params.storeId) { conditions.push(`o.store_id = $${i++}`); values.push(params.storeId) }
    if (params.after)   { conditions.push(`o.order_date >= $${i++}`); values.push(params.after) }
    if (params.before)  { conditions.push(`o.order_date <= $${i++}`); values.push(params.before) }
    if (params.status)  { conditions.push(`o.status = $${i++}::woo_order_status`); values.push(params.status) }

    const where = conditions.join(' AND ')
    const offset = (params.page - 1) * params.limit

    const [dataRes, countRes] = await Promise.all([
      db.query<WooOrderRow & { store_name: string; store_type: string }>(
        `SELECT o.*, s.name AS store_name, s.type AS store_type
         FROM woo_orders o
         JOIN woo_stores s ON s.id = o.store_id
         WHERE ${where}
         ORDER BY o.order_date DESC
         LIMIT $${i++} OFFSET $${i++}`,
        [...values, params.limit, offset],
      ),
      db.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM woo_orders o WHERE ${where}`,
        values,
      ),
    ])

    return { rows: dataRes.rows, total: parseInt(countRes.rows[0].total, 10) }
  },

  // ─── Subscriptions ────────────────────────────────────────────────────────

  async upsertSubscriptions(storeId: string, subs: WooSubscriptionData[]): Promise<void> {
    if (subs.length === 0) return

    for (const s of subs) {
      await db.query(
        `INSERT INTO woo_subscriptions
           (store_id, external_id, customer_email, status, plan_name, total_cents,
            billing_period, start_date, end_date, next_payment_date)
         VALUES ($1,$2,$3,$4::woo_subscription_status,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (store_id, external_id) DO UPDATE SET
           customer_email    = EXCLUDED.customer_email,
           status            = EXCLUDED.status,
           plan_name         = EXCLUDED.plan_name,
           total_cents       = EXCLUDED.total_cents,
           billing_period    = EXCLUDED.billing_period,
           start_date        = EXCLUDED.start_date,
           end_date          = EXCLUDED.end_date,
           next_payment_date = EXCLUDED.next_payment_date`,
        [
          storeId, s.externalId, s.customerEmail, s.status, s.planName,
          s.totalCents, s.billingPeriod, s.startDate, s.endDate, s.nextPaymentDate,
        ],
      )
    }
  },

  async countActiveSubscriptions(storeId: string): Promise<number> {
    const { rows } = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM woo_subscriptions
       WHERE store_id = $1 AND status = 'active'`,
      [storeId],
    )
    return parseInt(rows[0].count, 10)
  },
}
