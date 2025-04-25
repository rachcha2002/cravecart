const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for detailed price calculation
const PriceCalculationSchema = new Schema({
  foodSubtotal: {
    type: Number,
    required: true
  },
  restaurantCommission: {
    type: Number,
    required: true
  },
  baseDeliveryFee: {
    type: Number,
    required: true
  },
  extraDistanceFee: {
    type: Number,
    default: 0
  },
  totalDeliveryFee: {
    type: Number,
    required: true
  },
  tipAmount: {
    type: Number,
    default: 0
  },
  serviceFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  driverEarnings: {
    type: Number,
    default: 0
  },
  companyFee: {
    type: Number,
    default: 0
  }
}, { _id: false });

const OrderSchema = new Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: Object,
    required: true
  },

  restaurant: {
    type: Object,
    required: true
  },

  foods: [{
    type: Object
  }],

  status: {
    type: String,
    enum: [
      'order-received',
      'preparing-your-order',
      'wrapping-up',
      'picking-up',
      'heading-your-way',
      'delivered',
      'cancelled'
    ],
    default: 'order-received'
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },

  // Price calculation fields
  priceCalculation: {
    type: PriceCalculationSchema,
    required: true
  },
  
  // Legacy fields for backward compatibility
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  
  // Delivery distance
  deliveryDistanceKM: {
    type: Number,
    required: true
  },
  
  paymentId: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: String,
   
  },
  deliveryLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  deliveryInstructions: String,
  deliveryTimeline: [{
    status: String,
    time: Date,
    description: String
  }],
  estimatedDeliveryTime: Date,

  driver: {
    type: Object
  },

  driverCurrentLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema); 