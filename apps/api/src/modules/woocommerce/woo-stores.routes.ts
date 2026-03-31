import { Router, type Router as ExpressRouter } from 'express'
import multer from 'multer'
import { wooStoresController } from './woo-stores.controller'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'

const router: ExpressRouter = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.use(requireAuth)

// GET  /api/woo-stores              — list all stores with status
router.get('/', wooStoresController.listStores)

// GET  /api/woo-stores/orders       — paginated orders (all stores or filtered)
router.get('/orders', wooStoresController.listOrders)

// GET  /api/woo-stores/template     — download CSV import template
router.get('/template', wooStoresController.downloadTemplate)

// POST /api/woo-stores              — create new store (admin only)
router.post('/', requireRole(UserRole.ADMIN), wooStoresController.createStore)

// PATCH /api/woo-stores/:id         — update store metadata (name, url, sourceType)
router.patch('/:id', requireRole(UserRole.ADMIN), wooStoresController.updateStore)

// DELETE /api/woo-stores/:id        — delete store (admin only)
router.delete('/:id', requireRole(UserRole.ADMIN), wooStoresController.deleteStore)

// PATCH /api/woo-stores/:id/credentials  — save/update credentials (admin only)
router.patch('/:id/credentials', requireRole(UserRole.ADMIN), wooStoresController.saveCredentials)

// DELETE /api/woo-stores/:id/credentials
router.delete('/:id/credentials', requireRole(UserRole.ADMIN), wooStoresController.clearCredentials)

// POST /api/woo-stores/:id/test-connection
router.post('/:id/test-connection', requireRole(UserRole.ADMIN), wooStoresController.testConnection)

// POST /api/woo-stores/:id/sync   — manual sync trigger (WooCommerce stores only)
router.post('/:id/sync', requireRole(UserRole.ADMIN), wooStoresController.syncStore)

// POST /api/woo-stores/:id/import  — upload Excel/CSV file for manual stores
router.post(
  '/:id/import',
  requireRole(UserRole.ADMIN),
  upload.single('file'),
  wooStoresController.importFile,
)

export { router as wooStoresRoutes }
