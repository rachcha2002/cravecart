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
      
      console.log(`[NOTIFICATION] New order ${savedOrder.orderId} with completed payment`);
      console.log(`[NOTIFICATION] Sending socket notification to restaurant: ${restaurantId}`);
      
      // Emit to specific restaurant room
      io.to(`restaurant-${restaurantId}`).emit('new-order', {
        orderId: savedOrder.orderId,
        orderData: savedOrder,
        message: 'New order received!'
      });
      console.log(`[NOTIFICATION_SENT] Socket notification sent to restaurant ${restaurantId} for new order ${savedOrder.orderId}`);
      
      // Send in-app notification to restaurant
      const sendInAppNotification = req.app.get('sendInAppNotification');
      if (sendInAppNotification) {
        console.log(`[NOTIFICATION] Sending in-app notification to restaurant: ${restaurantId}`);
        const title = 'New Order Received';
        const message = `New order #${savedOrder.orderId} has been received!`;
        
        console.log(`[NOTIFICATION_SENT] In-app notification being sent to restaurant ${restaurantId} for new order ${savedOrder.orderId}`);
        sendInAppNotification(restaurantId, title, message, 'RESTAURANT_OWNER')
          .then(result => {
            console.log(`[NOTIFICATION] In-app notification to restaurant ${result ? 'succeeded' : 'failed'}`);
            console.log(`[NOTIFICATION][ORDER_CREATION] Restaurant notification sent for order ${savedOrder.orderId}`);
          })
          .catch(err => {
            console.error(`[NOTIFICATION] Error sending restaurant notification:`, err.message);
          });
      }
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
  // Remove SSE implementation and return a REST API response instead
  const { orderId } = req.params;
  
  try {
    // Find the order
    const order = await Order.findOne({ orderId }).lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Return current order status as a normal REST response
    return res.status(200).json({
      success: true,
      message: 'Order status retrieved successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        formattedStatus: formatStatus(order.status),
        lastUpdated: new Date().toISOString(),
        orderData: order
      }
    });
  } catch (error) {
    console.error('Error fetching order updates:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting order updates'
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

// Helper function to send update to all connected clients for a specific order
const sendOrderUpdate = (req, orderId, data) => {
  // Remove SSE update functionality, use only Socket.IO
  // Socket.IO notifications will be handled in the helper function below
};

// Helper function to create and send notifications
const sendNotifications = (req, order, status, description) => {
  try {
    console.log(`[NOTIFICATION] Processing status update notification for order ${order.orderId}`);
    console.log(`[NOTIFICATION] Status: ${status}`);
    console.log(`[NOTIFICATION] Description: ${description || 'N/A'}`);
    
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
    
    // Get the sendInAppNotification function
    const sendInAppNotification = req.app.get('sendInAppNotification');
    
    // 1. Emit status update event to restaurant & send in-app notification
    const restaurantId = order.restaurant?._id;
    if (restaurantId) {
      console.log(`[NOTIFICATION] Sending socket notification to restaurant: ${restaurantId}`);
      io.to(`restaurant-${restaurantId}`).emit(
        'order-status-update', 
        createNotificationPayload(`Order ${orderId} status updated to `)
      );
      console.log(`[NOTIFICATION_SENT] Socket notification sent to restaurant ${restaurantId} for order ${orderId} status update: ${status}`);
      
      // Send in-app notification to restaurant
      if (sendInAppNotification) {
        console.log(`[NOTIFICATION] Sending in-app notification to restaurant: ${restaurantId}`);
        const title = 'Order Status Update';
        const message = `Order #${orderId} status has been updated to ${formatStatus(status)}`;
        
        console.log(`[NOTIFICATION_SENT] In-app notification being sent to restaurant ${restaurantId} for order ${orderId} status update: ${status}`);
        sendInAppNotification(restaurantId, title, message, 'RESTAURANT_OWNER')
          .then(result => {
            console.log(`[NOTIFICATION] In-app notification to restaurant ${result ? 'succeeded' : 'failed'}`);
            console.log(`[NOTIFICATION][STATUS_UPDATE] Restaurant notification sent for order ${orderId}, status: ${status}`);
          })
          .catch(err => {
            console.error(`[NOTIFICATION] Error sending restaurant notification:`, err.message);
          });
      }
    }
    
    // 2. Emit to customer if user data exists & send in-app notification
    const customerId = order.user?._id || order.user?.id;
    if (customerId) {
      console.log(`[NOTIFICATION] Sending socket notification to customer: ${customerId}`);
      const customerPayload = createNotificationPayload('Your order status has been updated to ');
      
      // Main namespace - customer-specific room
      io.to(`customer-${customerId}`).emit('order-status-update', customerPayload);
      console.log(`[NOTIFICATION_SENT] Socket notification sent to customer ${customerId} for order ${orderId} status update: ${status}`);
      
      // Customer namespace - customer-specific room
      if (customerIo) {
        customerIo.to(`customer-${customerId}`).emit('order-status-update', customerPayload);
        console.log(`[NOTIFICATION_SENT] Customer namespace socket notification sent to customer ${customerId} for order ${orderId} status update: ${status}`);
      }
      
      // Send in-app notification to customer
      if (sendInAppNotification) {
        console.log(`[NOTIFICATION] Sending in-app notification to customer: ${customerId}`);
        const title = 'Order Status Update';
        const message = `Your order #${orderId} status has been updated to ${formatStatus(status)}`;
        
        console.log(`[NOTIFICATION_SENT] In-app notification being sent to customer ${customerId} for order ${orderId} status update: ${status}`);
        sendInAppNotification(customerId, title, message, 'CUSTOMER')
          .then(result => {
            console.log(`[NOTIFICATION] In-app notification to customer ${result ? 'succeeded' : 'failed'}`);
            console.log(`[NOTIFICATION][STATUS_UPDATE] Customer notification sent for order ${orderId}, status: ${status}`);
          })
          .catch(err => {
            console.error(`[NOTIFICATION] Error sending customer notification:`, err.message);
          });
      }
    }
   
    // 3. Broadcast to order-specific room
    console.log(`[NOTIFICATION] Broadcasting to order room: order-${orderId}`);
    io.to(`order-${orderId}`).emit('order-status-update', createNotificationPayload());
    console.log(`[NOTIFICATION_SENT] Socket notification broadcasted to order room: order-${orderId} for status update: ${status}`);
    
    // 4. Emit to customer namespace order-specific room
    if (customerIo) {
      customerIo.to(`order-${orderId}`).emit('order-status-update', createNotificationPayload());
      console.log(`[NOTIFICATION_SENT] Customer namespace socket notification sent to order room: order-${orderId} for status update: ${status}`);
    }
    
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] ERROR: Error sending notifications:', error.message);
    return false;
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
      console.log(`[NOTIFICATION_SENT] Socket notification sent to restaurant ${restaurantId} for payment completed on order ${order.orderId}`);
      
      // Send in-app notification to restaurant
      const sendInAppNotification = req.app.get('sendInAppNotification');
      if (sendInAppNotification) {
        console.log(`[NOTIFICATION] Sending in-app notification to restaurant: ${restaurantId}`);
        const title = 'New Order Received';
        const message = `New order #${order.orderId} payment has been completed!`;
        
        console.log(`[NOTIFICATION_SENT] In-app notification being sent to restaurant ${restaurantId} for payment completed on order ${order.orderId}`);
        sendInAppNotification(restaurantId, title, message, 'RESTAURANT_OWNER')
          .then(result => {
            console.log(`[NOTIFICATION] In-app notification to restaurant ${result ? 'succeeded' : 'failed'}`);
            console.log(`[NOTIFICATION][PAYMENT_COMPLETED] Restaurant notification sent for order ${order.orderId}`);
          })
          .catch(err => {
            console.error(`[NOTIFICATION] Error sending restaurant notification:`, err.message);
          });
      }
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