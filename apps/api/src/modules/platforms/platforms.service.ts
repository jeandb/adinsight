import { encrypt, decrypt, mask } from '../../shared/crypto'
import { AppError } from '../../shared/middleware/error.middleware'
import { platformsRepository } from './platforms.repository'
import { getAdapter } from './adapter.registry'
import { addSyncJob } from '../../shared/queue/queue.client'
import { PLATFORM_CREDENTIAL_FIELDS } from './platforms.types'
import type { PlatformType, PlatformCredentials } from './platforms.types'

function mapStatus(dbStatus: string): 'CONNECTED' | 'DISCONNECTED' | 'ERROR' {
  if (dbStatus === 'ACTIVE') return 'CONNECTED'
  if (dbStatus === 'ERROR') return 'ERROR'
  return 'DISCONNECTED'
}

function sanitizePlatform(row: Awaited<ReturnType<typeof platformsRepository.findAll>>[0]) {
  return {
    id: row.id,
    type: row.type,
    status: mapStatus(row.status),
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

    let credentials: Record<string, string>
    try {
      credentials = JSON.parse(decrypt(platform.credentials_encrypted))
    } catch {
      await platformsRepository.updateStatus(type, 'ERROR', 'Falha ao descriptografar credenciais')
      throw new AppError(422, 'DECRYPT_FAILED', 'Erro ao ler credenciais armazenadas')
    }

    const adapter = getAdapter(type)
    const result = await adapter.testConnection(credentials)

    if (result.ok) {
      await platformsRepository.updateStatus(type, 'ACTIVE')
      return { success: true, message: result.message }
    } else {
      await platformsRepository.updateStatus(type, 'ERROR', result.message)
      throw new AppError(422, 'CONNECTION_FAILED', result.message)
    }
  },

  async triggerSync(type: PlatformType, daysBack?: number) {
    const platform = await platformsRepository.findByType(type)
    if (!platform?.credentials_encrypted) {
      throw new AppError(422, 'NO_CREDENTIALS', 'Credenciais não configuradas para esta plataforma')
    }
    if (platform.status !== 'ACTIVE') {
      throw new AppError(422, 'NOT_CONNECTED', 'Plataforma não está conectada — teste a conexão primeiro')
    }
    await addSyncJob(type, 'manual', daysBack)
    return { queued: true, message: `Sync de ${type} enfileirado` }
  },

  async clearCredentials(type: PlatformType) {
    const row = await platformsRepository.clearCredentials(type)
    return sanitizePlatform(row)
  },

  async getCredentialsFields(type: PlatformType) {
    return { type, fields: PLATFORM_CREDENTIAL_FIELDS[type].map((f) => ({ key: f, masked: mask('') })) }
  },
}
