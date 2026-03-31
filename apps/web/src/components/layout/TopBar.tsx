import { useState, useCallback } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { LogOut, RefreshCw, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useWebSocketEvent } from '@/hooks/use-websocket'
import type { WsEvent } from '@/lib/websocket/websocket.events'
import { cn } from '@/lib/utils'

const PLATFORM_LABEL: Record<string, string> = {
  META: 'Meta',
  GOOGLE: 'Google',
  TIKTOK: 'TikTok',
  PINTEREST: 'Pinterest',
}

export function TopBar() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const [syncingPlatforms, setSyncingPlatforms] = useState<Set<string>>(new Set())
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [lastSyncPlatform, setLastSyncPlatform] = useState<string | null>(null)
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  const handleSyncEvent = useCallback((event: WsEvent) => {
    if (event.type === 'sync:started') {
      setSyncingPlatforms((prev) => new Set([...prev, event.payload.platformType]))
    } else if (event.type === 'sync:completed') {
      setSyncingPlatforms((prev) => {
        const next = new Set(prev)
        next.delete(event.payload.platformType)
        return next
      })
      setLastSyncAt(new Date(event.payload.timestamp))
      setLastSyncPlatform(event.payload.platformType)
    } else if (event.type === 'sync:failed') {
      setSyncingPlatforms((prev) => {
        const next = new Set(prev)
        next.delete(event.payload.platformType)
        return next
      })
    }
  }, [])

  useWebSocketEvent('sync:started', handleSyncEvent)
  useWebSocketEvent('sync:completed', handleSyncEvent)
  useWebSocketEvent('sync:failed', handleSyncEvent)
  useWebSocketEvent('alert:triggered', useCallback(() => {
    setUnreadAlerts((n) => n + 1)
  }, []))

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  const isSyncing = syncingPlatforms.size > 0
  const syncingLabel = [...syncingPlatforms]
    .map((p) => PLATFORM_LABEL[p] ?? p)
    .join(', ')

  function formatLastSync(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return 'agora mesmo'
    if (diffMin === 1) return 'há 1 min'
    if (diffMin < 60) return `há ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH === 1) return 'há 1h'
    return `há ${diffH}h`
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      {/* Sync status indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isSyncing ? (
          <span className="flex items-center gap-1.5 text-blue-600">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Sincronizando {syncingLabel}...
          </span>
        ) : lastSyncAt ? (
          <span className={cn('flex items-center gap-1.5')}>
            <RefreshCw className="w-3.5 h-3.5" />
            {lastSyncPlatform && `${PLATFORM_LABEL[lastSyncPlatform] ?? lastSyncPlatform} · `}
            {formatLastSync(lastSyncAt)}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {/* Alert notification badge */}
        <NavLink
          to="/alerts"
          onClick={() => setUnreadAlerts(0)}
          className="relative text-muted-foreground hover:text-foreground transition-colors"
          title="Alertas"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </NavLink>

        <span className="text-sm text-muted-foreground">Olá, {user?.name?.split(' ')[0]}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </header>
  )
}
