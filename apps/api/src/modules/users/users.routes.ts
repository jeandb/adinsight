import { Router, type Router as ExpressRouter } from 'express'
import { usersController } from './users.controller'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'

const router: ExpressRouter = Router()

// Ativação de conta via token de convite (pública)
router.post('/activate', usersController.activate)

// Rotas protegidas — apenas ADMIN
router.use(requireAuth, requireRole(UserRole.ADMIN))
router.get('/', usersController.list)
router.post('/invite', usersController.invite)
router.patch('/:id/role', usersController.updateRole)
router.patch('/:id/deactivate', usersController.deactivate)
router.patch('/:id/reactivate', usersController.reactivate)

export { router as usersRoutes }
