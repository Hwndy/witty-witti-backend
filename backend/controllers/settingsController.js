import Settings from '../models/Settings.js';
import { ErrorResponse } from '../utils/errorHandler.js';

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        general: {
          storeName: 'My Store',
          storeEmail: 'store@example.com',
          storePhone: '+1234567890',
          storeAddress: 'Store Address',
          currencySymbol: '$',
          taxRate: 0
        },
        payment: {
          enableCashOnDelivery: true,
          enableBankTransfer: true,
          bankName: '',
          accountNumber: '',
          accountName: ''
        },
        notification: {
          orderConfirmation: true,
          orderStatusUpdate: true,
          lowStockAlert: true,
          newCustomerRegistration: true
        }
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings
// @route   POST /api/settings
// @access  Private
export const updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne();

    if (!settings) {
      return next(new ErrorResponse('Settings not found', 404));
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      {
        general: req.body.generalSettings,
        payment: req.body.paymentSettings,
        notification: req.body.notificationSettings
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};