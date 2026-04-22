import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShoppingBag, CheckCircle2, AlertCircle, Settings, RefreshCw,
  Trash2, X, Plus, Upload, Download, FileText, Wifi, WifiOff, Pencil, ShoppingCart,
} from 'lucide-react'
import { wooStoresApi, type WooStore, type WooSourceType } from './woo-stores.api'
import { channelsApi, type Channel } from '@/features/admin/channels/channels.api'


// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE:         { label: 'Ativo',           icon: CheckCircle2, className: 'text-green-600' },
  ERROR:          { label: 'Erro',            icon: AlertCircle,  className: 'text-destructive' },
  NOT_CONFIGURED: { label: 'Não configurado', icon: Settings,     className: 'text-muted-foreground' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Nunca sincronizado'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Create Store Modal ───────────────────────────────────────────────────────

function CreateStoreModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [name,       setName]       = useState('')
  const [url,        setUrl]        = useState('')
  const [sourceType, setSourceType] = useState<WooSourceType>('woocommerce')

  const create = useMutation({
    mutationFn: () => wooStoresApi.createStore({
      name,
      url: url.trim() || null,
      sourceType,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['woo-stores'] })
      onClose()
    },
  })

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Nova fonte de faturamento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate() }}
          className="p-5 space-y-4"
        >
          <div>
            <label className={labelCls}>Nome da loja *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Loja Particular"
              className={inputCls}
            />
          </div>

          {/* Source type selector */}
          <div>
            <label className={labelCls}>Tipo de integração</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'woocommerce', label: 'WooCommerce API',   icon: Wifi,         desc: 'Sync automático via REST API' },
                { value: 'kiwify',      label: 'Kiwify',            icon: ShoppingCart, desc: 'Sync automático via API Kiwify' },
                { value: 'manual',      label: 'Importação manual', icon: Upload,       desc: 'Upload de arquivo Excel/CSV' },
              ] as const).map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSourceType(value)}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-colors ${
                    sourceType === value
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-xs">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {sourceType === 'woocommerce' && (
            <div>
              <label className={labelCls}>URL da loja (opcional)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://minhaloja.com.br"
                className={inputCls}
              />
            </div>
          )}

          {create.isError && (
            <p className="text-xs text-destructive">{(create.error as Error).message}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {create.isPending ? 'Criando...' : 'Criar loja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Store Modal ─────────────────────────────────────────────────────────

function EditStoreModal({ store, onClose }: { store: WooStore; onClose: () => void }) {
  const qc = useQueryClient()
  const [name,       setName]       = useState(store.name)
  const [url,        setUrl]        = useState(store.url ?? '')
  const [sourceType, setSourceType] = useState<WooSourceType>(store.sourceType)
  const [channelId,  setChannelId]  = useState<string | null>(store.channelId)

  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsApi.list(),
    staleTime: 10 * 60 * 1000,
  })

  const update = useMutation({
    mutationFn: () => wooStoresApi.updateStore(store.id, {
      name,
      url: url.trim() || null,
      sourceType,
      channelId,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['woo-stores'] })
      onClose()
    },
  })

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Editar loja — {store.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); update.mutate() }}
          className="p-5 space-y-4"
        >
          <div>
            <label className={labelCls}>Nome</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Tipo de integração</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'woocommerce', label: 'WooCommerce API', icon: Wifi,    desc: 'Sync automático via REST API' },
                { value: 'manual',      label: 'Importação manual', icon: Upload, desc: 'Upload de arquivo Excel/CSV' },
              ] as const).map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSourceType(value)}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-colors ${
                    sourceType === value
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-xs">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {sourceType === 'woocommerce' && (
            <div>
              <label className={labelCls}>URL da loja (opcional)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://minhaloja.com.br"
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Canal de negócio</label>
            <select
              value={channelId ?? ''}
              onChange={(e) => setChannelId(e.target.value || null)}
              className={inputCls}
            >
              <option value="">Sem canal associado</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>

          {update.isError && (
            <p className="text-xs text-destructive">{(update.error as Error).message}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {update.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Credentials Modal ────────────────────────────────────────────────────────

function CredentialsModal({ store, onClose }: { store: WooStore; onClose: () => void }) {
  const qc = useQueryClient()
  const [consumerKey,    setConsumerKey]    = useState('')
  const [consumerSecret, setConsumerSecret] = useState('')

  const save = useMutation({
    mutationFn: () => wooStoresApi.saveCredentials(store.id, { consumerKey, consumerSecret }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['woo-stores'] })
      onClose()
    },
  })

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring'
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Credenciais — {store.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate() }}
          className="p-5 space-y-4"
        >
          <p className="text-xs text-muted-foreground">
            Acesse <strong>WooCommerce → Configurações → Avançado → REST API</strong> na loja para gerar as chaves com permissão de <em>Leitura</em>.
          </p>

          <div>
            <label className={labelCls}>Consumer Key</label>
            <input
              required
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value)}
              placeholder="ck_••••••••••••••••"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Consumer Secret</label>
            <input
              required
              type="password"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value)}
              placeholder="cs_••••••••••••••••"
              className={inputCls}
            />
          </div>

          {save.isError && (
            <p className="text-xs text-destructive">{(save.error as Error).message}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {save.isPending ? 'Salvando...' : 'Salvar credenciais'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Kiwify Credentials Modal ────────────────────────────────────────────────

function KiwifyCredentialsModal({ store, onClose }: { store: WooStore; onClose: () => void }) {
  const qc = useQueryClient()
  const [clientId,     setClientId]     = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [accountId,    setAccountId]    = useState('')

  const save = useMutation({
    mutationFn: () => wooStoresApi.saveKiwifyCredentials(store.id, { clientId, clientSecret, accountId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['woo-stores'] })
      onClose()
    },
  })

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring'
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Credenciais Kiwify — {store.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate() }}
          className="p-5 space-y-4"
        >
          <p className="text-xs text-muted-foreground">
            Acesse o painel Kiwify em <strong>Configurações → Integrações → API</strong> para obter as credenciais OAuth.
          </p>

          <div>
            <label className={labelCls}>Client ID</label>
            <input
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Client Secret</label>
            <input
              required
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Account ID</label>
            <input
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Ex: 4wR4Ho8v9gqMsAu"
              className={inputCls}
            />
          </div>

          {save.isError && (
            <p className="text-xs text-destructive">{(save.error as Error).message}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {save.isPending ? 'Salvando...' : 'Salvar credenciais'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── File Import Zone ─────────────────────────────────────────────────────────

function FileImportZone({ store }: { store: WooStore }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [lastResult, setLastResult] = useState<{ imported: number } | null>(null)

  const importMut = useMutation({
    mutationFn: (file: File) => wooStoresApi.importFile(store.id, file),
    onSuccess: (data) => {
      setLastResult(data)
      qc.invalidateQueries({ queryKey: ['woo-stores'] })
    },
  })

  function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      alert('Formato inválido. Use Excel (.xlsx/.xls) ou CSV (.csv)')
      return
    }
    importMut.mutate(file)
  }

  function handleDownloadTemplate() {
    const csv = [
      'data,valor,email,status,id_pedido',
      '15/01/2024,97.00,cliente@email.com,completed,1001',
      '16/01/2024,"R$ 197,00",outro@email.com,completed,1002',
      '17/01/2024,47.00,,completed,1003',
    ].join('\n')
    const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    const a   = document.createElement('a')
    a.href     = url
    a.download = 'modelo-importacao-faturamento.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-accent'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <Upload className={`w-6 h-6 ${importMut.isPending ? 'animate-bounce text-primary' : 'text-muted-foreground'}`} />
        <div className="text-center">
          <p className="text-xs font-medium text-foreground">
            {importMut.isPending ? 'Importando...' : 'Arraste ou clique para importar'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Excel (.xlsx/.xls) ou CSV (.csv)</p>
        </div>
      </div>

      {/* Success / error feedback */}
      {lastResult && !importMut.isPending && (
        <p className="text-xs text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {lastResult.imported} pedidos importados com sucesso
        </p>
      )}
      {importMut.isError && (
        <p className="text-xs text-destructive">{(importMut.error as Error).message}</p>
      )}

      {/* Template download */}
      <button
        type="button"
        onClick={handleDownloadTemplate}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Baixar modelo de planilha
      </button>
    </div>
  )
}

// ─── Store Card ───────────────────────────────────────────────────────────────

function StoreCard({ store, channels }: { store: WooStore; channels: Channel[] }) {
  const qc = useQueryClient()
  const [showCredentials,       setShowCredentials]       = useState(false)
  const [showKiwifyCredentials, setShowKiwifyCredentials] = useState(false)
  const [showEdit,              setShowEdit]              = useState(false)
  const statusCfg = STATUS_CONFIG[store.status]
  const StatusIcon = statusCfg.icon

  const updateChannel = useMutation({
    mutationFn: (channelId: string | null) =>
      wooStoresApi.updateStore(store.id, { channelId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['woo-stores'] }),
  })

  const test = useMutation({
    mutationFn: () => wooStoresApi.testConnection(store.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['woo-stores'] }),
  })

  const sync = useMutation({
    mutationFn: () => wooStoresApi.sync(store.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['woo-stores'] }),
  })

  const clear = useMutation({
    mutationFn: () => wooStoresApi.clearCredentials(store.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['woo-stores'] }),
  })

  const deleteStore = useMutation({
    mutationFn: () => wooStoresApi.deleteStore(store.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['woo-stores'] }),
  })

  const isWoo    = store.sourceType === 'woocommerce'
  const isKiwify = store.sourceType === 'kiwify'
  const isApi    = isWoo || isKiwify

  const BADGE: Record<string, string> = {
    woocommerce: 'bg-blue-100 text-blue-700',
    kiwify:      'bg-violet-100 text-violet-700',
    manual:      'bg-amber-100 text-amber-700',
  }
  const BADGE_LABEL: Record<string, string> = {
    woocommerce: 'WooCommerce',
    kiwify:      'Kiwify',
    manual:      'Manual',
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              {isKiwify
                ? <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                : isWoo
                  ? <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                  : <FileText className="w-5 h-5 text-muted-foreground" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{store.name}</p>
              <p className="text-xs text-muted-foreground">
                {isWoo ? store.url ?? 'URL não configurada' : isKiwify ? 'API Kiwify' : 'Importação manual'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`flex items-center gap-1 text-xs font-medium ${statusCfg.className}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusCfg.label}
            </span>
            {/* Source type badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[store.sourceType] ?? BADGE.manual}`}>
              {BADGE_LABEL[store.sourceType] ?? store.sourceType}
            </span>
            {/* Edit button */}
            <button
              onClick={() => setShowEdit(true)}
              title="Editar loja"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Last sync */}
        <p className="text-xs text-muted-foreground">
          {store.lastSyncAt
            ? `Última sync: ${formatLastSync(store.lastSyncAt)}`
            : 'Nunca sincronizado'}
        </p>

        {/* Error */}
        {store.lastError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {store.lastError}
          </p>
        )}

        {/* Channel association */}
        {channels.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Canal:</span>
            <select
              value={store.channelId ?? ''}
              onChange={(e) => updateChannel.mutate(e.target.value || null)}
              disabled={updateChannel.isPending}
              className="flex-1 px-2 py-1 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer disabled:opacity-60"
            >
              <option value="">— sem canal —</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
            {updateChannel.isPending && (
              <span className="text-xs text-muted-foreground shrink-0">Salvando...</span>
            )}
            {updateChannel.isSuccess && (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
            )}
          </div>
        )}

        {/* Actions — branch by source type */}
        <div className="flex-1">
          {isApi ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => isKiwify ? setShowKiwifyCredentials(true) : setShowCredentials(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                {store.hasCredentials ? 'Credenciais' : 'Configurar'}
              </button>

              {store.hasCredentials && (
                <>
                  <button
                    onClick={() => test.mutate()}
                    disabled={test.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {test.data?.ok === false
                      ? <WifiOff className="w-3.5 h-3.5 text-destructive" />
                      : test.data?.ok
                        ? <Wifi className="w-3.5 h-3.5 text-green-600" />
                        : <Wifi className="w-3.5 h-3.5" />
                    }
                    {test.isPending ? 'Testando...' : test.data?.ok ? 'OK' : test.isSuccess ? 'Falhou' : 'Testar'}
                  </button>

                  <button
                    onClick={() => sync.mutate()}
                    disabled={sync.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sync.isPending ? 'animate-spin' : ''}`} />
                    {sync.isPending ? 'Sync...' : sync.isSuccess ? `${sync.data?.ordersSynced} pedidos` : 'Sync'}
                  </button>

                  <button
                    onClick={() => { if (confirm(`Remover credenciais de "${store.name}"?`)) clear.mutate() }}
                    disabled={clear.isPending}
                    title="Remover credenciais"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <FileImportZone store={store} />
          )}
        </div>

        {/* Delete store */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => {
              if (confirm(`Excluir a loja "${store.name}"? Esta ação não pode ser desfeita.`))
                deleteStore.mutate()
            }}
            disabled={deleteStore.isPending}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleteStore.isPending ? 'Excluindo...' : 'Excluir loja'}
          </button>
        </div>
      </div>

      {showCredentials && (
        <CredentialsModal store={store} onClose={() => setShowCredentials(false)} />
      )}

      {showKiwifyCredentials && (
        <KiwifyCredentialsModal store={store} onClose={() => setShowKiwifyCredentials(false)} />
      )}

      {showEdit && (
        <EditStoreModal store={store} onClose={() => setShowEdit(false)} />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WooStoresPage() {
  const [showCreate, setShowCreate] = useState(false)

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['woo-stores'],
    queryFn: wooStoresApi.list,
    staleTime: 60_000,
  })

  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
    staleTime: 10 * 60 * 1000,
  })

  const active = stores.filter((s) => s.status === 'ACTIVE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold text-foreground">Lojas & Faturamento</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte lojas via WooCommerce API ou importe faturamento por planilha Excel/CSV.
            {active > 0 && ` ${active} de ${stores.length} ${stores.length === 1 ? 'loja ativa' : 'lojas ativas'}.`}
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova loja
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Nenhuma loja cadastrada</p>
          <p className="text-xs text-muted-foreground">Clique em "Nova loja" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} channels={channels} />
          ))}
        </div>
      )}

      {showCreate && <CreateStoreModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
