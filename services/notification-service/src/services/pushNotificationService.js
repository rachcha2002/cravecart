// services/pushNotificationService.js
const admin = require("firebase-admin");
const winston = require("winston");
const path = require("path");

// Configure logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.Console(),
  ],
});

// Initialize Firebase Admin SDK - lazy initialization
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    const serviceAccountPath = path.resolve(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    );
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    logger.info("Firebase Admin SDK initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK:", error);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
};

/**
 * Send push notification to a single device token
 * @param {string} token - Device token
 * @param {object} notification - Notification data
 * @returns {Promise<boolean>} - Whether notification was sent successfully
 */
const sendPushNotification = async (token, notification) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        actionUrl: notification.actionUrl || "",
        actionText: notification.actionText || "",
        notificationId: notification.notificationId || "",
        type: notification.type || "general",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "delivery_notifications",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info(`Successfully sent push notification: ${response}`);
    return true;
  } catch (error) {
    logger.error("Error sending push notification:", error);
    return false;
  }
};

/**
 * Send push notification to multiple devices
 * @param {string[]} tokens - Array of device tokens
 * @param {object} notification - Notification data
 * @returns {Promise<object>} - Results of notification sends
 */
const sendMulticastPushNotification = async (tokens, notification) => {
  try {
    if (!tokens || tokens.length === 0) {
      logger.warn("No tokens provided for multicast push notification");
      return { success: false, successCount: 0, failureCount: 0 };
    }

    if (!firebaseInitialized) {
      initializeFirebase();
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        actionUrl: notification.actionUrl || "",
        actionText: notification.actionText || "",
        notificationId: notification.notificationId || "",
        type: notification.type || "general",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "delivery_notifications",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);

    logger.info(
      `Multicast push notification stats: ${response.successCount} successful, ${response.failureCount} failed`
    );

    // Log failures if any for debugging
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: tokens[idx],
            error: resp.error.message,
          });
        }
      });

      logger.warn("Failed push notification tokens:", failedTokens);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    logger.error("Error sending multicast push notification:", error);
    return {
      success: false,
      successCount: 0,
      failureCount: tokens ? tokens.length : 0,
      error: error.message,
    };
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification,
};
