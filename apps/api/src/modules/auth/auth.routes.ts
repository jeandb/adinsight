import { Router, type Router as ExpressRouter } from 'express'
import rateLimit from 'express-rate-limit'
import { authController } from './auth.controller'
import { requireAuth } from '../../shared/middleware/auth.middleware'

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Tente novamente em 10 minutos.' } },
  standardHeaders: true,
  legacyHeaders: false,
})

const router: ExpressRouter = Router()

router.get('/check-setup', authController.checkSetup)
router.post('/setup', authController.setup)
router.post('/login', loginLimiter, authController.login)
router.post('/refresh', authController.refresh)
router.get('/me', requireAuth, authController.me)

export { router as authRoutes }
