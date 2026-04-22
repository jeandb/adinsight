import { AppError } from '../../shared/middleware/error.middleware'
import { encrypt, decrypt, mask } from '../../shared/crypto'
import { wooStoresRepository } from './woo-stores.repository'
import { testWooConnection, syncOrders, syncSubscriptions } from './woo.adapter'
import { testKiwifyConnection, syncKiwifyOrders } from './kiwify.adapter'
import { parseFileToOrders } from './revenue.importer'
import type { WooStoreRow, CreateStoreInput, SaveCredentialsInput, SaveKiwifyCredentialsInput } from './woo-stores.types'

function sanitizeStore(row: WooStoreRow) {
  const isKiwify = row.source_type === 'kiwify'
  return {
    id:                row.id,
    name:              row.name,
    url:               row.url,
    type:              row.type,
    sourceType:        row.source_type,
    isDeletable:       row.is_deletable,
    channelId:         row.channel_id,
    status:            row.status,
    lastError:         row.last_error,
    lastSyncAt:        row.last_sync_at,
    hasCredentials:    isKiwify
      ? !!(row.kiwify_client_id_encrypted && row.kiwify_client_secret_encrypted && row.kiwify_account_id_encrypted)
      : !!(row.consumer_key_encrypted && row.consumer_secret_encrypted),
    consumerKeyMasked: row.consumer_key_encrypted ? mask(row.consumer_key_encrypted) : null,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  }
}

export const wooStoresService = {
  async listStores() {
    const rows = await wooStoresRepository.findAll()
    return rows.map(sanitizeStore)
  },

  async createStore(input: CreateStoreInput) {
    const row = await wooStoresRepository.createStore(input)
    return sanitizeStore(row)
  },

  async updateStore(id: string, input: { name?: string; url?: string | null; sourceType?: import('./woo-stores.types').WooSourceType; channelId?: string | null }) {
    const store = await wooStoresRepository.findById(id)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')
    const row = await wooStoresRepository.updateStore(id, input)
    return sanitizeStore(row)
  },

  async deleteStore(id: string) {
    const store = await wooStoresRepository.findById(id)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')
    await wooStoresRepository.deleteStore(id)
  },

  async saveCredentials(id: string, input: SaveCredentialsInput) {
    const store = await wooStoresRepository.findById(id)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')

    const ckEnc = encrypt(input.consumerKey)
    const csEnc = encrypt(input.consumerSecret)
    const row   = await wooStoresRepository.saveCredentials(id, ckEnc, csEnc, input.channelId ?? null)
    return sanitizeStore(row)
  },

  async testConnection(id: string) {
    const store = await wooStoresRepository.findById(id)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')

    let result: { ok: boolean; error?: string }

    if (store.source_type === 'kiwify') {
      if (!store.kiwify_client_id_encrypted || !store.kiwify_client_secret_encrypted || !store.kiwify_account_id_encrypted) {
        throw new AppError(422, 'NOT_CONFIGURED', 'Credenciais Kiwify não configuradas')
      }
      result = await testKiwifyConnection({
        clientId:     decrypt(store.kiwify_client_id_encrypted),
        clientSecret: decrypt(store.kiwify_client_secret_encrypted),
        accountId:    decrypt(store.kiwify_account_id_encrypted),
      })
    } else {
      if (!store.consumer_key_encrypted || !store.consumer_secret_encrypted) {
        throw new AppError(422, 'NOT_CONFIGURED', 'Credenciais não configuradas')
      }
      result = await testWooConnection({
        url:            store.url!,
        consumerKey:    decrypt(store.consumer_key_encrypted),
        consumerSecret: decrypt(store.consumer_secret_encrypted),
      })
    }

    await wooStoresRepository.updateStatus(id, result.ok ? 'ACTIVE' : 'ERROR', result.error)
    return result
  },

  async syncStore(id: string, daysBack = 30) {
    const store = await wooStoresRepository.findById(id)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')

    if (store.source_type === 'manual') {
      throw new AppError(422, 'INVALID_SOURCE', 'Lojas manuais não suportam sync via API')
    }

    if (store.source_type === 'kiwify') {
      if (!store.kiwify_client_id_encrypted || !store.kiwify_client_secret_encrypted || !store.kiwify_account_id_encrypted) {
        throw new AppError(422, 'NOT_CONFIGURED', 'Credenciais Kiwify não configuradas')
      }
      const orders = await syncKiwifyOrders({
        clientId:     decrypt(store.kiwify_client_id_encrypted),
        clientSecret: decrypt(store.kiwify_client_secret_encrypted),
        accountId:    decrypt(store.kiwify_account_id_encrypted),
      })
      await wooStoresRepository.upsertOrders(store.id, orders)
      await wooStoresRepository.updateStatus(id, 'ACTIVE')
      return { ordersSynced: orders.length, subscriptionsSynced: 0 }
    }

    // woocommerce
    if (!store.consumer_key_encrypted || !store.consumer_secret_encrypted) {
      throw new AppError(422, 'NOT_CONFIGURED', 'Credenciais não configuradas')
    }

    const creds = {
      url:            store.url!,
      consumerKey:    decrypt(store.consumer_key_encrypted),
      consumerSecret: decrypt(store.consumer_secret_encrypted),
    }

    const before = new Date().toISOString()
    const after  = new Date(Date.now() - daysBack * 86_400_000).toISOString()

    const orders = await syncOrders(creds, after, before)
    await wooStoresRepository.upsertOrders(store.id, orders)

    let subscriptionsSynced = 0
    if (store.type === 'CLUBE_DAS_PROFS') {
      const subs = await syncSubscriptions(creds)
      await wooStoresRepository.upsertSubscriptions(store.id, subs)
      subscriptionsSynced = subs.length
    }

    await wooStoresRepository.updateStatus(id, 'ACTIVE')
    return { ordersSynced: orders.length, subscriptionsSynced }
  },

  async importFromFile(id: string, buffer: Buffer, filename: string) {
    const store = await wooStoresRepository.findById(id)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')

    const orders = parseFileToOrders(buffer, filename)
    if (orders.length === 0) throw new AppError(422, 'EMPTY_FILE', 'Nenhum pedido encontrado no arquivo')

    await wooStoresRepository.upsertOrders(store.id, orders)
    await wooStoresRepository.updateStatus(id, 'ACTIVE')

    return { imported: orders.length }
  },

  async saveKiwifyCredentials(id: string, input: SaveKiwifyCredentialsInput) {
    const store = await wooStoresRepository.findById(id)
    if (!store) throw new AppError(404, 'NOT_FOUND', 'Loja não encontrada')

    const row = await wooStoresRepository.saveKiwifyCredentials(
      id,
      encrypt(input.clientId),
      encrypt(input.clientSecret),
      encrypt(input.accountId),
      input.channelId ?? null,
    )
    return sanitizeStore(row)
  },

  async clearCredentials(id: string) {
    const row = await wooStoresRepository.clearCredentials(id)
    return sanitizeStore(row)
  },

  async listOrders(params: {
    storeId?: string
    after?: string
    before?: string
    status?: string
    page: number
    limit: number
  }) {
    return wooStoresRepository.findOrders(params)
  },
}
