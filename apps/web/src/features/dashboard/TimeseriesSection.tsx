import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type TimeseriesPoint } from './dashboard.api'
import type { DashboardFilters } from '@/hooks/use-filters'

interface TimeseriesSectionProps {
  filters: DashboardFilters
}

type MetricKey = 'spend' | 'impressions' | 'clicks' | 'leads' | 'roas'

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'spend', label: 'Investimento' },
  { key: 'impressions', label: 'Impressões' },
  { key: 'clicks', label: 'Cliques' },
  { key: 'leads', label: 'Leads' },
  { key: 'roas', label: 'ROAS' },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatValue(metric: MetricKey, value: number): string {
  if (metric === 'spend') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      value / 100,
    )
  }
  if (metric === 'roas') return `${value.toFixed(2)}x`
  return new Intl.NumberFormat('pt-BR').format(Math.round(value))
}

interface LineChartProps {
  data: TimeseriesPoint[]
  metric: MetricKey
}

function SimpleLineChart({ data, metric }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        Sem dados para o período selecionado
      </div>
    )
  }

  const values = data.map((d) => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const chartWidth = 100
  const chartHeight = 100
  const paddingX = 2
  const paddingY = 5

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (chartWidth - paddingX * 2)
    const y =
      chartHeight -
      paddingY -
      ((d.value - minVal) / range) * (chartHeight - paddingY * 2)
    return { x, y, ...d }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${chartHeight - paddingY}` +
    ` L ${points[0].x} ${chartHeight - paddingY} Z`

  return (
    <div className="relative h-64 select-none">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill="url(#chart-gradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill="hsl(var(--primary))"
            vectorEffect="non-scaling-stroke"
            className="opacity-0 hover:opacity-100 cursor-pointer transition-opacity"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Active dot */}
        {hoveredIndex !== null && (
          <circle
            cx={points[hoveredIndex].x}
            cy={points[hoveredIndex].y}
            r="2"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute pointer-events-none z-10 bg-popover border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
            top: `${(points[hoveredIndex].y / chartHeight) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <p className="font-medium text-foreground">
            {formatValue(metric, data[hoveredIndex].value)}
          </p>
          <p className="text-muted-foreground">{formatDate(data[hoveredIndex].date)}</p>
        </div>
      )}

      {/* X axis labels (show ~5 evenly spaced) */}
      <div className="flex justify-between mt-1 px-1">
        {data
          .filter((_, i) => {
            if (data.length <= 7) return true
            const step = Math.floor(data.length / 5)
            return i % step === 0 || i === data.length - 1
          })
          .slice(0, 6)
          .map((d, i) => (
            <span key={i} className="text-xs text-muted-foreground">
              {formatDate(d.date)}
            </span>
          ))}
      </div>
    </div>
  )
}

export function TimeseriesSection({ filters }: TimeseriesSectionProps) {
  const [metric, setMetric] = useState<MetricKey>('spend')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'timeseries', filters, metric],
    queryFn: () => dashboardApi.getTimeseries(filters, metric),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Evolução Temporal</h2>
        <div className="flex gap-1 flex-wrap">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                metric === m.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse bg-muted rounded-lg" />
      ) : isError || !data ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Não foi possível carregar os dados. Tente novamente.
        </div>
      ) : (
        <SimpleLineChart data={data} metric={metric} />
      )}
    </div>
  )
}
