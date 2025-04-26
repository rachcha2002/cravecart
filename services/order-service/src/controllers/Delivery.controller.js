const Order = require('../models/order.model');

const findNearbyWrappingOrders = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required in request body'
      });
    }

    const userLong = parseFloat(longitude);
    const userLat = parseFloat(latitude);
    console.log('Coordinates:', [userLong, userLat]);

    // Since we can't use MongoDB's built-in geospatial queries due to lacking index,
    // we'll fetch orders and manually filter
    const wrappingOrders = await Order.find({
      status: 'wrapping-up'
    });

    const nearbyOrders = wrappingOrders.filter(order => {
      if (!order.restaurant || !order.restaurant.location || 
          !order.restaurant.location.coordinates || 
          !Array.isArray(order.restaurant.location.coordinates) || 
          order.restaurant.location.coordinates.length !== 2) {
        return false;
      }

      const restaurantLong = order.restaurant.location.coordinates[0];
      const restaurantLat = order.restaurant.location.coordinates[1];
      
    
      const R = 6371; 
      const dLat = toRadians(restaurantLat - userLat);
      const dLon = toRadians(restaurantLong - userLong);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRadians(userLat)) * Math.cos(toRadians(restaurantLat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= 1;
    });

    return res.status(200).json({
      success: true,
      count: nearbyOrders.length,
      data: nearbyOrders
    });
  } catch (error) {
    console.error('Error finding nearby wrapping-up orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while finding nearby orders',
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const allowedStatuses = [
      'wrapping-up',
      'picking-up',
      'heading-your-way',
      'delivered',
      'cancelled'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with id ${orderId} not found`
      });
    }

    order.status = status;
    
    order.deliveryTimeline.push({
      status,
      time: new Date(),
      description: `Order status updated to ${status}`
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating order status',
      error: error.message
    });
  }
};

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = {
  findNearbyWrappingOrders,
  updateOrderStatus
};
