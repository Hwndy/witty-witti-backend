import express from 'express';
import {
  createOrder,
  createGuestOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/', createOrder);  // Now works with or without authentication
router.post('/guest', createGuestOrder);  // Keep for backward compatibility
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/payment', protect, admin, updatePaymentStatus);
router.put('/:id/cancel', protect, cancelOrder);

export default router;
