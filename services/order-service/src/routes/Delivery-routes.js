const express = require('express');
const router = express.Router();
const DeliveryController = require('../controllers/Delivery.controller');

router.post('/nearbyorders', DeliveryController.findNearbyWrappingOrders);
router.patch('/orders/:orderId/status', DeliveryController.updateOrderStatus);

module.exports = router;
