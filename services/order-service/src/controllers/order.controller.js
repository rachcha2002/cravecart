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
    
    // Ensure priceCalculation is present and properly formatted
    if (!orderData.priceCalculation) {
      // If not provided, create it from legacy fields for backward compatibility
      orderData.priceCalculation = {
        foodSubtotal: orderData.subtotal || 0,
        restaurantCommission: 0, // Defaults since we don't have this data
        baseDeliveryFee: orderData.deliveryFee || 0,
        extraDistanceFee: 0,
        totalDeliveryFee: orderData.deliveryFee || 0,
        tipAmount: 0,
        serviceFee: 0,
        tax: orderData.tax || 0,
        total: orderData.total || 0,
        driverEarnings: 0,
        companyFee: 0
      };
    } else {
      // Make sure all required fields exist
      orderData.priceCalculation = {
        foodSubtotal: orderData.priceCalculation.foodSubtotal || orderData.subtotal || 0,
        restaurantCommission: orderData.priceCalculation.restaurantCommission || 0,
        baseDeliveryFee: orderData.priceCalculation.baseDeliveryFee || 0,
        extraDistanceFee: orderData.priceCalculation.extraDistanceFee || 0,
        totalDeliveryFee: orderData.priceCalculation.totalDeliveryFee || orderData.deliveryFee || 0,
        tipAmount: orderData.priceCalculation.tipAmount || 0,
        serviceFee: orderData.priceCalculation.serviceFee || 0,
        tax: orderData.priceCalculation.tax || orderData.tax || 0,
        total: orderData.priceCalculation.total || orderData.total || 0,
        driverEarnings: orderData.priceCalculation.driverEarnings || 0,
        companyFee: orderData.priceCalculation.companyFee || 0
      };
    }
    
    // Make sure legacy fields are set for backward compatibility
    if (!orderData.subtotal && orderData.priceCalculation.foodSubtotal) {
      orderData.subtotal = orderData.priceCalculation.foodSubtotal;
    }
    if (!orderData.deliveryFee && orderData.priceCalculation.totalDeliveryFee) {
      orderData.deliveryFee = orderData.priceCalculation.totalDeliveryFee;
    }
    if (!orderData.tax && orderData.priceCalculation.tax) {
      orderData.tax = orderData.priceCalculation.tax;
    }
    if (!orderData.total && orderData.priceCalculation.total) {
      orderData.total = orderData.priceCalculation.total;
    }
    
    // Ensure deliveryDistanceKM is set
    if (!orderData.deliveryDistanceKM) {
      orderData.deliveryDistanceKM = 0;
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
    }
    
    res.status(201).json({
      success: true,
      data: savedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
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
  const { orderId } = req.params;
  const { token } = req.query;
  
  // Validate authentication token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required for SSE connections'
    });
  }
  
  try {
    // Validate JWT token (simplified, you should implement proper token validation)
    let userId;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) throw new Error('Invalid token format');
      
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      userId = payload.id || payload._id;
      
      if (!userId) throw new Error('User ID not found in token');
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    
    // Find the order
    const order = await Order.findOne({ orderId }).lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Optional: Verify that the user has access to this order
    const orderUserId = order.user?.id || order.user?._id;
    const isRestaurantOrder = order.restaurant?._id;
    
    // Skip access check for now, but you can uncomment and customize this
    // if (orderUserId !== userId && !isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You do not have permission to access this order'
    //   });
    // }
    
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Initial heartbeat
    res.write('data: {"type":"connected","message":"SSE connection established"}\n\n');
    
    // Store client info in app-wide sse-clients object
    const clientId = req.socket.remoteAddress + '-' + Date.now();
    const clients = req.app.get('sse-clients') || {};
    
    // Initialize clients object for this order if it doesn't exist
    if (!clients[orderId]) {
      clients[orderId] = {};
    }
    
    // Store client response object
    clients[orderId][clientId] = res;
    
    // Store the client collection back to app
    req.app.set('sse-clients', clients);
    
    // Handle client disconnect
    req.on('close', () => {
      if (clients[orderId]) {
        delete clients[orderId][clientId];
        
        // Clean up empty order entries
        if (Object.keys(clients[orderId]).length === 0) {
          delete clients[orderId];
        }
      }
    });
    
    // Catch any errors in the SSE stream
    res.on('error', (error) => {
      console.error('Error in order updates stream:', error);
      
      // Try to close the connection
      try {
        delete clients[orderId][clientId];
        res.end();
      } catch (endError) {
        console.error('Error ending SSE stream:', endError);
      }
    });
  } catch (error) {
    console.error('Error in order updates stream:', error);
    
    // If headers are not sent yet, send error response
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server error while setting up order updates stream'
      });
    }
    
    // If headers are already sent, try to close the connection properly
    try {
      res.end();
    } catch (endError) {
      console.error('Error ending SSE stream:', endError);
    }
  }
};

