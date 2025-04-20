const Order = require('../models/order.model');
const { v4: uuidv4 } = require('uuid');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Check if orderId is provided from frontend
    if (!orderData.orderId) {
      // Generate a unique orderId if not provided
      orderData.orderId = `ORD-${uuidv4().substring(0, 8)}`;
    }
    
    // Create a new order
    const order = new Order(orderData);
    
    // Add initial timeline event
    order.deliveryTimeline = [{
      status: 'order-received',
      time: new Date(),
      description: 'Order has been received and is being processed'
    }];
    
    // Save the order
    const savedOrder = await order.save();
    
    res.status(201).json({
      success: true,
      data: savedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get orders by user ID
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const orders = await Order.find({ 'user._id': userId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get order by order ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, description } = req.body;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update the status
    order.status = status;
    
    // Add to timeline
    order.deliveryTimeline.push({
      status,
      time: new Date(),
      description: description || `Order status updated to ${status}`
    });
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update the payment status
    order.paymentStatus = paymentStatus;
    
    // Add to timeline if payment completed
    if (paymentStatus === 'completed') {
      order.deliveryTimeline.push({
        status: 'payment-completed',
        time: new Date(),
        description: 'Payment has been completed successfully'
      });
    }
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Assign driver to order
exports.assignDriver = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driver } = req.body;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Assign driver
    order.driver = driver;
    
    // Add to timeline
    order.deliveryTimeline.push({
      status: 'driver-assigned',
      time: new Date(),
      description: `Driver ${driver.name} has been assigned to your order`
    });
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update driver location
exports.updateDriverLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude } = req.body;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update driver location
    order.driverCurrentLocation = {
      latitude,
      longitude,
      updatedAt: new Date()
    };
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}; 