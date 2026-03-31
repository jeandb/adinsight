import Redis from 'ioredis'
import { Queue } from 'bullmq'
import { env } from '../../config/env'

if (!env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL não configurado — filas de sync desabilitadas')
}

export const redisConnection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false })
  : null

export const syncCampaignsQueue = redisConnection
  ? new Queue<SyncJobData>('sync-campaigns', { connection: redisConnection })
  : null

export const evaluateAlertsQueue = redisConnection
  ? new Queue('evaluate-alerts', { connection: redisConnection })
  : null

export interface SyncJobData {
  platformType: string
  triggeredBy: 'scheduler' | 'manual'
  daysBack?: number  // number of days of history to sync (default: 7)
}

export async function addSyncJob(
  platformType: string,
  triggeredBy: 'scheduler' | 'manual' = 'manual',
  daysBack?: number,
): Promise<void> {
  if (!syncCampaignsQueue) {
    console.warn('⚠️  Queue não disponível — REDIS_URL não configurado')
    return
  }
  await syncCampaignsQueue.add('sync', { platformType, triggeredBy, daysBack }, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 30_000 },
  })
}