// Helper function to format status for customer-friendly messages
const formatStatus = (status) => {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to send update to all connected clients for a specific order
const sendOrderUpdate = (req, orderId, data) => {
  const clients = req.app.get('sse-clients') || {};
  if (!clients[orderId]) return;
  
  // Add timestamp to the data
  const updateData = {
    ...data,
    timestamp: new Date().toISOString()
  };
  
  // Send to all connected clients for this order
  Object.values(clients[orderId]).forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(updateData)}\n\n`);
    } catch (error) {
      console.error(`Error sending SSE update to client for order ${orderId}:`, error);
      // We don't throw or exit here to prevent one client error from affecting others
    }
  });
};

// Helper function to create and send notifications
const sendNotifications = (req, order, status, description) => {
  try {
    const io = req.app.get('io');
    const customerIo = req.app.get('customerIo');
    const orderId = order.orderId;
    
    // Create a standardized notification payload
    const createNotificationPayload = (messagePrefix = '') => ({
      orderId: order.orderId,
      status: order.status,
      orderData: order,
      type: 'status-update',
      message: `${messagePrefix}${formatStatus(status)}`,
      timestamp: new Date().toISOString()
    });
    
    // 1. Send update to all connected SSE clients for this order
    sendOrderUpdate(
      req, 
      orderId, 
      createNotificationPayload('Your order status has been updated to ')
    );
    
    // 2. Emit status update event to restaurant
    const restaurantId = order.restaurant?._id;
    if (restaurantId) {
      io.to(`restaurant-${restaurantId}`).emit(
        'order-status-update', 
        createNotificationPayload(`Order ${orderId} status updated to `)
      );
    }
    
    // 3. Emit to customer if user data exists
    const customerId = order.user?._id || order.user?.id;
    if (customerId) {
      const customerPayload = createNotificationPayload('Your order status has been updated to ');
      
      // Main namespace - customer-specific room
      io.to(`customer-${customerId}`).emit('order-status-update', customerPayload);
      
      // Customer namespace - customer-specific room
      if (customerIo) {
        customerIo.to(`customer-${customerId}`).emit('order-status-update', customerPayload);
      }
    }
    
    // 4. Always emit to order-specific room as a fallback
    const orderRoomPayload = createNotificationPayload(
      customerId ? 'Your order status has been updated to ' : 'Order status has been updated to '
    );
    
    io.to(`order-${orderId}`).emit('order-status-update', orderRoomPayload);
    
    if (customerIo) {
      customerIo.to(`order-${orderId}`).emit('order-status-update', orderRoomPayload);
    }
  } catch (error) {
    // Log error but don't fail the entire operation if notifications fail
    console.error('Error sending order notifications:', error);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, description } = req.body;
    
    // Validate input
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Find and update the order in a single operation for better performance
    const order = await Order.findOneAndUpdate(
      { orderId }, 
      { 
        $set: { status },
        $push: { 
          deliveryTimeline: {
            status,
            time: new Date(),
            description: description || `Order status updated to ${status}`
          }
        }
      },
      { new: true } // Return the updated document
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Send all notifications asynchronously to avoid blocking the response
    setImmediate(() => {
      sendNotifications(req, order, status, description);
    });
    
    // Respond immediately with success
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while updating order status'
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