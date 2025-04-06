import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Create a new order (works with or without authentication)
export const createOrder = async (req, res) => {
  try {
    // Set explicit CORS headers for this route
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    const {
      items,
      totalPrice,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      notes
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    let userId = null;

    // Log authentication status for debugging
    console.log('Authentication status:', req.user ? 'Authenticated' : 'Not authenticated');
    if (req.user) {
      console.log('User ID:', req.user._id);
      console.log('User email:', req.user.email);
    }
    console.log('Customer email from request:', customerEmail);

    // If user is authenticated, use their ID
    if (req.user && req.user._id) {
      console.log('Using authenticated user ID for order');
      userId = req.user._id;
    } else {
      // For non-authenticated users, find existing user by email
      try {
        console.log('Looking for existing user with email:', customerEmail);
        const existingUser = await User.findOne({ email: customerEmail });

        if (existingUser) {
          console.log('Found existing user:', existingUser._id);
          userId = existingUser._id;
        } else {
          console.log('No existing user found, proceeding as guest');
          // We'll create the order without a user ID
          userId = null;
        }
      } catch (error) {
        console.error('Error finding user:', error);
        // Continue with null userId if user lookup fails
        userId = null;
      }
    }

    // Create the order without attempting to create a new user
    const order = new Order({
      user: userId,
      items,
      totalPrice,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      notes,
      isGuestOrder: !userId
    });

    await order.save();

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt
      },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);

    // Set CORS headers again to ensure they're present in error responses
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }

    // Handle MongoDB duplicate key errors specifically
    if (error.code === 11000) {
      console.log('Duplicate key error detected');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        error: 'Duplicate email address'
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Server error while creating order',
      error: error.message
    });
  }
};

// Create a new order for guests (no authentication required)
export const createGuestOrder = async (req, res) => {
  try {
    // Set explicit CORS headers for this route
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    const {
      items,
      totalPrice,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      notes
    } = req.body;

    // Find or create a guest user
    let guestUser = await User.findOne({ email: customerEmail, role: 'guest' });

    if (!guestUser) {
      // Create a new guest user
      const randomPassword = Math.random().toString(36).slice(-8);
      guestUser = await User.create({
        username: `guest_${Date.now()}`,
        email: customerEmail,
        password: randomPassword,
        role: 'guest'
      });
    }

    // Create the order with the guest user
    const order = new Order({
      user: guestUser._id,
      items,
      totalPrice,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      notes,
      isGuestOrder: true
    });

    await order.save();

    // Update product stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt
      },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating guest order:', error);

    // Set CORS headers again to ensure they're present in error responses
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }

    // Handle MongoDB duplicate key errors specifically
    if (error.code === 11000) {
      console.log('Duplicate key error detected in guest order');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        error: 'Duplicate email address'
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Server error while creating guest order',
      error: error.message
    });
  }
};

// Get all orders (admin gets all, users get their own)
export const getOrders = async (req, res) => {
  try {
    let orders;

    // Admin can see all orders, users can only see their own
    if (req.user.role === 'admin') {
      orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('user', 'username email');
    } else {
      orders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update payment status (admin only)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel an order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to cancel this order
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Only allow cancellation if order is pending or processing
    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({
        message: 'Cannot cancel order. Order is already shipped or delivered.'
      });
    }

    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
