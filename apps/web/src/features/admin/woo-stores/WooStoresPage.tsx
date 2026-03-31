import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, CheckCircle2, AlertCircle, Settings, RefreshCw, Trash2, X } from 'lucide-react'
import { wooStoresApi, type WooStore, type WooStoreType } from './woo-stores.api'

// ─── Constants ────────────────────────────────────────────────────────────────

const STORE_META: Record<WooStoreType, { color: string; description: string }> = {
  LOJA_DAS_PROFS:  { color: '#6366f1', description: 'Produtos pedagógicos em PDF' },
  CLUBE_DAS_PROFS: { color: '#f59e0b', description: 'Assinatura anual — acesso ao catálogo completo' },
  TUDO_DE_PROF:    { color: '#10b981', description: 'Marketplace pedagógico (WCFM)' },
}

const STATUS_CONFIG = {
  ACTIVE:         { label: 'Ativo',          icon: CheckCircle2, className: 'text-green-600' },
  ERROR:          { label: 'Erro',           icon: AlertCircle,  className: 'text-destructive' },
  NOT_CONFIGURED: { label: 'Não configurado', icon: Settings,     className: 'text-muted-foreground' },
}

// ─── Credentials Modal ────────────────────────────────────────────────────────

function CredentialsModal({
  store,
  onClose,
}: {
  store: WooStore
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [consumerKey,    setConsumerKey]    = useState('')
  const [consumerSecret, setConsumerSecret] = useState('')

  const save = useMutation({
    mutationFn: () => wooStoresApi.saveCredentials(store.type, { consumerKey, consumerSecret }),
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
            <p className="text-xs text-destructive">
              {(save.error as Error).message}
            </p>
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

// ─── Store Card ───────────────────────────────────────────────────────────────

function StoreCard({ store }: { store: WooStore }) {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const meta = STORE_META[store.type]
  const statusCfg = STATUS_CONFIG[store.status]
  const StatusIcon = statusCfg.icon

  const test = useMutation({
    mutationFn: () => wooStoresApi.testConnection(store.type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['woo-stores'] }),
  })

  const sync = useMutation({
    mutationFn: () => wooStoresApi.sync(store.type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['woo-stores'] }),
  })

  const clear = useMutation({
    mutationFn: () => wooStoresApi.clearCredentials(store.type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['woo-stores'] }),
  })

  function formatLastSync(iso: string | null): string {
    if (!iso) return 'Nunca sincronizado'
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${meta.color}20` }}
            >
              <ShoppingBag className="w-5 h-5" style={{ color: meta.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{store.name}</p>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </div>
          </div>
          <span className={`flex items-center gap-1 text-xs font-medium ${statusCfg.className}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </span>
        </div>

        {/* URL */}
        <p className="text-xs text-muted-foreground font-mono">{store.url}</p>

        {/* Last sync */}
        <p className="text-xs text-muted-foreground">
          {store.lastSyncAt ? `Última sync: ${formatLastSync(store.lastSyncAt)}` : 'Nunca sincronizado'}
        </p>

        {/* Error */}
        {store.lastError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {store.lastError}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            {store.hasCredentials ? 'Atualizar credenciais' : 'Configurar'}
          </button>

          {store.hasCredentials && (
            <>
              <button
                onClick={() => test.mutate()}
                disabled={test.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {test.isPending ? 'Testando...' : test.isSuccess ? (test.data?.ok ? 'Conexão OK' : 'Falhou') : 'Testar'}
              </button>

              <button
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sync.isPending ? 'animate-spin' : ''}`} />
                {sync.isPending ? 'Sincronizando...' : sync.isSuccess ? `${sync.data?.ordersSynced} pedidos` : 'Sincronizar'}
              </button>

              <button
                onClick={() => { if (confirm(`Remover credenciais de ${store.name}?`)) clear.mutate() }}
                disabled={clear.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <CredentialsModal store={store} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WooStoresPage() {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['woo-stores'],
    queryFn: wooStoresApi.list,
    staleTime: 60_000,
  })

  const configured = stores.filter((s) => s.status === 'ACTIVE').length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Lojas & Faturamento</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as credenciais WooCommerce para sincronizar pedidos e calcular o ROAS real.
          {configured > 0 && ` ${configured} de ${stores.length} lojas ativas.`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  )
}
