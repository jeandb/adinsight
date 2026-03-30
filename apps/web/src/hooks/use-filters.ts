import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

export type PeriodKey = 'last_7d' | 'last_14d' | 'last_30d' | 'this_month' | 'last_month'

export interface DashboardFilters {
  period: PeriodKey
  channel_id?: string
  platform?: 'META' | 'GOOGLE' | 'TIKTOK' | 'PINTEREST'
  objective?: string
}

const DEFAULTS: DashboardFilters = { period: 'last_30d' }

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: DashboardFilters = {
    period: (searchParams.get('period') as PeriodKey) ?? DEFAULTS.period,
    channel_id: searchParams.get('channel_id') ?? undefined,
    platform: (searchParams.get('platform') as DashboardFilters['platform']) ?? undefined,
    objective: searchParams.get('objective') ?? undefined,
  }

  const setFilter = useCallback(
    (key: keyof DashboardFilters, value: string | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (!value) next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  return { filters, setFilter, resetFilters }
}
