import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import {
  platformsApi,
  PLATFORM_FIELDS,
  PLATFORM_LABELS,
  type PlatformItem,
  type PlatformType,
} from './platforms.api'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  CONNECTED: {
    icon: CheckCircle2,
    label: 'Conectado',
    className: 'text-green-600 bg-green-50 border-green-200',
  },
  DISCONNECTED: {
    icon: XCircle,
    label: 'Desconectado',
    className: 'text-gray-500 bg-gray-50 border-gray-200',
  },
  ERROR: {
    icon: AlertCircle,
    label: 'Erro',
    className: 'text-red-600 bg-red-50 border-red-200',
  },
}

const PLATFORM_ICONS: Record<PlatformType, string> = {
  META: '📘',
  GOOGLE: '🔵',
  TIKTOK: '🎵',
  PINTEREST: '📌',
}

export function PlatformsPage() {
  const qc = useQueryClient()
  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['platforms'],
    queryFn: platformsApi.list,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-muted-foreground text-sm">
        Carregando integrações...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure as credenciais das plataformas de anúncios
        </p>
      </div>

      <div className="grid gap-4">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            onUpdate={() => qc.invalidateQueries({ queryKey: ['platforms'] })}
          />
        ))}
        {platforms.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma plataforma disponível.</p>
        )}
      </div>
    </div>
  )
}

function PlatformCard({
  platform,
  onUpdate,
}: {
  platform: PlatformItem
  onUpdate: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const fields = PLATFORM_FIELDS[platform.type]
  const statusCfg = STATUS_CONFIG[platform.status]
  const StatusIcon = statusCfg.icon

  const save = useMutation({
    mutationFn: () => platformsApi.saveCredentials(platform.type, credentials),
    onSuccess: () => {
      setCredentials({})
      setTestResult(null)
      onUpdate()
    },
  })

  const test = useMutation({
    mutationFn: () => platformsApi.testConnection(platform.type),
    onSuccess: (result) => setTestResult(result),
    onError: () => setTestResult({ success: false, message: 'Falha na conexão' }),
  })

  const clear = useMutation({
    mutationFn: () => platformsApi.clearCredentials(platform.type),
    onSuccess: () => {
      setTestResult(null)
      onUpdate()
    },
  })

  const allFieldsFilled = fields.every((f) => credentials[f.key]?.trim())

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{PLATFORM_ICONS[platform.type]}</span>
          <div>
            <p className="font-medium text-foreground">{PLATFORM_LABELS[platform.type]}</p>
            {platform.lastSyncAt && (
              <p className="text-xs text-muted-foreground">
                Última sincronização:{' '}
                {new Date(platform.lastSyncAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
              statusCfg.className,
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            {platform.hasCredentials
              ? 'Credenciais salvas. Preencha os campos abaixo para atualizar.'
              : 'Nenhuma credencial configurada. Preencha os campos para conectar.'}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {field.label}
                </label>
                <input
                  type="password"
                  value={credentials[field.key] ?? ''}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder ?? '••••••••'}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
            ))}
          </div>

          {testResult && (
            <div
              className={cn(
                'flex items-center gap-2 text-sm px-3 py-2 rounded-lg border',
                testResult.success
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-red-600 bg-red-50 border-red-200',
              )}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              {testResult.message}
            </div>
          )}

          {save.isError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              Erro ao salvar credenciais
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => save.mutate()}
              disabled={!allFieldsFilled || save.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {save.isPending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                </span>
              ) : (
                'Salvar credenciais'
              )}
            </button>

            {platform.hasCredentials && (
              <>
                <button
                  onClick={() => test.mutate()}
                  disabled={test.isPending}
                  className="px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-60"
                >
                  {test.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testando...
                    </span>
                  ) : (
                    'Testar conexão'
                  )}
                </button>
                <button
                  onClick={() => clear.mutate()}
                  disabled={clear.isPending}
                  className="ml-auto px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-60"
                >
                  {clear.isPending ? 'Removendo...' : 'Remover credenciais'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
