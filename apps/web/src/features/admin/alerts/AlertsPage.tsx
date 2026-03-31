import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Plus, Trash2, Pencil, Play, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { alertsApi, type AlertRule, type CreateAlertRuleInput } from './alerts.api'

// ─── Labels ───────────────────────────────────────────────────────────────────

const METRIC_LABELS: Record<string, string> = {
  roas: 'ROAS', cpl: 'CPL', cpc: 'CPC', ctr: 'CTR',
  spend: 'Gasto', impressions: 'Impressões', clicks: 'Cliques', leads: 'Leads',
}

const OPERATOR_LABELS: Record<string, string> = {
  lt: '< menor que', lte: '≤ menor ou igual', gt: '> maior que', gte: '≥ maior ou igual',
}

const PLATFORM_LABELS: Record<string, string> = {
  META: 'Meta', GOOGLE: 'Google', TIKTOK: 'TikTok', PINTEREST: 'Pinterest',
}

// ─── Rule Form Modal ──────────────────────────────────────────────────────────

const EMPTY_FORM: CreateAlertRuleInput = {
  name: '', metric: 'roas', operator: 'lt', threshold: 0,
  periodDays: 7, platform: null, channelId: null, recipients: [],
}

function RuleModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: AlertRule
  onClose: () => void
  onSave: (input: CreateAlertRuleInput) => void
}) {
  const [form, setForm] = useState<CreateAlertRuleInput>(
    initial
      ? {
          name: initial.name, metric: initial.metric, operator: initial.operator,
          threshold: initial.threshold, periodDays: initial.periodDays,
          platform: initial.platform, channelId: initial.channelId, recipients: initial.recipients,
        }
      : EMPTY_FORM,
  )
  const [recipientInput, setRecipientInput] = useState('')

  function set<K extends keyof CreateAlertRuleInput>(k: K, v: CreateAlertRuleInput[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function addRecipient() {
    const email = recipientInput.trim().toLowerCase()
    if (!email || form.recipients?.includes(email)) return
    set('recipients', [...(form.recipients ?? []), email])
    setRecipientInput('')
  }

  function removeRecipient(email: string) {
    set('recipients', (form.recipients ?? []).filter((r) => r !== email))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {initial ? 'Editar regra' : 'Nova regra de alerta'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className={labelCls}>Nome da regra</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="ex: ROAS abaixo do mínimo"
              className={inputCls}
            />
          </div>

          {/* Metric + Operator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Métrica</label>
              <select value={form.metric} onChange={(e) => set('metric', e.target.value)} className={inputCls}>
                {Object.entries(METRIC_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condição</label>
              <select value={form.operator} onChange={(e) => set('operator', e.target.value)} className={inputCls}>
                {Object.entries(OPERATOR_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Threshold + Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Valor limite</label>
              <input
                required
                type="number"
                step="any"
                min="0"
                value={form.threshold}
                onChange={(e) => set('threshold', parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Período (dias)</label>
              <input
                required
                type="number"
                min="1"
                max="90"
                value={form.periodDays ?? 7}
                onChange={(e) => set('periodDays', parseInt(e.target.value) || 7)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Platform filter */}
          <div>
            <label className={labelCls}>Plataforma (opcional)</label>
            <select
              value={form.platform ?? ''}
              onChange={(e) => set('platform', e.target.value || null)}
              className={inputCls}
            >
              <option value="">Todas as plataformas</option>
              {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Email recipients */}
          <div>
            <label className={labelCls}>Destinatários de email (opcional)</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecipient() } }}
                placeholder="email@exemplo.com"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addRecipient}
                className="shrink-0 px-3 py-2 border border-input rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
              >
                Adicionar
              </button>
            </div>
            {(form.recipients ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.recipients!.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-foreground">
                    {email}
                    <button type="button" onClick={() => removeRecipient(email)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

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
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {initial ? 'Salvar alterações' : 'Criar regra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Rules Tab ────────────────────────────────────────────────────────────────

function RulesTab() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AlertRule | undefined>()

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alerts', 'rules'],
    queryFn: alertsApi.listRules,
    staleTime: 60_000,
  })

  const create = useMutation({
    mutationFn: alertsApi.createRule,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts', 'rules'] }); setModalOpen(false) },
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateAlertRuleInput> & { enabled?: boolean } }) =>
      alertsApi.updateRule(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', 'rules'] }),
  })

  const remove = useMutation({
    mutationFn: alertsApi.deleteRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', 'rules'] }),
  })

  const evaluate = useMutation({ mutationFn: alertsApi.evaluate })

  function handleSave(input: CreateAlertRuleInput) {
    if (editing) {
      update.mutate({ id: editing.id, input })
      setEditing(undefined)
    } else {
      create.mutate(input)
    }
  }

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Carregando regras...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rules.length} regra(s) configurada(s)</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => evaluate.mutate()}
            disabled={evaluate.isPending}
            title="Disparar avaliação manual"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {evaluate.isPending ? 'Avaliando...' : evaluate.isSuccess ? `${evaluate.data?.triggered ?? 0} disparado(s)` : 'Avaliar agora'}
          </button>
          <button
            onClick={() => { setEditing(undefined); setModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova regra
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-3 text-center">
          <Bell className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Nenhuma regra configurada</p>
          <p className="text-xs text-muted-foreground">Crie uma regra para receber alertas automáticos por email ou notificação.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Regra', 'Condição', 'Período', 'Plataforma', 'Destinatários', 'Ativo', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{rule.name}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {METRIC_LABELS[rule.metric] ?? rule.metric}{' '}
                    {rule.operator}{' '}
                    {rule.threshold}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {rule.periodDays}d
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {rule.platform ? PLATFORM_LABELS[rule.platform] ?? rule.platform : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {rule.recipients.length > 0 ? `${rule.recipients.length} email(s)` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => update.mutate({ id: rule.id, input: { enabled: !rule.enabled } })}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {rule.enabled
                        ? <ToggleRight className="w-5 h-5 text-primary" />
                        : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditing(rule); setModalOpen(true) }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir regra "${rule.name}"?`)) remove.mutate(rule.id)
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modalOpen || editing) && (
        <RuleModal
          initial={editing}
          onClose={() => { setModalOpen(false); setEditing(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ─── Events Tab ───────────────────────────────────────────────────────────────

function EventsTab() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['alerts', 'events'],
    queryFn: () => alertsApi.listEvents(100),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Carregando histórico...</div>
  }

  if (events.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-3 text-center">
        <Bell className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">Nenhum alerta disparado</p>
        <p className="text-xs text-muted-foreground">O histórico de alertas aparecerá aqui.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['Mensagem', 'Regra', 'Disparado em', 'Email'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-sm text-foreground max-w-xs">{ev.message}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{ev.ruleName}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(ev.triggeredAt)}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium ${ev.notified ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {ev.notified ? 'Enviado' : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AlertsPage() {
  const [tab, setTab] = useState<'rules' | 'events'>('rules')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Alertas</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([['rules', 'Regras'], ['events', 'Histórico']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'rules' ? <RulesTab /> : <EventsTab />}
    </div>
  )
}
