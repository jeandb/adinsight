import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'
import { dashboardApi, type CampaignRow } from './dashboard.api'
import type { DashboardFilters } from '@/hooks/use-filters'

interface CampaignsTableSectionProps {
  filters: DashboardFilters
}

type SortBy =
  | 'spend'
  | 'impressions'
  | 'clicks'
  | 'ctr'
  | 'cpc'
  | 'leads'
  | 'cpl'
  | 'roas'
type SortDir = 'asc' | 'desc'

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const formatNumber = (n: number) =>
  new Intl.NumberFormat('pt-BR').format(Math.round(n))

const formatPercent = (n: number) => `${n.toFixed(1)}%`

const formatROAS = (n: number) => `${n.toFixed(2)}x`

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

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ARCHIVED: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  ARCHIVED: 'Arquivada',
}

interface SortIconProps {
  column: SortBy
  currentSort: SortBy
  currentDir: SortDir
}

function SortIcon({ column, currentSort, currentDir }: SortIconProps) {
  if (column !== currentSort) return <ChevronsUpDown className="w-3 h-3 opacity-40" />
  if (currentDir === 'asc') return <ChevronUp className="w-3 h-3" />
  return <ChevronDown className="w-3 h-3" />
}

interface ColumnDef {
  key: SortBy | 'name' | 'platform' | 'channel' | 'objective' | 'status'
  label: string
  sortable: boolean
  align: 'left' | 'right'
  render: (row: CampaignRow) => React.ReactNode
}

const COLUMNS: ColumnDef[] = [
  {
    key: 'name',
    label: 'Campanha',
    sortable: false,
    align: 'left',
    render: (row) => (
      <span className="text-sm font-medium text-foreground max-w-xs truncate block">
        {row.name}
      </span>
    ),
  },
  {
    key: 'platform',
    label: 'Plataforma',
    sortable: false,
    align: 'left',
    render: (row) => (
      <span
        className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: PLATFORM_COLORS[row.platformType] ?? '#6B7280' }}
      >
        {PLATFORM_LABELS[row.platformType] ?? row.platformType}
      </span>
    ),
  },
  {
    key: 'channel',
    label: 'Canal',
    sortable: false,
    align: 'left',
    render: (row) =>
      row.channelName ? (
        <div className="flex items-center gap-1.5">
          {row.channelColor && (
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: row.channelColor }}
            />
          )}
          <span className="text-xs text-foreground whitespace-nowrap">{row.channelName}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    key: 'objective',
    label: 'Objetivo',
    sortable: false,
    align: 'left',
    render: (row) => (
      <span className="text-xs text-muted-foreground capitalize">
        {row.objective.toLowerCase().replace(/_/g, ' ')}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: false,
    align: 'left',
    render: (row) => (
      <span
        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STATUS_STYLES[row.status] ?? 'bg-muted text-muted-foreground'}`}
      >
        {STATUS_LABELS[row.status] ?? row.status}
      </span>
    ),
  },
  {
    key: 'spend',
    label: 'Gasto',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className="text-xs text-foreground tabular-nums">{formatCurrency(row.spendCents)}</span>
    ),
  },
  {
    key: 'impressions',
    label: 'Impressões',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className="text-xs text-foreground tabular-nums">{formatNumber(row.impressions)}</span>
    ),
  },
  {
    key: 'clicks',
    label: 'Cliques',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className="text-xs text-foreground tabular-nums">{formatNumber(row.clicks)}</span>
    ),
  },
  {
    key: 'ctr',
    label: 'CTR',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className="text-xs text-foreground tabular-nums">{formatPercent(row.ctr)}</span>
    ),
  },
  {
    key: 'cpc',
    label: 'CPC',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className="text-xs text-foreground tabular-nums">{formatCurrency(row.cpc)}</span>
    ),
  },
  {
    key: 'leads',
    label: 'Leads',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className="text-xs text-foreground tabular-nums">{formatNumber(row.leads)}</span>
    ),
  },
  {
    key: 'cpl',
    label: 'CPL',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className="text-xs text-foreground tabular-nums">{formatCurrency(row.cpl)}</span>
    ),
  },
  {
    key: 'roas',
    label: 'ROAS',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className="text-xs text-foreground tabular-nums">{formatROAS(row.roas)}</span>
    ),
  },
]

const PAGE_LIMIT = 20

export function CampaignsTableSection({ filters }: CampaignsTableSectionProps) {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortBy>('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'campaigns', filters, page, sortBy, sortDir, search],
    queryFn: () => dashboardApi.getCampaigns(filters, page, PAGE_LIMIT, sortBy, sortDir, search),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const handleSort = useCallback(
    (col: SortBy) => {
      if (col === sortBy) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(col)
        setSortDir('desc')
      }
      setPage(1)
    },
    [sortBy],
  )

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }, [searchInput])

  const total = data?.meta.total ?? 0
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1
  const to = Math.min(page * PAGE_LIMIT, total)
  const totalPages = Math.ceil(total / PAGE_LIMIT)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Todas as Campanhas</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar campanha..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring w-52"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setSearchInput('')
                setPage(1)
              }}
              className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}`}
                  onClick={col.sortable ? () => handleSort(col.key as SortBy) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <SortIcon
                        column={col.key as SortBy}
                        currentSort={sortBy}
                        currentDir={sortDir}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border animate-pulse">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-3">
                      <div className="h-3.5 bg-muted rounded w-16" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Não foi possível carregar as campanhas. Tente novamente.
                </td>
              </tr>
            ) : !data || data.rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  {search ? `Nenhuma campanha encontrada para "${search}"` : 'Nenhuma campanha encontrada no período.'}
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && !isError && data && total > 0 && (
        <div className="px-4 py-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Mostrando{' '}
            <span className="font-medium text-foreground">
              {from}–{to}
            </span>{' '}
            de{' '}
            <span className="font-medium text-foreground">{formatNumber(total)}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
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
    </div>
  )
}
