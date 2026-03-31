import { create } from 'zustand'
import type { WsEvent } from '@/lib/websocket/websocket.events'

type WsStatus = 'disconnected' | 'connecting' | 'connected'
type EventHandler = (event: WsEvent) => void

interface WebSocketStore {
  status: WsStatus
  ws: WebSocket | null
  handlers: Set<EventHandler>
  setStatus: (status: WsStatus) => void
  setWs: (ws: WebSocket | null) => void
  addHandler: (handler: EventHandler) => void
  removeHandler: (handler: EventHandler) => void
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  status: 'disconnected',
  ws: null,
  handlers: new Set(),
  setStatus: (status) => set({ status }),
  setWs: (ws) => set({ ws }),
  addHandler: (handler) => {
    const handlers = new Set(get().handlers)
    handlers.add(handler)
    set({ handlers })
  },
  removeHandler: (handler) => {
    const handlers = new Set(get().handlers)
    handlers.delete(handler)
    set({ handlers })
  },
}))
