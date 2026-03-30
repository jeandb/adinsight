import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Archive, RotateCcw, Tag } from 'lucide-react'
import { channelsApi, type Channel } from './channels.api'
import type { CreateChannelInput, UpdateChannelInput } from '@adinsight/shared-types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const PALETTE = [
  '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6',
  '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#84CC16',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
            value === color ? 'border-foreground scale-110' : 'border-transparent',
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function KeywordsInput({ value, onChange }: { value: string[]; onChange: (kw: string[]) => void }) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  function remove(kw: string) {
    onChange(value.filter((k) => k !== kw))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Digite e pressione Enter"
          className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-accent transition-colors"
        >
          Adicionar
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs font-medium text-foreground"
            >
              <Tag className="w-2.5 h-2.5" />
              {kw}
              <button
                type="button"
                onClick={() => remove(kw)}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface ChannelFormProps {
  initial?: Partial<Channel>
  onSave: (data: CreateChannelInput) => void
  onCancel: () => void
  isPending: boolean
  error?: string
}

function ChannelForm({ initial, onSave, onCancel, isPending, error }: ChannelFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [color, setColor] = useState(initial?.color ?? PALETTE[0])
  const [keywords, setKeywords] = useState<string[]>(initial?.keywords ?? [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ name, description: description || undefined, color, keywords })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Nome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="Ex: Loja das Profs"
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="Objetivo ou contexto do canal"
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Palavras-chave</label>
        <KeywordsInput value={keywords} onChange={setKeywords} />
        <p className="text-xs text-muted-foreground mt-1">
          Usadas para associar campanhas automaticamente ao canal
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isPending}
          className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

export function ChannelsPage() {
  const qc = useQueryClient()
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Channel | null>(null)
  const [formError, setFormError] = useState('')

  function getErrorMessage(err: unknown) {
    return (err as { response?: { data?: { error?: { message?: string } } } })
      ?.response?.data?.error?.message ?? 'Ocorreu um erro'
  }

  const create = useMutation({
    mutationFn: (input: CreateChannelInput) => channelsApi.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['channels'] }); setCreateOpen(false); setFormError('') },
    onError: (err) => setFormError(getErrorMessage(err)),
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateChannelInput }) =>
      channelsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['channels'] }); setEditTarget(null); setFormError('') },
    onError: (err) => setFormError(getErrorMessage(err)),
  })

  const archive = useMutation({
    mutationFn: (id: string) => channelsApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels'] }),
  })

  const restore = useMutation({
    mutationFn: (id: string) => channelsApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels'] }),
  })

  const active = channels.filter((c) => c.status === 'ACTIVE')
  const archived = channels.filter((c) => c.status === 'ARCHIVED')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Canais de Negócio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize campanhas por produto ou iniciativa
          </p>
        </div>
        <button
          onClick={() => { setCreateOpen(true); setFormError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo canal
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
      ) : (
        <div className="space-y-6">
          <ChannelList
            channels={active}
            onEdit={(c) => { setEditTarget(c); setFormError('') }}
            onArchive={(id) => archive.mutate(id)}
            archivePending={archive.isPending}
          />

          {archived.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Arquivados ({archived.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map((channel) => (
                  <div
                    key={channel.id}
                    className="bg-card border border-border rounded-xl p-4 opacity-60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: channel.color }} />
                      <span className="text-sm font-medium text-foreground">{channel.name}</span>
                    </div>
                    <button
                      onClick={() => restore.mutate(channel.id)}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      title="Restaurar"
                    >
                      <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal criar */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); setFormError('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo canal</DialogTitle>
          </DialogHeader>
          <ChannelForm
            onSave={(data) => create.mutate(data)}
            onCancel={() => setCreateOpen(false)}
            isPending={create.isPending}
            error={formError}
          />
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); setFormError('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar canal</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ChannelForm
              initial={editTarget}
              onSave={(data) => update.mutate({ id: editTarget.id, input: data })}
              onCancel={() => setEditTarget(null)}
              isPending={update.isPending}
              error={formError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ChannelList({
  channels,
  onEdit,
  onArchive,
  archivePending,
}: {
  channels: Channel[]
  onEdit: (c: Channel) => void
  onArchive: (id: string) => void
  archivePending: boolean
}) {
  if (channels.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
        Nenhum canal ativo. Crie o primeiro canal para começar.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((channel) => (
        <div key={channel.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: channel.color }} />
              <p className="font-medium text-foreground text-sm leading-tight">{channel.name}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(channel)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                title="Editar"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => onArchive(channel.id)}
                disabled={archivePending}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                title="Arquivar"
              >
                <Archive className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {channel.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{channel.description}</p>
          )}

          {channel.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {channel.keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
