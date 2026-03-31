import { syncCampaignsQueue, evaluateAlertsQueue } from '../shared/queue/queue.client'

const PLATFORMS = ['META', 'GOOGLE', 'TIKTOK', 'PINTEREST'] as const

export async function initScheduler(): Promise<void> {
  if (!syncCampaignsQueue || !evaluateAlertsQueue) {
    console.warn('⚠️  Scheduler desabilitado — REDIS_URL não configurado')
    return
  }

  // Remove existing repeatable jobs to avoid duplicates on restart
  const [existingSync, existingAlerts] = await Promise.all([
    syncCampaignsQueue.getRepeatableJobs(),
    evaluateAlertsQueue.getRepeatableJobs(),
  ])
  for (const job of existingSync)   await syncCampaignsQueue.removeRepeatableByKey(job.key)
  for (const job of existingAlerts) await evaluateAlertsQueue.removeRepeatableByKey(job.key)

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

  // Evaluate alert rules every 30 minutes (offset by 15 min from sync)
  await evaluateAlertsQueue.add(
    'evaluate',
    {},
    {
      repeat: { pattern: '15,45 * * * *' }, // :15 and :45 every hour
      jobId: 'scheduler-evaluate-alerts',
    },
  )

  console.log('🗓️  Scheduler registrado — sync/hora por plataforma + alertas a cada 30min')
}
