import 'dotenv/config'
import express, { type Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import { errorMiddleware } from './shared/middleware/error.middleware'
import { authRoutes } from './modules/auth/auth.routes'
import { usersRoutes } from './modules/users/users.routes'
import { platformsRoutes } from './modules/platforms/platforms.routes'

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

app.use(errorMiddleware)

app.listen(env.PORT, () => {
  console.log(`✅ API rodando em http://localhost:${env.PORT} [${env.NODE_ENV}]`)
})

export { app }
