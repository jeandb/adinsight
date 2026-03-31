import 'dotenv/config'
import express, { type Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import { errorMiddleware } from './shared/middleware/error.middleware'
import { authRoutes } from './modules/auth/auth.routes'
import { usersRoutes } from './modules/users/users.routes'
import { platformsRoutes } from './modules/platforms/platforms.routes'
import { channelsRoutes } from './modules/channels/channels.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { campaignsRoutes } from './modules/campaigns/campaigns.routes'
import { alertsRoutes } from './modules/alerts/alerts.routes'
import { wooStoresRoutes, revenueRoutes } from './modules/woocommerce'
import { aiRoutes } from './modules/ai/ai.routes'
import { initWebSocketServer } from './shared/websocket/websocket.server'
import { redisConnection } from './shared/queue/queue.client'
import { startSyncWorker } from './shared/queue/sync-campaigns.worker'
import { startEvaluateAlertsWorker } from './shared/queue/evaluate-alerts.worker'
import { startSyncWooWorker } from './shared/queue/sync-woocommerce.worker'
import { startAiAnalysisWorker } from './shared/queue/ai-analysis.worker'
import { initScheduler } from './config/scheduler'

const app: Application = express()

app.use(helmet())
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', env: env.NODE_ENV } })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/platforms', platformsRoutes)
app.use('/api/channels', channelsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/campaigns', campaignsRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/woo-stores', wooStoresRoutes)
app.use('/api/revenue', revenueRoutes)
app.use('/api/ai', aiRoutes)

app.use(errorMiddleware)

const server = app.listen(env.PORT, () => {
  console.log(`✅ API rodando em http://localhost:${env.PORT} [${env.NODE_ENV}]`)
})

// WebSocket
initWebSocketServer(server)

// Queue worker + scheduler (only if Redis is available)
if (redisConnection) {
  startSyncWorker()
  startEvaluateAlertsWorker()
  startSyncWooWorker()
  startAiAnalysisWorker()
  initScheduler().catch(console.error)
}

export { app, server }
