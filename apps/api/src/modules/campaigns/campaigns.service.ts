import { AppError } from '../../shared/middleware/error.middleware'
import { campaignsRepository } from './campaigns.repository'

export const campaignsService = {
  async assignChannel(campaignId: string, channelId: string | null) {
    const result = await campaignsRepository.updateChannel(campaignId, channelId)
    if (!result) throw new AppError(404, 'NOT_FOUND', 'Campanha não encontrada')
    return result
  },

  async listUnassigned(page: number, limit: number) {
    return campaignsRepository.listUnassigned(page, limit)
  },
}
