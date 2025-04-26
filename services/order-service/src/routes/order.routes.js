const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders
router.get('/', orderController.getAllOrders);

// Get orders by user ID
router.get('/user/:userId', orderController.getUserOrders);

// Get orders by restaurant ID
router.get('/restaurant/:restaurantId', orderController.getRestaurantOrders);

// Get order by ID
router.get('/:orderId', orderController.getOrderById);

// Update order status
router.patch('/:orderId/status', orderController.updateOrderStatus);

// Update payment status
router.patch('/:orderId/payment', orderController.updatePaymentStatus);

// Get order status updates (now a standard REST endpoint, not SSE)
router.get('/:orderId/updates', orderController.getOrderUpdates);

// Assign driver to order
router.patch('/:orderId/driver', orderController.assignDriver);

// Update driver location
router.patch('/:orderId/driver-location', orderController.updateDriverLocation);

module.exports = router; 