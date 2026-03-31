import { Worker } from 'bullmq'
import { redisConnection } from './queue.client'
import { evaluateAllRules } from '../../modules/alerts/alerts.evaluator'

export function startEvaluateAlertsWorker(): void {
  if (!redisConnection) return

  const worker = new Worker(
    'evaluate-alerts',
    async () => {
      const triggered = await evaluateAllRules()
      console.log(`[alerts-worker] Avaliação concluída — ${triggered} alerta(s) disparado(s)`)
    },
    { connection: redisConnection, concurrency: 1 },
  )

  worker.on('failed', (job, err) => {
    console.error(`[alerts-worker] Job ${job?.id} falhou:`, err.message)
  })
}
