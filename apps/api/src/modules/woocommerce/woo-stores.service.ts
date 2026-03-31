import { AppError } from '../../shared/middleware/error.middleware'
import { encrypt, decrypt, mask } from '../../shared/crypto'
import { wooStoresRepository } from './woo-stores.repository'
import { testWooConnection, syncOrders, syncSubscriptions } from './woo.adapter'
import type { WooStoreRow, WooStoreType, SaveCredentialsInput } from './woo-stores.types'

function sanitizeStore(row: WooStoreRow) {
  return {
    id:          row.id,
    name:        row.name,
    url:         row.url,
    type:        row.type,
    channelId:   row.channel_id,
    status:      row.status,
    lastError:   row.last_error,
    lastSyncAt:  row.last_sync_at,
    hasCredentials: !!(row.consumer_key_encrypted && row.consumer_secret_encrypted),
    consumerKeyMasked: row.consumer_key_encrypted ? mask(row.consumer_key_encrypted) : null,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  }
}

export const wooStoresService = {
  async listStores() {
    const rows = await wooStoresRepository.findAll()
    return rows.map(sanitizeStore)
  },

  async saveCredentials(type: WooStoreType, input: SaveCredentialsInput) {
    const consumerKeyEncrypted    = encrypt(input.consumerKey)
    const consumerSecretEncrypted = encrypt(input.consumerSecret)
    const row = await wooStoresRepository.saveCredentials(
      type,
      consumerKeyEncrypted,
      consumerSecretEncrypted,
      input.channelId ?? null,
    )
    return sanitizeStore(row)
  },

  async testConnection(type: WooStoreType) {
    const store = await wooStoresRepository.findByType(type)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')
    if (!store.consumer_key_encrypted || !store.consumer_secret_encrypted) {
      throw new AppError(422, 'NOT_CONFIGURED', 'Credenciais não configuradas')
    }

    const creds = {
      url:            store.url,
      consumerKey:    decrypt(store.consumer_key_encrypted),
      consumerSecret: decrypt(store.consumer_secret_encrypted),
    }

    const result = await testWooConnection(creds)

    if (result.ok) {
      await wooStoresRepository.updateStatus(type, 'ACTIVE')
    } else {
      await wooStoresRepository.updateStatus(type, 'ERROR', result.error)
    }

    return result
  },

  async syncStore(type: WooStoreType, daysBack = 30) {
    const store = await wooStoresRepository.findByType(type)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')
    if (!store.consumer_key_encrypted || !store.consumer_secret_encrypted) {
      throw new AppError(422, 'NOT_CONFIGURED', 'Credenciais não configuradas')
    }

    const creds = {
      url:            store.url,
      consumerKey:    decrypt(store.consumer_key_encrypted),
      consumerSecret: decrypt(store.consumer_secret_encrypted),
    }

    const before = new Date().toISOString()
    const after  = new Date(Date.now() - daysBack * 86_400_000).toISOString()

    const orders = await syncOrders(creds, after, before)
    await wooStoresRepository.upsertOrders(store.id, orders)

    let subscriptionsSynced = 0
    if (type === 'CLUBE_DAS_PROFS') {
      const subs = await syncSubscriptions(creds)
      await wooStoresRepository.upsertSubscriptions(store.id, subs)
      subscriptionsSynced = subs.length
    }

    await wooStoresRepository.updateStatus(type, 'ACTIVE')

    return { ordersSynced: orders.length, subscriptionsSynced }
  },

  async clearCredentials(type: WooStoreType) {
    const row = await wooStoresRepository.clearCredentials(type)
    return sanitizeStore(row)
  },

  async listOrders(params: {
    storeType?: string
    after?: string
    before?: string
    status?: string
    page: number
    limit: number
  }) {
    let storeId: string | undefined

    if (params.storeType) {
      const store = await wooStoresRepository.findByType(params.storeType as WooStoreType)
      if (store) storeId = store.id
    }

    return wooStoresRepository.findOrders({ ...params, storeId })
  },
}
