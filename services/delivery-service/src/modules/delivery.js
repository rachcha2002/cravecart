const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  driverId: {
    type: String,
    required: true,
  },
  acceptTime: { 
    type: Date,
    required: true,
  },
  pickupTime: { 
    type: Date,
    required: true,
  },
  deliveredTime: {
    type: Date,
    required: true,
  },
  earnMoney: { 
    type: Number,
    required: true,
    default: 0,
  },
  earnRate: { 
    type: Number, 
    required: true,
  },
}, { timestamps: true }); 

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
