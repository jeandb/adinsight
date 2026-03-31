import { platformsRepository } from './platforms.repository'
import { campaignsRepository } from '../campaigns/campaigns.repository'
import { getAdapter } from './adapter.registry'
import { decrypt } from '../../shared/crypto'
import { broadcast } from '../../shared/websocket/websocket.server'
import type { PlatformType } from './platforms.types'

function toDateRange(daysBack = 7): { from: string; to: string } {
  const to = new Date()
  to.setDate(to.getDate() - 1)
  const from = new Date(to)
  from.setDate(from.getDate() - (daysBack - 1))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

export async function runPlatformSync(type: PlatformType, daysBack = 7): Promise<{
  campaigns: number
  snapshots: number
}> {
  console.log(`[sync] Iniciando sync de ${type}...`)
  broadcast({ type: 'sync:started', payload: { platformType: type } })

  const platform = await platformsRepository.findByType(type)
  if (!platform?.credentials_encrypted) throw new Error(`${type}: sem credenciais`)

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

  // 3. Update status and broadcast
  await platformsRepository.updateStatus(type, 'ACTIVE')

  const result = { campaigns: campaignDataList.length, snapshots: metricDataList.length }
  console.log(`[sync] ${type}: concluído — ${result.campaigns} campanhas, ${result.snapshots} snapshots`)

  broadcast({
    type: 'sync:completed',
    payload: { platformType: type, campaignsUpdated: result.campaigns, timestamp: new Date().toISOString() },
  })
  broadcast({ type: 'dashboard:refresh', payload: { scope: 'campaigns' } })

  return result
}
