import { Router, type Router as ExpressRouter } from 'express'
import { platformsController } from './platforms.controller'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'

const router: ExpressRouter = Router()

router.use(requireAuth, requireRole(UserRole.ADMIN))

router.get('/', platformsController.list)
router.put('/:type/credentials', platformsController.saveCredentials)
router.post('/:type/test-connection', platformsController.testConnection)
router.post('/:type/sync', platformsController.syncPlatform)
router.delete('/:type/credentials', platformsController.clearCredentials)

export { router as platformsRoutes }
