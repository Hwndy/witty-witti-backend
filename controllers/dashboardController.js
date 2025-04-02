import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// Get dashboard stats (admin only)
export const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Calculate total revenue
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // Get low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } });
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username email');
    
    // Get sales by category
    const products = await Product.find();
    const categorySales = {};
    
    for (const order of orders) {
      for (const item of order.items) {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product) {
          if (!categorySales[product.category]) {
            categorySales[product.category] = 0;
          }
          categorySales[product.category] += item.price * item.quantity;
        }
      }
    }
    
    // Get monthly sales data for the last 6 months
    const monthlySales = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= month && orderDate < nextMonth;
      });
      
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      
      monthlySales.push({
        month: month.toLocaleString('default', { month: 'short' }),
        revenue: monthlyRevenue,
        orders: monthlyOrders.length
      });
    }
    
    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      lowStockProducts,
      recentOrders,
      categorySales,
      monthlySales
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sales report (admin only)
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'username email');
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalOrders = orders.length;
    
    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Get sales by payment method
    const salesByPaymentMethod = {};
    
    for (const order of orders) {
      if (!salesByPaymentMethod[order.paymentMethod]) {
        salesByPaymentMethod[order.paymentMethod] = 0;
      }
      salesByPaymentMethod[order.paymentMethod] += order.totalPrice;
    }
    
    // Get sales by status
    const salesByStatus = {};
    
    for (const order of orders) {
      if (!salesByStatus[order.status]) {
        salesByStatus[order.status] = 0;
      }
      salesByStatus[order.status] += order.totalPrice;
    }
    
    res.json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      salesByPaymentMethod,
      salesByStatus,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};