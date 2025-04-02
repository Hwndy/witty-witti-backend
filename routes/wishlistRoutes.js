import express from 'express';
import { 
  addToWishlist, 
  removeFromWishlist, 
  getWishlist,
  clearWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

// Get user's wishlist
router.get('/', getWishlist);

// Add product to wishlist
router.post('/', addToWishlist);

// Remove product from wishlist
router.delete('/:productId', removeFromWishlist);

// Clear wishlist
router.delete('/', clearWishlist);

export default router;
