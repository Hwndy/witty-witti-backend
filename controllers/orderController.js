import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Create a new order (works with or without authentication)
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

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId && !item.product) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must have a product ID'
        });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must have a valid quantity'
        });
      }
    }

    if (!totalPrice || !shippingAddress || !customerName || !customerEmail || !customerPhone || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order fields'
      });
    }

    let userId;

    // If user is authenticated, use their ID
    if (req.user && req.user._id) {
      userId = req.user._id;
    } else {
      // For non-authenticated users, find or create a guest user
      let guestUser = await User.findOne({ email: customerEmail, role: 'guest' });

      if (!guestUser) {
        const randomPassword = Math.random().toString(36).slice(-8);
        guestUser = await User.create({
          username: `guest_${Date.now()}`,
          email: customerEmail,
          password: randomPassword,
          role: 'guest'
        });
      }
      userId = guestUser._id;
    }

    // Prepare order items with proper product references
    // For items without product IDs, try to find the product by name
    const orderItems = [];

    for (const item of items) {
      const productId = item.productId || item.product;

      // If product ID is missing but name is present, try to find the product by name
      if (!productId && item.name) {
        try {
          console.log(`Looking up product by name: ${item.name}`);
          const product = await Product.findOne({
            name: { $regex: new RegExp('^' + item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
          });

          if (product) {
            console.log(`Found product by name: ${item.name}, ID: ${product._id}`);
            orderItems.push({
              product: product._id,
              name: item.name,
              price: item.price || product.price,
              quantity: item.quantity,
              image: item.image || product.image
            });
          } else {
            console.log(`Product not found by name: ${item.name}`);
            // Use a temporary ObjectId for items without a matching product
            orderItems.push({
              product: new mongoose.Types.ObjectId(),
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image
            });
          }
        } catch (error) {
          console.error(`Error looking up product by name: ${item.name}`, error);
          // Use a temporary ObjectId for items with lookup errors
          orderItems.push({
            product: new mongoose.Types.ObjectId(),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          });
        }
      } else {
        // Item has a product ID, use it as is
        orderItems.push({
          product: productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        });
      }
    }

    // Create the order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalPrice,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      notes,
      isGuestOrder: !req.user
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      try {
        // Skip stock update for items with temporary ObjectIds
        if (!mongoose.Types.ObjectId.isValid(item.product)) {
          console.log(`Skipping stock update for invalid product ID: ${item.product}`);
          continue;
        }

        const product = await Product.findById(item.product);
        if (product) {
          product.stock -= item.quantity;
          await product.save();
          console.log(`Updated stock for product ${product.name} (${item.product}) to ${product.stock}`);
        } else {
          console.log(`Product not found for stock update: ${item.product}`);
        }
      } catch (error) {
        console.error(`Error updating stock for product ${item.product}:`, error);
      }
    }

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items
      },
      message: 'Order created successfully'
    });
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

    // Log the items for debugging
    console.log('Guest order items received:', JSON.stringify(items, null, 2));

    // Validate each item has the required fields
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must have a valid quantity'
        });
      }

      // If product ID is missing but name is present, we'll try to find the product by name later
      if (!item.product && !item.name) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must have either a product ID or a product name'
        });
      }
    }

    // Prepare order items with proper product references
    // For items without product IDs, try to find the product by name
    const formattedItems = [];

    for (const item of items) {
      const productId = item.productId || item.product;

      // If product ID is missing but name is present, try to find the product by name
      if (!productId && item.name) {
        try {
          console.log(`Looking up product by name: ${item.name}`);
          const product = await Product.findOne({
            name: { $regex: new RegExp('^' + item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
          });

          if (product) {
            console.log(`Found product by name: ${item.name}, ID: ${product._id}`);
            formattedItems.push({
              product: product._id,
              name: item.name,
              price: item.price || product.price,
              quantity: item.quantity,
              image: item.image || product.image
            });
          } else {
            console.log(`Product not found by name: ${item.name}`);
            // Use a temporary ObjectId for items without a matching product
            formattedItems.push({
              product: new mongoose.Types.ObjectId(),
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image
            });
          }
        } catch (error) {
          console.error(`Error looking up product by name: ${item.name}`, error);
          // Use a temporary ObjectId for items with lookup errors
          formattedItems.push({
            product: new mongoose.Types.ObjectId(),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          });
        }
      } else {
        // Item has a product ID, use it as is
        formattedItems.push({
          product: productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        });
      }
    }

    console.log('Formatted guest order items:', JSON.stringify(formattedItems, null, 2));

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
      items: formattedItems,
      totalPrice,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      notes,
      isGuestOrder: true
    });

    // Log the order before saving
    console.log('Guest order to be saved:', JSON.stringify({
      user: guestUser._id,
      items: formattedItems.map(item => ({ product: item.product, quantity: item.quantity })),
      totalPrice,
      customerEmail,
      isGuestOrder: true
    }, null, 2));

    try {
      await order.save();
      console.log('Guest order saved successfully with ID:', order._id);
    } catch (validationError) {
      console.error('Guest order validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Invalid order data',
        error: validationError.message
      });
    }

    // Update product stock
    for (const item of formattedItems) {
      try {
        // Skip stock update for items with temporary ObjectIds
        if (!mongoose.Types.ObjectId.isValid(item.product)) {
          console.log(`Skipping stock update for invalid product ID: ${item.product}`);
          continue;
        }

        const product = await Product.findById(item.product);
        if (product) {
          product.stock -= item.quantity;
          await product.save();
          console.log(`Updated stock for product ${product.name} (${item.product}) to ${product.stock}`);
        } else {
          console.log(`Product not found for stock update: ${item.product}`);
        }
      } catch (error) {
        console.error(`Error updating stock for product ${item.product}:`, error);
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

    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.log('Validation error detected in guest order:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid order data',
        error: error.message,
        details: error.errors
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
