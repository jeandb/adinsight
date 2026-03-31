import { useWebSocketStore } from '@/stores/websocket.store'
import type { WsEvent } from './websocket.events'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'
let retryTimeout: ReturnType<typeof setTimeout> | null = null
let retryDelay = 1000

export function connectWebSocket(token: string): void {
  const store = useWebSocketStore.getState()
  if (store.status === 'connected' || store.status === 'connecting') return

  store.setStatus('connecting')

  const ws = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`)

  ws.onopen = () => {
    store.setStatus('connected')
    store.setWs(ws)
    retryDelay = 1000
    console.log('[WS] conectado')
  }

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data as string) as WsEvent
      useWebSocketStore.getState().handlers.forEach((handler) => handler(parsed))
    } catch { /* ignore malformed messages */ }
  }

  ws.onerror = () => {
    // onclose will handle reconnect
  }

  ws.onclose = () => {
    store.setStatus('disconnected')
    store.setWs(null)
    // Reconnect with exponential backoff (max 30s)
    retryTimeout = setTimeout(() => {
      retryDelay = Math.min(retryDelay * 2, 30_000)
      connectWebSocket(token)
    }, retryDelay)
  }
}

export function disconnectWebSocket(): void {
  if (retryTimeout) clearTimeout(retryTimeout)
  const { ws } = useWebSocketStore.getState()
  ws?.close()
  useWebSocketStore.getState().setStatus('disconnected')
  useWebSocketStore.getState().setWs(null)
}
