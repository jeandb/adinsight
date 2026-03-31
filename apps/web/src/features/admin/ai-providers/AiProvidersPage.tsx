import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Bot, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { aiProvidersApi } from './ai-providers.api'
import { cn } from '@/lib/utils'
import type { AiProvider } from '@adinsight/shared-types'

const PROVIDER_OPTIONS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai',    label: 'OpenAI (GPT)' },
  { value: 'gemini',    label: 'Google (Gemini)' },
]

const PROVIDER_DEFAULTS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-pro',
}

const SCENARIO_LABELS: Record<string, string> = {
  'chat': 'Chat interativo',
  'daily-analysis': 'Análise diária automática',
  'on-demand': 'Análise sob demanda',
}

export function AiProvidersPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AiProvider | null>(null)

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiProvidersApi.listProviders,
  })

  const { data: scenarios = [], isLoading: loadingScenarios } = useQuery({
    queryKey: ['ai-scenarios'],
    queryFn: aiProvidersApi.listScenarios,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiProvidersApi.deleteProvider(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-providers'] }),
  })

  const assignMutation = useMutation({
    mutationFn: ({ scenario, providerId }: { scenario: string; providerId: string | null }) =>
      aiProvidersApi.assignScenario(scenario, providerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-scenarios'] }),
  })

  function openCreate() { setEditing(null); setShowModal(true) }
  function openEdit(p: AiProvider) { setEditing(p); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null) }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Modelos de IA</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure os providers de linguagem e os cenários de uso
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo provider
        </button>
      </div>

      {/* Providers list */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Providers configurados</h2>
        {loadingProviders ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : providers.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center">
            <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum provider configurado.</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione um provider Anthropic, OpenAI ou Gemini para ativar o módulo de IA.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {providers.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.provider} · {p.model} · max {p.maxTokens} tokens</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                    p.isActive
                      ? 'text-green-600 bg-green-50 border-green-200'
                      : 'text-gray-500 bg-gray-50 border-gray-200',
                  )}>
                    {p.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {p.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(p.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scenario assignments */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Cenários de uso</h2>
        {loadingScenarios ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid gap-3">
            {scenarios.map((s) => (
              <div key={s.scenario} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{SCENARIO_LABELS[s.scenario] ?? s.scenario}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Cenário: <code className="font-mono">{s.scenario}</code></p>
                </div>
                <select
                  value={s.providerId ?? ''}
                  onChange={(e) => assignMutation.mutate({ scenario: s.scenario, providerId: e.target.value || null })}
                  disabled={assignMutation.isPending}
                  className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">— Não configurado —</option>
                  {providers.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ProviderModal
          provider={editing}
          onClose={closeModal}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['ai-providers'] }); closeModal() }}
        />
      )}
    </div>
  )
}

function ProviderModal({
  provider,
  onClose,
  onSaved,
}: {
  provider: AiProvider | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: provider?.name ?? '',
    provider: (provider?.provider ?? 'anthropic') as 'anthropic' | 'openai' | 'gemini',
    model: provider?.model ?? 'claude-sonnet-4-6',
    apiKey: '',
    maxTokens: provider?.maxTokens ?? 4096,
    isActive: provider?.isActive ?? true,
  })

  const createMutation = useMutation({
    mutationFn: () => aiProvidersApi.createProvider({
      name: form.name,
      provider: form.provider,
      model: form.model,
      apiKey: form.apiKey,
      maxTokens: form.maxTokens,
    }),
    onSuccess: onSaved,
  })

  const updateMutation = useMutation({
    mutationFn: () => aiProvidersApi.updateProvider(provider!.id, {
      name: form.name,
      model: form.model,
      maxTokens: form.maxTokens,
      isActive: form.isActive,
      ...(form.apiKey ? { apiKey: form.apiKey } : {}),
    }),
    onSuccess: onSaved,
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const canSave = form.name.trim() && form.model.trim() && (provider ? true : form.apiKey.trim())

  function handleProviderChange(p: 'anthropic' | 'openai' | 'gemini') {
    setForm((f) => ({ ...f, provider: p, model: PROVIDER_DEFAULTS[p] ?? '' }))
  }

  function handleSubmit() {
    if (provider) updateMutation.mutate()
    else createMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground">
          {provider ? 'Editar provider' : 'Novo provider de IA'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Claude para Chat"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {!provider && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Provider</label>
              <select
                value={form.provider}
                onChange={(e) => handleProviderChange(e.target.value as 'anthropic' | 'openai' | 'gemini')}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PROVIDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Modelo</label>
            <input
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="Ex: claude-sonnet-4-6"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              API Key {provider && <span className="text-muted-foreground">(deixe em branco para não alterar)</span>}
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder={provider ? '••••••••' : 'sk-ant-...'}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Max tokens</label>
            <input
              type="number"
              value={form.maxTokens}
              onChange={(e) => setForm((f) => ({ ...f, maxTokens: Number(e.target.value) }))}
              min={256}
              max={32768}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {provider && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm text-foreground">Ativo</span>
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSave || isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</span>
            ) : (
              provider ? 'Salvar alterações' : 'Criar provider'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
