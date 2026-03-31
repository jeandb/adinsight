import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, CheckCircle2 } from 'lucide-react'
import { campaignsApi, type UnassignedCampaign } from '@/features/campaigns/campaigns.api'
import { channelsApi } from '@/features/admin/channels/channels.api'

const PLATFORM_LABELS: Record<string, string> = {
  META: 'Meta',
  GOOGLE: 'Google',
  TIKTOK: 'TikTok',
  PINTEREST: 'Pinterest',
}

const PLATFORM_COLORS: Record<string, string> = {
  META: '#1877F2',
  GOOGLE: '#EA4335',
  TIKTOK: '#000000',
  PINTEREST: '#E60023',
}

const OBJECTIVE_LABELS: Record<string, string> = {
  AWARENESS: 'Awareness',
  TRAFFIC: 'Tráfego',
  ENGAGEMENT: 'Engajamento',
  LEADS: 'Leads',
  APP_PROMOTION: 'App',
  SALES: 'Vendas',
}

const PAGE_LIMIT = 30

function CampaignRow({
  campaign,
  onAssigned,
}: {
  campaign: UnassignedCampaign
  onAssigned: () => void
}) {
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
    staleTime: 10 * 60 * 1000,
  })

  const activeChannels = channels.filter((c) => c.status === 'ACTIVE')

  const assign = useMutation({
    mutationFn: (channelId: string) => campaignsApi.updateChannel(campaign.id, channelId),
    onSuccess: () => onAssigned(),
  })

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <span className="text-sm text-foreground font-medium">{campaign.name}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
          style={{ backgroundColor: PLATFORM_COLORS[campaign.platform_type] ?? '#6B7280' }}
        >
          {PLATFORM_LABELS[campaign.platform_type] ?? campaign.platform_type}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective}
        </span>
      </td>
      <td className="px-4 py-3">
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) assign.mutate(e.target.value)
          }}
          disabled={assign.isPending || assign.isSuccess}
          className="w-52 px-2 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer disabled:opacity-50"
        >
          <option value="" disabled>
            Selecionar canal...
          </option>
          {activeChannels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 w-10">
        {assign.isSuccess && (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        )}
        {assign.isPending && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </td>
    </tr>
  )
}

export function ReviewQueuePage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaigns', 'unassigned', page],
    queryFn: () => campaignsApi.listUnassigned(page, PAGE_LIMIT),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const handleAssigned = useCallback(() => {
    // Delay refetch slightly so row shows the success icon before disappearing
    setTimeout(() => {
      qc.invalidateQueries({ queryKey: ['campaigns', 'unassigned'] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'campaigns'] })
    }, 800)
  }, [qc])

  const total = data?.meta.total ?? 0
  const totalPages = Math.ceil(total / PAGE_LIMIT)
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1
  const to = Math.min(page * PAGE_LIMIT, total)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Fila de Revisão</h1>
          {total > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
              {total > 99 ? '99+' : total}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Campanhas sem canal atribuído. Associe cada uma ao canal de negócio correto.
        </p>
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Carregando campanhas...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Não foi possível carregar a fila. Tente novamente.
          </div>
        ) : total === 0 ? (
          <div className="p-16 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
            <p className="text-xs text-muted-foreground">
              Todas as campanhas já estão associadas a um canal.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">
                      Campanha
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">
                      Plataforma
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">
                      Objetivo
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left">
                      Atribuir canal
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {data?.rows.map((campaign) => (
                    <CampaignRow
                      key={campaign.id}
                      campaign={campaign}
                      onAssigned={handleAssigned}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium text-foreground">{from}–{to}</span>{' '}
                  de{' '}
                  <span className="font-medium text-foreground">{total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
