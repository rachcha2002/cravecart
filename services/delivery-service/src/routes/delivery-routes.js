const express = require('express');
const deliveryController = require('../Controllers/delivery-controller');

const router = express.Router();

router.post('/delivery/createdelivery', deliveryController.createDelivery);
router.get('/delivery/getdeliveriesbydriverid/:driverId', deliveryController.getDeliveriesByDriverId);
router.get('/getalldelivery', deliveryController.getAllDeliveries);
router.get('/delivery/getdeliveriesbyid/:id', deliveryController.getDeliveryById);
router.put('/delivery/updatedelivery/:id', deliveryController.updateDelivery);
router.delete('/delivery/deletedelivery/:id', deliveryController.deleteDelivery);
router.patch('/delivery/addratetodelivery/:id/rate', deliveryController.updateDeliveryRate);

module.exports = router;
