import { Router, type Router as ExpressRouter } from 'express'
import { dashboardController } from './dashboard.controller'
import { requireAuth } from '../../shared/middleware/auth.middleware'

const router: ExpressRouter = Router()

router.get('/kpis', requireAuth, dashboardController.kpis)
router.get('/timeseries', requireAuth, dashboardController.timeseries)
router.get('/distribution', requireAuth, dashboardController.distribution)
router.get('/top-campaigns', requireAuth, dashboardController.topCampaigns)
router.get('/campaigns', requireAuth, dashboardController.campaigns)

export { router as dashboardRoutes }
