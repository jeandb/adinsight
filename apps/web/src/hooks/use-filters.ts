import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

export type PeriodKey = 'last_7d' | 'last_14d' | 'last_30d' | 'this_month' | 'last_month' | 'custom'

export interface DashboardFilters {
  period: PeriodKey
  date_from?: string
  date_to?: string
  channel_id?: string
  platform?: 'META' | 'GOOGLE' | 'TIKTOK' | 'PINTEREST'
  objective?: string
}

const DEFAULTS: DashboardFilters = { period: 'this_month' }

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: DashboardFilters = {
    period: (searchParams.get('period') as PeriodKey) ?? DEFAULTS.period,
    date_from: searchParams.get('date_from') ?? undefined,
    date_to: searchParams.get('date_to') ?? undefined,
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

  const setMultiple = useCallback(
    (updates: Partial<Record<keyof DashboardFilters, string | undefined>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(updates)) {
            if (!value) next.delete(key)
            else next.set(key, value)
          }
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

  return { filters, setFilter, setMultiple, resetFilters }
}
