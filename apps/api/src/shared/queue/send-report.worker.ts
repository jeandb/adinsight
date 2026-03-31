import { Worker } from 'bullmq'
import { redisConnection } from './queue.client'
import { reportsService } from '../../modules/reports/reports.service'

export function startSendReportWorker(): void {
  if (!redisConnection) return

  const worker = new Worker(
    'send-report',
    async (job) => {
      const triggeredBy: string = job.data?.triggeredBy ?? 'scheduler'
      console.log(`[send-report] Verificando relatórios agendados (trigger: ${triggeredBy})`)
      const result = await reportsService.processDue()
      console.log(`[send-report] ${result.sent}/${result.processed} relatórios enviados`)
      return result
    },
    { connection: redisConnection, concurrency: 1 },
  )

  worker.on('failed', (job, err) => {
    console.error(`[send-report] Job ${job?.id} falhou:`, err.message)
  })
}
