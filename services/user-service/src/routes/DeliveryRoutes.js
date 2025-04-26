const express = require("express");
const DeliveryController = require("../controllers/DeliveryController");
const router = express.Router();

router.post("/findnearbydrivers", DeliveryController.findNearbyDrivers);
router.put("/updatelocation/:id", DeliveryController.updateDriverLocation);

module.exports = router;