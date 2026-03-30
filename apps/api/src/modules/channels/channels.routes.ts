import { Router, type Router as ExpressRouter } from 'express'
import { channelsController } from './channels.controller'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'

const router: ExpressRouter = Router()

const canWrite = requireRole(UserRole.ADMIN, UserRole.TRAFFIC_MANAGER)

router.get('/', requireAuth, channelsController.list)
router.post('/', requireAuth, canWrite, channelsController.create)
router.put('/:id', requireAuth, canWrite, channelsController.update)
router.patch('/:id/archive', requireAuth, canWrite, channelsController.archive)
router.patch('/:id/restore', requireAuth, canWrite, channelsController.restore)

export { router as channelsRoutes }
