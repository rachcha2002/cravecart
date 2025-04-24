const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const notificationController = require("../controllers/notificationController");
const { sendMail } = require("../services/emailService");

// Validation middleware
const validateNotification = [
  body("title").notEmpty(),
  body("message").notEmpty(),
  body("roles").isArray().notEmpty(),
  body("roles.*").isIn([
    "ADMIN",
    "CUSTOMER",
    "RESTAURANT_OWNER",
    "DELIVERY_PERSON",
  ]),
  body("channels").isArray().notEmpty(),
  body("channels.*").isIn(["SMS", "EMAIL", "IN_APP"]),
  body("metadata")
    .isObject()
    .custom((value) => {
      const { type } = value;
      if (type === "EMAIL" && (!value.emails || !Array.isArray(value.emails))) {
        throw new Error("Emails array is required for EMAIL type");
      }
      if (type === "SMS" && (!value.phones || !Array.isArray(value.phones))) {
        throw new Error("Phones array is required for SMS type");
      }
      if (
        type === "IN_APP" &&
        (!value.userIds || !Array.isArray(value.userIds))
      ) {
        throw new Error("User IDs array is required for IN_APP type");
      }
      return true;
    }),
];

// Create notification
router.post(
  "/",
  validateNotification,
  notificationController.createNotification
);

router.post("/sendmail", sendMail);

router.post("/senddirect", notificationController.sendDirectNotification);

// Get notifications by role
router.get(
  "/role/:role",
  param("role").isIn([
    "ADMIN",
    "CUSTOMER",
    "RESTAURANT_OWNER",
    "DELIVERY_PERSON",
  ]),
  notificationController.getNotificationsByRole
);

module.exports = router;
