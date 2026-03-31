import { Worker } from 'bullmq'
import { redisConnection } from './queue.client'
import type { SyncJobData } from './queue.client'
import { platformsRepository } from '../../modules/platforms/platforms.repository'
import { campaignsRepository } from '../../modules/campaigns/campaigns.repository'
import { getAdapter } from '../../modules/platforms/adapter.registry'
import { decrypt } from '../crypto'
import { broadcast } from '../websocket/websocket.server'
import type { PlatformType } from '../../modules/platforms/platforms.types'

function toDateRange(daysBack = 7): { from: string; to: string } {
  const to = new Date()
  to.setDate(to.getDate() - 1)
  const from = new Date(to)
  from.setDate(from.getDate() - (daysBack - 1))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

export function startSyncWorker(): Worker {
  if (!redisConnection) {
    throw new Error('Redis não disponível — worker não pode ser iniciado')
  }

  const worker = new Worker<SyncJobData>(
    'sync-campaigns',
    async (job) => {
      const { platformType, daysBack = 7 } = job.data
      const type = platformType as PlatformType

      console.log(`[sync] Iniciando sync de ${type}...`)
      broadcast({ type: 'sync:started', payload: { platformType: type } })

      const platform = await platformsRepository.findByType(type)
      if (!platform?.credentials_encrypted) {
        console.log(`[sync] ${type}: sem credenciais — pulando`)
        return
      }
      if (platform.status !== 'ACTIVE') {
        console.log(`[sync] ${type}: status ${platform.status} — pulando`)
        return
      }

      const credentials = JSON.parse(decrypt(platform.credentials_encrypted)) as Record<string, string>
      const adapter = getAdapter(type)
      const range = toDateRange(daysBack)

      // 1. Sync campaigns
      const campaignDataList = await adapter.syncCampaigns(credentials, range)
      const platformId = await campaignsRepository.getPlatformIdByType(type)
      if (!platformId) throw new Error(`Platform ID não encontrado para ${type}`)

      const idMap: Record<string, string> = {}
      for (const campaignData of campaignDataList) {
        const { id, externalId } = await campaignsRepository.upsertCampaign(platformId, campaignData)
        idMap[externalId] = id
        // Auto-assign channel by keyword if not yet assigned or locked
        await campaignsRepository.autoAssignChannel(id, campaignData.name)
      }

      // 2. Sync metrics
      const externalIds = Object.keys(idMap)
      const metricDataList = await adapter.syncMetrics(credentials, externalIds, range)

      for (const metricData of metricDataList) {
        const campaignId = idMap[metricData.externalCampaignId]
        if (!campaignId) continue
        await campaignsRepository.upsertMetricSnapshot(campaignId, metricData)
      }

      // 3. Update last_sync_at
      await platformsRepository.updateStatus(type, 'ACTIVE')

      const summary = `${campaignDataList.length} campanhas, ${metricDataList.length} snapshots`
      console.log(`[sync] ${type}: concluído — ${summary}`)

      broadcast({
        type: 'sync:completed',
        payload: {
          platformType: type,
          campaignsUpdated: campaignDataList.length,
          timestamp: new Date().toISOString(),
        },
      })
      broadcast({ type: 'dashboard:refresh', payload: { scope: 'campaigns' } })
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
