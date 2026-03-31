import { syncCampaignsQueue, evaluateAlertsQueue, syncWooQueue, aiAnalysisQueue, sendReportQueue } from '../shared/queue/queue.client'

const PLATFORMS = ['META', 'GOOGLE', 'TIKTOK', 'PINTEREST'] as const

export async function initScheduler(): Promise<void> {
  if (!syncCampaignsQueue || !evaluateAlertsQueue || !syncWooQueue || !aiAnalysisQueue || !sendReportQueue) {
    console.warn('⚠️  Scheduler desabilitado — REDIS_URL não configurado')
    return
  }

  // Remove existing repeatable jobs to avoid duplicates on restart
  const [existingSync, existingAlerts, existingWoo, existingAi, existingReports] = await Promise.all([
    syncCampaignsQueue.getRepeatableJobs(),
    evaluateAlertsQueue.getRepeatableJobs(),
    syncWooQueue.getRepeatableJobs(),
    aiAnalysisQueue.getRepeatableJobs(),
    sendReportQueue.getRepeatableJobs(),
  ])
  for (const job of existingSync)    await syncCampaignsQueue.removeRepeatableByKey(job.key)
  for (const job of existingAlerts)  await evaluateAlertsQueue.removeRepeatableByKey(job.key)
  for (const job of existingWoo)     await syncWooQueue.removeRepeatableByKey(job.key)
  for (const job of existingAi)      await aiAnalysisQueue.removeRepeatableByKey(job.key)
  for (const job of existingReports) await sendReportQueue.removeRepeatableByKey(job.key)

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

  // WooCommerce sync every 6 hours
  await syncWooQueue.add(
    'sync-all',
    { triggeredBy: 'scheduler', daysBack: 30 },
    {
      repeat: { pattern: '0 */6 * * *' }, // every 6 hours
      jobId: 'scheduler-woo-sync-all',
    },
  )

  // Daily AI analysis at 07:00
  await aiAnalysisQueue.add(
    'daily-analysis',
    { triggeredBy: 'scheduler' },
    {
      repeat: { pattern: '0 7 * * *' }, // every day at 07:00
      jobId: 'scheduler-ai-daily-analysis',
    },
  )

  // Check and send due scheduled reports every hour at :30
  await sendReportQueue.add(
    'check-due',
    { triggeredBy: 'scheduler' },
    {
      repeat: { pattern: '30 * * * *' },
      jobId: 'scheduler-send-due-reports',
    },
  )

  console.log('🗓️  Scheduler registrado — sync/hora + alertas 30min + WooCommerce 6h + IA 07h00 + relatórios :30/hora')
}
