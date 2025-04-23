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
    
    // Get the io instance from req.app
    const io = req.app.get('io');
    
    // If payment is completed, emit socket event to notify restaurant
    if (savedOrder.paymentStatus === 'completed') {
      const restaurantId = savedOrder.restaurant._id;
      
      // Emit to specific restaurant room
      io.to(`restaurant-${restaurantId}`).emit('new-order', {
        orderId: savedOrder.orderId,
        orderData: savedOrder,
        message: 'New order received!'
      });
      
      console.log(`New order notification sent to restaurant ${restaurantId}`);
    }
    
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

// Get real-time order updates
exports.getOrderUpdates = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find the order
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial order data
    res.write(`data: ${JSON.stringify({
      type: 'initial',
      orderId: order.orderId,
      status: order.status,
      orderData: order,
      timestamp: new Date().toISOString()
    })}\n\n`);
    
    // Create a unique client ID
    const clientId = Date.now();
    
    // Store the client's response object
    const clients = req.app.get('sse-clients') || {};
    if (!clients[orderId]) {
      clients[orderId] = {};
    }
    clients[orderId][clientId] = res;
    req.app.set('sse-clients', clients);
    
    console.log(`Client ${clientId} subscribed to updates for order ${orderId}`);
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`Client ${clientId} disconnected from order ${orderId} updates`);
      if (clients[orderId]) {
        delete clients[orderId][clientId];
        
        // Clean up empty order entries
        if (Object.keys(clients[orderId]).length === 0) {
          delete clients[orderId];
        }
      }
    });
  } catch (error) {
    console.error('Error in order updates stream:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while setting up order updates stream'
    });
  }
};

// Helper function to send update to all connected clients for a specific order
const sendOrderUpdate = (req, orderId, data) => {
  const clients = req.app.get('sse-clients') || {};
  if (!clients[orderId]) return;
  
  console.log(`Sending update to ${Object.keys(clients[orderId]).length} clients for order ${orderId}`);
  
  // Add timestamp to the data
  const updateData = {
    ...data,
    timestamp: new Date().toISOString()
  };
  
  // Send to all connected clients for this order
  Object.values(clients[orderId]).forEach(client => {
    client.write(`data: ${JSON.stringify(updateData)}\n\n`);
  });
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
    
    // Get the io instance from req.app
    const io = req.app.get('io');
    
    // Get the customer namespace
    const customerIo = req.app.get('customerIo');
    
    // Emit status update event to restaurant
    const restaurantId = updatedOrder.restaurant._id;
    io.to(`restaurant-${restaurantId}`).emit('order-status-update', {
      orderId: updatedOrder.orderId,
      status: updatedOrder.status,
      orderData: updatedOrder,
      message: `Order ${orderId} status updated to ${status}`
    });
    
    // Send update to all connected SSE clients for this order
    sendOrderUpdate(req, orderId, {
      type: 'status-update',
      orderId: updatedOrder.orderId,
      status: updatedOrder.status,
      orderData: updatedOrder,
      message: `Your order status has been updated to ${formatStatus(status)}`
    });
    
    // Emit status update event to customer if the user data exists
    if (updatedOrder.user) {
      // Get customer ID, supporting both _id and id formats to work with both portals
      const customerId = updatedOrder.user._id || updatedOrder.user.id;
      
      if (customerId) {
        // Emit to customer-specific room in both namespaces
        io.to(`customer-${customerId}`).emit('order-status-update', {
          orderId: updatedOrder.orderId,
          status: updatedOrder.status,
          orderData: updatedOrder,
          message: `Your order status has been updated to ${formatStatus(status)}`
        });
        console.log(`Order status update notification sent to customer ${customerId} in main namespace`);
        
        // Also emit to customer namespace
        if (customerIo) {
          customerIo.to(`customer-${customerId}`).emit('order-status-update', {
            orderId: updatedOrder.orderId,
            status: updatedOrder.status,
            orderData: updatedOrder,
            message: `Your order status has been updated to ${formatStatus(status)}`
          });
          console.log(`Order status update notification sent to customer ${customerId} in customer namespace`);
        }
        
        // Also emit to order-specific room as a fallback in both namespaces
        io.to(`order-${updatedOrder.orderId}`).emit('order-status-update', {
          orderId: updatedOrder.orderId,
          status: updatedOrder.status,
          orderData: updatedOrder,
          message: `Your order status has been updated to ${formatStatus(status)}`
        });
        
        if (customerIo) {
          customerIo.to(`order-${updatedOrder.orderId}`).emit('order-status-update', {
            orderId: updatedOrder.orderId,
            status: updatedOrder.status,
            orderData: updatedOrder,
            message: `Your order status has been updated to ${formatStatus(status)}`
          });
          console.log(`Order status update notification sent to order room ${updatedOrder.orderId} in customer namespace`);
        }
      }
    } else {
      // If we don't have user data, just emit to the order-specific room in both namespaces
      io.to(`order-${updatedOrder.orderId}`).emit('order-status-update', {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        orderData: updatedOrder,
        message: `Order status has been updated to ${formatStatus(status)}`
      });
      
      if (customerIo) {
        customerIo.to(`order-${updatedOrder.orderId}`).emit('order-status-update', {
          orderId: updatedOrder.orderId,
          status: updatedOrder.status,
          orderData: updatedOrder,
          message: `Order status has been updated to ${formatStatus(status)}`
        });
      }
      
      console.log(`Order status update notification sent to order room ${updatedOrder.orderId} (no user data)`);
    }
    
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

// Helper function to format status for customer-friendly messages
const formatStatus = (status) => {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
      
      // Get the io instance from req.app
      const io = req.app.get('io');
      
      // Emit new order event to restaurant when payment is completed
      const restaurantId = order.restaurant._id;
      io.to(`restaurant-${restaurantId}`).emit('new-order', {
        orderId: order.orderId,
        orderData: order,
        message: 'New order received with completed payment!'
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

// Get orders by restaurant ID with completed payment
exports.getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const orders = await Order.find({ 
      'restaurant._id': restaurantId,
      'paymentStatus': 'completed'
    }).sort({ createdAt: -1 });
    
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