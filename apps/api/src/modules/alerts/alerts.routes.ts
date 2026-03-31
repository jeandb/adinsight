import { Router, type Router as ExpressRouter } from 'express'
import { alertsController } from './alerts.controller'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'

const router: ExpressRouter = Router()

router.use(requireAuth)

// GET  /api/alerts          — list all rules
router.get('/', alertsController.listRules)

// POST /api/alerts          — create rule (admin only)
router.post(
  '/',
  requireRole(UserRole.ADMIN),
  alertsController.createRule,
)

// PUT  /api/alerts/:id      — update rule (admin only)
router.put(
  '/:id',
  requireRole(UserRole.ADMIN),
  alertsController.updateRule,
)

// DELETE /api/alerts/:id    — delete rule (admin only)
router.delete(
  '/:id',
  requireRole(UserRole.ADMIN),
  alertsController.deleteRule,
)

// GET  /api/alerts/events   — recent triggered events
router.get('/events', alertsController.listEvents)

// POST /api/alerts/evaluate — manual trigger (admin only)
router.post(
  '/evaluate',
  requireRole(UserRole.ADMIN),
  alertsController.evaluate,
)

export { router as alertsRoutes }
