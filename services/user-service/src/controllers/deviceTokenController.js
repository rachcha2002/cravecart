// controllers/deviceTokenController.js
const User = require("../models/User");
const winston = require("winston");

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

// Register a new device token
const registerDeviceToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { token, platform } = req.body;

    // Validate input
    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        error: "Token and platform are required",
      });
    }

    // Validate platform value
    if (!["ios", "android", "web"].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: "Platform must be ios, android, or web",
      });
    }

    // Verify user exists and is active
    const user = await User.findOne({ _id: userId, status: "ACTIVE" });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found or inactive",
      });
    }

    // Check if this is a delivery person
    if (user.role !== "DELIVERY_PERSON") {
      logger.warn(
        `Non-delivery user ${userId} attempting to register device token`
      );
    }

    // Check if token already exists
    const existingTokenIndex = user.deviceTokens.findIndex(
      (device) => device.token === token
    );

    if (existingTokenIndex !== -1) {
      // Update existing token entry
      user.deviceTokens[existingTokenIndex].lastUpdated = new Date();
      user.deviceTokens[existingTokenIndex].platform = platform;
      logger.info(`Updated existing device token for user ${userId}`);
    } else {
      // Add new token
      user.deviceTokens.push({
        token,
        platform,
        lastUpdated: new Date(),
      });
      logger.info(`Added new device token for user ${userId}`);
    }

    // Update the user's lastUpdated timestamp
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Device token registered successfully",
    });
  } catch (error) {
    logger.error("Failed to register device token:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to register device token",
      details: error.message,
    });
  }
};

// Remove a device token
const removeDeviceToken = async (req, res) => {
  try {
    const { userId, token } = req.params;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if token exists before removal
    const initialTokenCount = user.deviceTokens.length;

    // Filter out the token to be removed
    user.deviceTokens = user.deviceTokens.filter(
      (device) => device.token !== token
    );

    // Only save if a token was actually removed
    if (initialTokenCount !== user.deviceTokens.length) {
      user.updatedAt = new Date();
      await user.save();
      logger.info(`Removed device token for user ${userId}`);

      return res.status(200).json({
        success: true,
        message: "Device token removed successfully",
      });
    } else {
      logger.warn(`Token not found for removal for user ${userId}`);
      return res.status(404).json({
        success: false,
        error: "Token not found",
      });
    }
  } catch (error) {
    logger.error("Failed to remove device token:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to remove device token",
      details: error.message,
    });
  }
};

// Get all device tokens for a user
const getUserDeviceTokens = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user.deviceTokens,
    });
  } catch (error) {
    logger.error("Failed to get user device tokens:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get user device tokens",
      details: error.message,
    });
  }
};

module.exports = {
  registerDeviceToken,
  removeDeviceToken,
  getUserDeviceTokens,
};
