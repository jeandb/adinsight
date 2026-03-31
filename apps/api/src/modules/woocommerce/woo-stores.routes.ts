import { Router, type Router as ExpressRouter } from 'express'
import { wooStoresController } from './woo-stores.controller'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'

const router: ExpressRouter = Router()

router.use(requireAuth)

// GET  /api/woo-stores              — list all 3 stores with status
router.get('/', wooStoresController.listStores)

// GET  /api/woo-stores/orders       — paginated orders (all stores or filtered)
router.get('/orders', wooStoresController.listOrders)

// PATCH /api/woo-stores/:type/credentials  — save/update credentials (admin only)
router.patch(
  '/:type/credentials',
  requireRole(UserRole.ADMIN),
  wooStoresController.saveCredentials,
)

// POST /api/woo-stores/:type/test-connection
router.post(
  '/:type/test-connection',
  requireRole(UserRole.ADMIN),
  wooStoresController.testConnection,
)

// POST /api/woo-stores/:type/sync   — manual sync trigger
router.post(
  '/:type/sync',
  requireRole(UserRole.ADMIN),
  wooStoresController.syncStore,
)

// DELETE /api/woo-stores/:type/credentials
router.delete(
  '/:type/credentials',
  requireRole(UserRole.ADMIN),
  wooStoresController.clearCredentials,
)

export { router as wooStoresRoutes }
