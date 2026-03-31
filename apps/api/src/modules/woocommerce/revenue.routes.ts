import { Router, type Router as ExpressRouter } from 'express'
import { revenueController } from './revenue.controller'
import { requireAuth } from '../../shared/middleware/auth.middleware'

const router: ExpressRouter = Router()

router.use(requireAuth)

// GET /api/revenue/kpis
router.get('/kpis', revenueController.getKpis)

// GET /api/revenue/timeseries
router.get('/timeseries', revenueController.getTimeseries)

// GET /api/revenue/by-store
router.get('/by-store', revenueController.getByStore)

// GET /api/revenue/roas-real
router.get('/roas-real', revenueController.getRoasReal)

export { router as revenueRoutes }
