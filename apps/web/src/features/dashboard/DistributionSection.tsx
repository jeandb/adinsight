import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from './dashboard.api'
import type { DashboardFilters } from '@/hooks/use-filters'

interface DistributionSectionProps {
  filters: DashboardFilters
}

type GroupBy = 'platform' | 'channel'

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'platform', label: 'Por Plataforma' },
  { key: 'channel', label: 'Por Canal' },
]

interface DonutChartProps {
  items: { label: string; color: string; value: number; percentage: number }[]
}

function DonutChart({ items }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">
        Sem dados disponíveis
      </div>
    )
  }

  const size = 120
  const cx = size / 2
  const cy = size / 2
  const outerR = 52
  const innerR = 34

  let cumulative = 0
  const slices = items.map((item, i) => {
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const sweep = (item.percentage / 100) * 2 * Math.PI
    const endAngle = startAngle + sweep

    const x1 = cx + outerR * Math.cos(startAngle)
    const y1 = cy + outerR * Math.sin(startAngle)
    const x2 = cx + outerR * Math.cos(endAngle)
    const y2 = cy + outerR * Math.sin(endAngle)
    const x3 = cx + innerR * Math.cos(endAngle)
    const y3 = cy + innerR * Math.sin(endAngle)
    const x4 = cx + innerR * Math.cos(startAngle)
    const y4 = cy + innerR * Math.sin(startAngle)

    const largeArc = sweep > Math.PI ? 1 : 0

    const d = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ')

    cumulative += item.percentage / 100

    return { d, color: item.color, index: i }
  })

  const hoveredItem = hovered !== null ? items[hovered] : null

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          {slices.map((slice) => (
            <path
              key={slice.index}
              d={slice.d}
              fill={slice.color}
              opacity={hovered === null || hovered === slice.index ? 1 : 0.5}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovered(slice.index)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        {hoveredItem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs font-semibold text-foreground leading-tight text-center px-2">
              {hoveredItem.label}
            </p>
            <p className="text-xs text-muted-foreground">{hoveredItem.percentage.toFixed(1)}%</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function DistributionSection({ filters }: DistributionSectionProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('platform')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'distribution', filters, groupBy],
    queryFn: () => dashboardApi.getDistribution(filters, groupBy, 'spend'),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Distribuição</h2>
        <div className="flex gap-1">
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setGroupBy(opt.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                groupBy === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="mx-auto w-32 h-32 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : isError || !data ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
          Não foi possível carregar. Tente novamente.
        </div>
      ) : (
        <div className="space-y-4">
          <DonutChart items={data} />
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-foreground truncate">{item.label}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground shrink-0">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
