const express = require("express");
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const { isAdmin, isDelivery, checkRole } = require("../middleware/roleCheck");
const {
  validator,
  validateUpdateProfile,
} = require("../middleware/validation");

const router = express.Router();

// Admin routes
router.get("/", auth, isAdmin, userController.getAllUsers);
router.patch("/:id/status", auth, isAdmin, userController.updateUserStatus);
router.patch("/:id/verify", auth, isAdmin, userController.verifyUser);
router.delete("/:id", auth, isAdmin, userController.deleteUser);

// User routes (admin or self)
router.get("/:id", auth, userController.getUserById);
router.put(
  "/:id",
  auth,
  validator(validateUpdateProfile),
  userController.updateUser
);

// Restaurant routes
router.get("/restaurants/nearby", auth, userController.getNearbyRestaurants);
router.post(
  "/restaurant/images",
  auth,
  checkRole(["restaurant"]),
  userController.addRestaurantImage
);
router.delete(
  "/restaurant/images/:imageId",
  auth,
  checkRole(["restaurant"]),
  userController.removeRestaurantImage
);
router.patch(
  "/restaurant/description",
  auth,
  checkRole(["restaurant"]),
  userController.updateRestaurantDescription
);

// Customer routes
router.post(
  "/customer/locations",
  auth,
  checkRole(["customer"]),
  userController.addDefaultLocation
);
router.put(
  "/customer/locations/:locationId",
  auth,
  checkRole(["customer"]),
  userController.updateDefaultLocation
);
router.delete(
  "/customer/locations/:locationId",
  auth,
  checkRole(["customer"]),
  userController.removeDefaultLocation
);

// Delivery personnel routes
router.patch(
  "/delivery/location",
  auth,
  isDelivery,
  userController.updateDeliveryLocation
);
router.patch(
  "/delivery/availability",
  auth,
  isDelivery,
  userController.updateDeliveryAvailability
);
router.get(
  "/delivery/available",
  auth,
  checkRole(["admin", "restaurant"]),
  userController.getAvailableDeliveryPersonnel
);

module.exports = router;
