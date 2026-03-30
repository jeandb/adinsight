import { AppError } from '../../shared/middleware/error.middleware'
import { channelsRepository } from './channels.repository'
import type { CreateChannelInput, UpdateChannelInput } from './channels.types'

function sanitizeChannel(row: NonNullable<Awaited<ReturnType<typeof channelsRepository.findById>>>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    keywords: row.keywords,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const channelsService = {
  async listAll() {
    const channels = await channelsRepository.findAll()
    return channels.map(sanitizeChannel)
  },

  async create(input: CreateChannelInput, userId: string) {
    const row = await channelsRepository.create(input, userId)
    return sanitizeChannel(row)
  },

  async update(id: string, input: UpdateChannelInput) {
    const row = await channelsRepository.update(id, input)
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Canal não encontrado')
    return sanitizeChannel(row)
  },

  async archive(id: string) {
    const row = await channelsRepository.setStatus(id, 'ARCHIVED')
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Canal não encontrado')
    return sanitizeChannel(row)
  },

  async restore(id: string) {
    const row = await channelsRepository.setStatus(id, 'ACTIVE')
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Canal não encontrado')
    return sanitizeChannel(row)
  },
}
