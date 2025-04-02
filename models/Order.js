import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true
    },
    name: { 
      type: String, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true,
      min: 1
    }
  }],
  totalPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  shippingAddress: { 
    type: String, 
    required: true 
  },
  customerName: { 
    type: String, 
    required: true 
  },
  customerEmail: { 
    type: String, 
    required: true 
  },
  customerPhone: { 
    type: String, 
    required: true 
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  notes: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;