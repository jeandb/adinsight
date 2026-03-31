import { useEffect } from 'react'
import { useWebSocketStore } from '@/stores/websocket.store'
import { connectWebSocket } from '@/lib/websocket/websocket.client'
import { useAuthStore } from '@/stores/auth.store'
import type { WsEvent } from '@/lib/websocket/websocket.events'

export function useWebSocketConnection(): void {
  const accessToken = useAuthStore((s) => s.accessToken)
  const status = useWebSocketStore((s) => s.status)

  useEffect(() => {
    if (!accessToken || status !== 'disconnected') return
    connectWebSocket(accessToken)
  }, [accessToken, status])
}

export function useWebSocketEvent(
  eventType: WsEvent['type'],
  handler: (event: WsEvent) => void,
): void {
  const addHandler = useWebSocketStore((s) => s.addHandler)
  const removeHandler = useWebSocketStore((s) => s.removeHandler)

  useEffect(() => {
    const wrappedHandler = (event: WsEvent) => {
      if (event.type === eventType) handler(event)
    }
    addHandler(wrappedHandler)
    return () => removeHandler(wrappedHandler)
  }, [eventType, handler, addHandler, removeHandler])
}
