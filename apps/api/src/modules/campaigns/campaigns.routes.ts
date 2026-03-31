import { Router, type Router as ExpressRouter } from 'express'
import { campaignsController } from './campaigns.controller'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'

const router: ExpressRouter = Router()

router.use(requireAuth)

// GET /api/campaigns?channel=none  — review queue (admin + traffic-manager)
router.get(
  '/',
  requireRole(UserRole.ADMIN, UserRole.TRAFFIC_MANAGER),
  campaignsController.listUnassigned,
)

// PATCH /api/campaigns/:id/channel  — assign or clear channel
router.patch(
  '/:id/channel',
  requireRole(UserRole.ADMIN, UserRole.TRAFFIC_MANAGER),
  campaignsController.patchChannel,
)

export { router as campaignsRoutes }
