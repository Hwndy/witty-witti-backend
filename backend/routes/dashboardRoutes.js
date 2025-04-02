import express from 'express';
import { getDashboardStats, getSalesReport } from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/stats', protect, admin, getDashboardStats);
router.get('/sales', protect, admin, getSalesReport);

export default router;
