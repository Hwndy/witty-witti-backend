import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser,
  getUserOrders,
  getUserStats
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/', protect, admin, getUsers);
router.get('/stats', protect, admin, getUserStats);
router.get('/:id', protect, admin, getUserById);
router.put('/:id/role', protect, admin, updateUserRole);
router.delete('/:id', protect, admin, deleteUser);

// User routes
router.get('/:id/orders', protect, getUserOrders);
router.get('/orders', protect, getUserOrders); // Get current user's orders

export default router;
