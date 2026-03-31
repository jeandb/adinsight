import { WebSocketServer, WebSocket } from 'ws'
import { verify } from 'jsonwebtoken'
import { parse } from 'url'
import type { Server } from 'http'
import { env } from '../../config/env'
import type { WsEvent } from './websocket.events'

let wss: WebSocketServer | null = null

export function initWebSocketServer(server: Server): void {
  wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    const { query } = parse(request.url ?? '', true)
    const token = Array.isArray(query.token) ? query.token[0] : query.token

    if (!token) {
      socket.destroy()
      return
    }

    try {
      verify(token, env.JWT_SECRET)
    } catch {
      socket.destroy()
      return
    }

    wss!.handleUpgrade(request, socket as never, head, (ws) => {
      wss!.emit('connection', ws, request)
    })
  })

  wss.on('connection', (ws) => {
    ws.on('error', (err) => console.error('[WS]', err.message))
  })

  console.log('🔌 WebSocket server pronto')
}

export function broadcast(event: WsEvent): void {
  if (!wss) return
  const message = JSON.stringify(event)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}
