import { Router } from 'express'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'
import { reportsController } from './reports.controller'

export const reportsRoutes: ReturnType<typeof Router> = Router()

reportsRoutes.use(requireAuth)

// On-demand export (all authenticated users)
reportsRoutes.get('/export', reportsController.export)

// Scheduled reports management (admin only)
reportsRoutes.get('/',           requireRole(UserRole.ADMIN), reportsController.list)
reportsRoutes.post('/',          requireRole(UserRole.ADMIN), reportsController.create)
reportsRoutes.put('/:id',        requireRole(UserRole.ADMIN), reportsController.update)
reportsRoutes.delete('/:id',     requireRole(UserRole.ADMIN), reportsController.delete)
reportsRoutes.post('/:id/send',  requireRole(UserRole.ADMIN), reportsController.sendNow)
