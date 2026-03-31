import { Worker } from 'bullmq'
import { redisConnection } from './queue.client'
import { wooStoresService } from '../../modules/woocommerce/woo-stores.service'
import { wooStoresRepository } from '../../modules/woocommerce/woo-stores.repository'
import { broadcast } from '../websocket/websocket.server'

export interface SyncWooJobData {
  storeId?: string          // undefined = sync all active stores
  triggeredBy: 'scheduler' | 'manual'
  daysBack?: number
}

export function startSyncWooWorker(): void {
  if (!redisConnection) return

  const worker = new Worker<SyncWooJobData>(
    'sync-woocommerce',
    async (job) => {
      const { storeId, daysBack = 30 } = job.data

      const stores = storeId
        ? (await wooStoresRepository.findById(storeId) ? [await wooStoresRepository.findById(storeId)!] : [])
        : await wooStoresRepository.findAllActive()

      let totalOrders = 0

      for (const store of stores) {
        if (!store) continue
        try {
          console.log(`[woo-worker] Sincronizando ${store.name}...`)
          const result = await wooStoresService.syncStore(store.id, daysBack)
          totalOrders += result.ordersSynced
          console.log(
            `[woo-worker] ${store.name} — ${result.ordersSynced} pedidos, ` +
            `${result.subscriptionsSynced} assinaturas`,
          )
        } catch (err) {
          console.error(`[woo-worker] Falha ao sincronizar ${store.name}:`, (err as Error).message)
        }
      }

      if (totalOrders > 0) {
        broadcast({ type: 'dashboard:refresh', payload: { scope: 'all' } })
      }
    },
    { connection: redisConnection, concurrency: 1 },
  )

  worker.on('failed', (job, err) => {
    console.error(`[woo-worker] Job ${job?.id} falhou:`, err.message)
  })
}
