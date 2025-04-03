import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Create a new order (for authenticated users)
export const createOrder = async (req, res) => {
  try {
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

    const order = new Order({
      user: req.user._id,
      items,
      totalPrice,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      notes
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

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
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
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    res.status(500).json({
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