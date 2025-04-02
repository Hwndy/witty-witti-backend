import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  general: {
    storeName: { type: String, required: true },
    storeEmail: { type: String, required: true },
    storePhone: { type: String, required: true },
    storeAddress: { type: String, required: true },
    currencySymbol: { type: String, default: '$' },
    taxRate: { type: Number, default: 0 }
  },
  payment: {
    enableCashOnDelivery: { type: Boolean, default: true },
    enableBankTransfer: { type: Boolean, default: true },
    bankName: { type: String },
    accountNumber: { type: String },
    accountName: { type: String }
  },
  notification: {
    orderConfirmation: { type: Boolean, default: true },
    orderStatusUpdate: { type: Boolean, default: true },
    lowStockAlert: { type: Boolean, default: true },
    newCustomerRegistration: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

export default mongoose.model('Settings', settingsSchema);