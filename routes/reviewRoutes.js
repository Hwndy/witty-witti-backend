import express from 'express';
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getUserReviews
} from '../controllers/reviewController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new review
router.post('/', protect, createReview);

// Get all reviews for a product
router.get('/product/:productId', optionalAuth, getProductReviews);

// Get user's reviews
router.get('/user', protect, getUserReviews);

// Update a review
router.put('/:id', protect, updateReview);

// Delete a review
router.delete('/:id', protect, deleteReview);

export default router;
