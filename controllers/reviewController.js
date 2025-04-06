import Review from '../models/Review.js';
import Product from '../models/Product.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    
    // Create new review
    const review = new Review({
      product: productId,
      user: req.user._id,
      rating,
      comment,
      userName: req.user.username
    });
    
    await review.save();
    
    // Update product rating
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    product.rating = averageRating;
    product.numReviews = reviews.length;
    await product.save();
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || productId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID provided'
      });
    }

    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error in getProductReviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is authorized to update this review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    
    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = Date.now();
    
    await review.save();
    
    // Update product rating
    const productId = review.product;
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const product = await Product.findById(productId);
    product.rating = averageRating;
    await product.save();
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is authorized to delete this review
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    const productId = review.product;
    
    await review.deleteOne();
    
    // Update product rating
    const reviews = await Review.find({ product: productId });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, item) => sum + item.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      const product = await Product.findById(productId);
      product.rating = averageRating;
      product.numReviews = reviews.length;
      await product.save();
    } else {
      // No reviews left, reset rating
      const product = await Product.findById(productId);
      product.rating = 0;
      product.numReviews = 0;
      await product.save();
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
