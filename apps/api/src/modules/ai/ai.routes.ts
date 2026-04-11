import { Router } from 'express'
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware'
import { UserRole } from '@adinsight/shared-types'
import { aiController } from './ai.controller'

export const aiRoutes: ReturnType<typeof Router> = Router()

// All AI routes require authentication
aiRoutes.use(requireAuth)

// Providers (admin only)
aiRoutes.get('/providers', requireRole(UserRole.ADMIN), aiController.listProviders)
aiRoutes.post('/providers', requireRole(UserRole.ADMIN), aiController.createProvider)
aiRoutes.put('/providers/:id', requireRole(UserRole.ADMIN), aiController.updateProvider)
aiRoutes.delete('/providers/:id', requireRole(UserRole.ADMIN), aiController.deleteProvider)
aiRoutes.get('/providers/:id/models', requireRole(UserRole.ADMIN), aiController.listModels)

// Scenario assignments (admin only)
aiRoutes.get('/scenarios', requireRole(UserRole.ADMIN), aiController.listScenarios)
aiRoutes.put('/scenarios/:scenario', requireRole(UserRole.ADMIN), aiController.assignScenario)

// Chat (all authenticated users)
aiRoutes.post('/chat', aiController.chat)
aiRoutes.post('/analyze', aiController.analyze)
aiRoutes.get('/history', aiController.getHistory)
