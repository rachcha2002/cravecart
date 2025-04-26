const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const router = express.Router();

router.get("/", restaurantController.getRestaurants);
router.get("/:id", restaurantController.getRestaurantById);

module.exports = router;