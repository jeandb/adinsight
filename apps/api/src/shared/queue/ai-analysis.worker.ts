import { Worker } from 'bullmq'
import { redisConnection } from './queue.client'
import { aiService } from '../../modules/ai/ai.service'
import { broadcast } from '../websocket/websocket.server'

export function startAiAnalysisWorker(): void {
  if (!redisConnection) return

  const worker = new Worker(
    'ai-analysis',
    async (job) => {
      const triggeredBy: string = job.data?.triggeredBy ?? 'scheduler'
      console.log(`[ai-analysis] Iniciando análise diária (trigger: ${triggeredBy})`)

      try {
        const result = await aiService.analyze(null as unknown as string)
        broadcast({ type: 'ai:analysis:ready', payload: { scenario: 'daily-analysis' } })
        console.log(`[ai-analysis] Concluída — ${result.tokensInput ?? 0} tokens entrada, ${result.tokensOutput ?? 0} saída`)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn(`[ai-analysis] Ignorada — ${message}`)
        // Not re-throwing: if no provider is configured, silently skip
      }
    },
    { connection: redisConnection, concurrency: 1 },
  )

  worker.on('failed', (job, err) => {
    console.error(`[ai-analysis] Job ${job?.id} falhou:`, err.message)
  })
}
