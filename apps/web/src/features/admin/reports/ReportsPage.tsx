import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Send, FileText, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { reportsApi, type CreateReportInput } from './reports.api'
import { cn } from '@/lib/utils'
import type { ScheduledReport } from '@adinsight/shared-types'

const FREQ_LABEL: Record<string, string>  = { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal' }
const FORMAT_LABEL: Record<string, string> = { pdf: 'PDF', csv: 'CSV', excel: 'Excel' }
const SCOPE_LABEL: Record<string, string>  = { campaigns: 'Campanhas', revenue: 'Faturamento', all: 'Completo' }

export function ReportsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ScheduledReport | null>(null)

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: reportsApi.list,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-reports'] }),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      reportsApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-reports'] }),
  })

  const sendNowMut = useMutation({
    mutationFn: (id: string) => reportsApi.sendNow(id),
  })

  function open(r?: ScheduledReport) { setEditing(r ?? null); setShowModal(true) }
  function close() { setShowModal(false); setEditing(null) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatórios Agendados</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure relatórios automáticos entregues por email
          </p>
        </div>
        <button
          onClick={() => open()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo relatório
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : reports.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum relatório agendado.</p>
          <p className="text-xs text-muted-foreground mt-1">Crie um relatório para receber análises automáticas por email.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {FREQ_LABEL[r.frequency]} · {FORMAT_LABEL[r.format]} · {SCOPE_LABEL[r.scope]} · {r.periodDays}d
                      {r.lastSentAt && <> · Último envio: {new Date(r.lastSentAt).toLocaleDateString('pt-BR')}</>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Destinatários: {r.recipients.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => toggleMut.mutate({ id: r.id, isActive: !r.isActive })}
                    disabled={toggleMut.isPending}
                    title={r.isActive ? 'Desativar' : 'Ativar'}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {r.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => sendNowMut.mutate(r.id)}
                    disabled={sendNowMut.isPending}
                    title="Enviar agora"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {sendNowMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => open(r)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMut.mutate(r.id)}
                    disabled={deleteMut.isPending}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ReportModal
          report={editing}
          onClose={close}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['scheduled-reports'] }); close() }}
        />
      )}
    </div>
  )
}

function ReportModal({ report, onClose, onSaved }: { report: ScheduledReport | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<CreateReportInput>({
    name:        report?.name        ?? '',
    frequency:   report?.frequency   ?? 'weekly',
    format:      report?.format      ?? 'pdf',
    scope:       report?.scope       ?? 'all',
    recipients:  report?.recipients  ?? [],
    periodDays:  report?.periodDays  ?? 30,
  })
  const [recipientInput, setRecipientInput] = useState('')

  const createMut = useMutation({ mutationFn: () => reportsApi.create(form), onSuccess: onSaved })
  const updateMut = useMutation({ mutationFn: () => reportsApi.update(report!.id, form), onSuccess: onSaved })

  const isPending = createMut.isPending || updateMut.isPending
  const canSave = form.name.trim() && form.recipients.length > 0

  function addRecipient() {
    const email = recipientInput.trim()
    if (email && !form.recipients.includes(email)) {
      setForm((f) => ({ ...f, recipients: [...f.recipients, email] }))
    }
    setRecipientInput('')
  }

  function removeRecipient(email: string) {
    setForm((f) => ({ ...f, recipients: f.recipients.filter((r) => r !== email) }))
  }

  const field = 'w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-foreground">
          {report ? 'Editar relatório' : 'Novo relatório agendado'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Nome</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Relatório semanal de campanhas" className={field} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Frequência</label>
              <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as typeof f.frequency }))} className={field}>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Formato</label>
              <select value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as typeof f.format }))} className={field}>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Escopo</label>
              <select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as typeof f.scope }))} className={field}>
                <option value="all">Completo</option>
                <option value="campaigns">Campanhas</option>
                <option value="revenue">Faturamento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Período (dias)</label>
              <input type="number" min={7} max={365} value={form.periodDays} onChange={(e) => setForm((f) => ({ ...f, periodDays: Number(e.target.value) }))} className={field} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Destinatários</label>
            <div className="flex gap-2">
              <input value={recipientInput} onChange={(e) => setRecipientInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())} placeholder="email@exemplo.com" className={cn(field, 'flex-1')} />
              <button onClick={addRecipient} type="button" className="px-3 py-2 bg-accent text-foreground rounded-lg text-sm hover:bg-accent/80 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.recipients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.recipients.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent rounded-full text-xs text-foreground">
                    {r}
                    <button onClick={() => removeRecipient(r)} className="hover:text-destructive transition-colors">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
          <button onClick={() => report ? updateMut.mutate() : createMut.mutate()} disabled={!canSave || isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
            {isPending ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Salvando...</span> : report ? 'Salvar' : 'Criar relatório'}
          </button>
        </div>
      </div>
    </div>
  )
}
