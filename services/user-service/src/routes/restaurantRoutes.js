const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const router = express.Router();

router.get("/", restaurantController.getRestaurants);
router.get("/:id", restaurantController.getRestaurantById);

// Restaurant access validation endpoint
router.get('/validate-restaurant-access', restaurantController.validateRestaurantAccess);


module.exports = router;