import { syncCampaignsQueue } from '../shared/queue/queue.client'

const PLATFORMS = ['META', 'GOOGLE', 'TIKTOK', 'PINTEREST'] as const

export async function initScheduler(): Promise<void> {
  if (!syncCampaignsQueue) {
    console.warn('⚠️  Scheduler desabilitado — REDIS_URL não configurado')
    return
  }

  // Remove existing repeatable jobs to avoid duplicates on restart
  const existing = await syncCampaignsQueue.getRepeatableJobs()
  for (const job of existing) {
    await syncCampaignsQueue.removeRepeatableByKey(job.key)
  }

  // Register one repeatable job per platform (every hour)
  for (const platform of PLATFORMS) {
    await syncCampaignsQueue.add(
      'sync',
      { platformType: platform, triggeredBy: 'scheduler' },
      {
        repeat: { pattern: '0 * * * *' }, // every hour at :00
        jobId: `scheduler-${platform}`,
      },
    )
  }

  console.log('🗓️  Scheduler registrado — sync a cada hora por plataforma')
}
