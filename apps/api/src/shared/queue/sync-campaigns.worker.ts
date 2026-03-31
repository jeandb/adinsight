import { Worker } from 'bullmq'
import { redisConnection } from './queue.client'
import type { SyncJobData } from './queue.client'
import { platformsRepository } from '../../modules/platforms/platforms.repository'
import { broadcast } from '../websocket/websocket.server'
import { runPlatformSync } from '../../modules/platforms/sync.runner'
import type { PlatformType } from '../../modules/platforms/platforms.types'

export function startSyncWorker(): Worker {
  if (!redisConnection) {
    throw new Error('Redis não disponível — worker não pode ser iniciado')
  }

  const worker = new Worker<SyncJobData>(
    'sync-campaigns',
    async (job) => {
      const { platformType, daysBack = 7 } = job.data
      const type = platformType as PlatformType

      const platform = await platformsRepository.findByType(type)
      if (!platform?.credentials_encrypted) {
        console.log(`[sync] ${type}: sem credenciais — pulando`)
        return
      }

      await runPlatformSync(type, daysBack)
    },
    {
      connection: redisConnection,
      concurrency: 2,
    },
  )

  worker.on('failed', async (job, err) => {
    const type = job?.data.platformType ?? 'UNKNOWN'
    console.error(`[sync] ${type}: falhou —`, err.message)
    try {
      await platformsRepository.updateStatus(type as PlatformType, 'ERROR', err.message)
    } catch { /* ignore secondary failure */ }
    broadcast({ type: 'sync:failed', payload: { platformType: type, error: err.message } })
  })

  console.log('⚙️  Worker de sync iniciado')
  return worker
}
