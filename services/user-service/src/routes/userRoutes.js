const express = require("express");
const userController = require("../controllers/userController");
const deviceTokenController = require("../controllers/deviceTokenController");
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
router.post(
  "/:id/reset-password",
  auth,
  isAdmin,
  userController.resetUserPassword
);
router.post("/admin", auth, isAdmin, userController.createAdmin);

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

// Profile picture update route (for all users)
router.patch("/profile-picture", auth, userController.updateProfilePicture);

// Delivery document routes (for delivery personnel)
router.patch(
  "/delivery/documents",
  auth,
  isDelivery,
  userController.updateDeliveryDocuments
);

// Admin route to verify delivery documents
router.patch(
  "/:id/delivery/documents/:documentType/verify",
  auth,
  isAdmin,
  userController.verifyDeliveryDocument
);

// Admin route to unverify delivery documents
router.patch(
  "/:id/delivery/documents/:documentType/unverify",
  auth,
  isAdmin,
  userController.unverifyDeliveryDocument
);

// Admin route to unverify delivery partner account
router.patch(
  "/:id/delivery/unverify",
  auth,
  isAdmin,
  userController.unverifyDeliveryPartner
);

// User routes
router.get("/me", auth, userController.getCurrentUser);
router.patch("/me/deactivate", auth, userController.deactivateOwnAccount);

// Get users by role
router.get("/role/:role", userController.getUsersByRole);

// Get user contact info by ID (no auth required)
router.get("/contact/:id", userController.getUserContactInfo);

// Device token routes
router.post(
  "/pushes/:userId/device-tokens",
  deviceTokenController.registerDeviceToken
);
router.delete(
  "/pushes/:userId/device-tokens/:token",
  deviceTokenController.removeDeviceToken
);
router.get(
  "/pushes/:userId/device-tokens",
  deviceTokenController.getUserDeviceTokens
);

module.exports = router;
