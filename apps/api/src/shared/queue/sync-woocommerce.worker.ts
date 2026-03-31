import { Worker } from 'bullmq'
import { redisConnection } from './queue.client'
import { wooStoresService } from '../../modules/woocommerce/woo-stores.service'
import { wooStoresRepository } from '../../modules/woocommerce/woo-stores.repository'
import { broadcast } from '../websocket/websocket.server'
import type { WooStoreType } from '../../modules/woocommerce/woo-stores.types'

export interface SyncWooJobData {
  storeType?: WooStoreType  // undefined = sync all active stores
  triggeredBy: 'scheduler' | 'manual'
  daysBack?: number
}

export function startSyncWooWorker(): void {
  if (!redisConnection) return

  const worker = new Worker<SyncWooJobData>(
    'sync-woocommerce',
    async (job) => {
      const { storeType, daysBack = 30 } = job.data

      const stores = await wooStoresRepository.findAll()
      const targets = storeType
        ? stores.filter((s) => s.type === storeType && s.consumer_key_encrypted)
        : stores.filter((s) => s.status === 'ACTIVE' && s.consumer_key_encrypted)

      let totalOrders = 0

      for (const store of targets) {
        try {
          console.log(`[woo-worker] Sincronizando ${store.name}...`)
          const result = await wooStoresService.syncStore(store.type, daysBack)
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
