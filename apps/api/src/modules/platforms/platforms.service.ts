import { encrypt, decrypt, mask } from '../../shared/crypto'
import { AppError } from '../../shared/middleware/error.middleware'
import { platformsRepository } from './platforms.repository'
import { PLATFORM_CREDENTIAL_FIELDS } from './platforms.types'
import type { PlatformType, PlatformCredentials } from './platforms.types'

function sanitizePlatform(row: Awaited<ReturnType<typeof platformsRepository.findAll>>[0]) {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    hasCredentials: row.credentials_encrypted !== null,
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    updatedAt: row.updated_at,
  }
}

export const platformsService = {
  async listAll() {
    const platforms = await platformsRepository.findAll()
    return platforms.map(sanitizePlatform)
  },

  async saveCredentials(type: PlatformType, credentials: PlatformCredentials) {
    const requiredFields = PLATFORM_CREDENTIAL_FIELDS[type]
    const missing = requiredFields.filter((f) => !credentials[f]?.trim())
    if (missing.length > 0) {
      throw new AppError(
        400,
        'MISSING_CREDENTIALS',
        `Campos obrigatórios ausentes: ${missing.join(', ')}`,
      )
    }

    const encrypted = encrypt(JSON.stringify(credentials))
    const row = await platformsRepository.saveCredentials(type, encrypted)
    return sanitizePlatform(row)
  },

  async testConnection(type: PlatformType) {
    const platform = await platformsRepository.findByType(type)

    if (!platform?.credentials_encrypted) {
      throw new AppError(422, 'NO_CREDENTIALS', 'Credenciais não configuradas para esta plataforma')
    }

    // Mock: em etapas futuras cada adapter implementará a chamada real à API
    // Por ora simulamos sucesso para credenciais presentes
    try {
      decrypt(platform.credentials_encrypted) // valida que o dado é descriptografável
      await platformsRepository.updateStatus(type, 'ACTIVE')
      return { success: true, message: 'Conexão testada com sucesso (modo simulado)' }
    } catch {
      await platformsRepository.updateStatus(type, 'ERROR', 'Falha ao validar credenciais')
      throw new AppError(422, 'CONNECTION_FAILED', 'Falha ao conectar com a plataforma')
    }
  },

  async clearCredentials(type: PlatformType) {
    const row = await platformsRepository.clearCredentials(type)
    return sanitizePlatform(row)
  },

  async getCredentialsFields(type: PlatformType) {
    return { type, fields: PLATFORM_CREDENTIAL_FIELDS[type].map((f) => ({ key: f, masked: mask('') })) }
  },
}
