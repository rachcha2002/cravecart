// notificationController.js
const Notification = require("../models/Notification");
const axios = require("axios");
const winston = require("winston");
const { sendNotificationEmail } = require("../services/emailService");
const { sendNotificationSMS } = require("../services/smsService");
const {
  sendPushNotification,
  sendMulticastPushNotification,
} = require("../services/pushNotificationService");

// Configure logger - minimal version
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

// Socket.io instance
let io = {
  customer: null,
  restaurant: null,
  admin: null,
  delivery: null,
};

const setSocketIO = (socketIO) => {
  io = socketIO;
};

// In-app notification with minimal logging
const sendInApp = async (userId, notification, userType) => {
  try {
    // Map user type to appropriate namespace
    const userTypeMap = {
      CUSTOMER: "customer",
      RESTAURANT_OWNER: "restaurant",
      ADMIN: "admin",
      DELIVERY_PERSON: "delivery",
    };

    const namespace = userTypeMap[userType];

    // ALWAYS mark as sent in the database first
    await markNotificationAsSent(userId, notification);

    // Try socket delivery if available
    if (io[namespace]) {
      // Send the new notification to the appropriate namespace
      io[namespace].to(userId.toString()).emit("notification", notification);

      // Get the updated unread count
      const count = await Notification.countDocuments({
        "receivers.userId": userId,
        "receivers.receivingData": {
          $elemMatch: {
            channel: "IN_APP",
            status: "SENT",
            read: false,
          },
        },
      });

      // Send the updated count
      io[namespace].to(userId.toString()).emit("unreadCount", { count });

      return true;
    }

    // If socket is not available, log the event
    return true;
  } catch (error) {
    logger.error("In-app notification failed:", error.message);

    // Try to mark as sent even if an error occurred
    try {
      await markNotificationAsSent(userId, notification);
      return true;
    } catch (dbError) {
      return false;
    }
  }
};

// Helper function to mark notification as sent in database
async function markNotificationAsSent(userId, notification) {
  // Find the notification document for this user
  const notificationDoc = await Notification.findOne({
    "receivers.userId": userId,
  });

  if (notificationDoc) {
    // Update the receiver's status for this notification
    await Notification.updateOne(
      {
        _id: notificationDoc._id,
        "receivers.userId": userId,
      },
      {
        $set: {
          "receivers.$.receivingData.$[elem].status": "SENT",
          "receivers.$.receivingData.$[elem].sentAt": new Date(),
        },
      },
      {
        arrayFilters: [{ "elem.channel": "IN_APP" }],
      }
    );
  }
}

/**
 * Create and send notifications to users based on their roles
 */
const createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      roles,
      channels,
      actionUrl,
      actionText,
      attachments,
    } = req.body;

    // Validate required fields
    if (!title || !message || !roles || !channels) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, message, roles, or channels",
      });
    }

    // Normalize roles and channels to uppercase
    const normalizedRoles = roles.map((role) => role.toUpperCase());
    const normalizedChannels = channels.map((channel) =>
      channel.toUpperCase().replace("-", "_")
    );

    // Create notification document
    const notification = new Notification({
      title,
      message,
      roles: normalizedRoles,
      channels: normalizedChannels,
      receivers: [],
    });

    // Fetch users for each role
    const allUsers = [];
    for (const role of normalizedRoles) {
      try {
        const response = await axios.get(
          `${process.env.USER_SERVICE_URL}/api/users/role/${role}`
        );

        if (response.data && response.data.success) {
          allUsers.push(...response.data.data);
        }
      } catch (error) {
        logger.error(`Failed to fetch users for role ${role}:`, error.message);
      }
    }

    if (allUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No users found for the specified roles",
      });
    }

    // Create receiver entries and send notifications
    const notificationResults = [];

    for (const user of allUsers) {
      // Skip if no contact information
      if (!user.email && !user.phoneNumber) {
        continue;
      }

      const receiverData = {
        userId: user._id,
        userType: user.role || "UNKNOWN", // Add the userType field
        receivingData: [],
      };

      // Send notifications through each channel
      for (const channel of normalizedChannels) {
        let sent = false;
        let sentAt = null;
        let errorMessage = null;

        try {
          switch (channel) {
            case "EMAIL":
              if (
                !user.email ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
              ) {
                errorMessage = !user.email
                  ? "User email not found"
                  : "Invalid email format";
                break;
              }

              // Determine the appropriate client URL based on user role
              let clientUrl = process.env.CLIENT_URL; // Default fallback URL

              if (user.role === "CUSTOMER") {
                clientUrl =
                  process.env.CUSTOMER_WEB_URL || process.env.CLIENT_URL;
              } else if (user.role === "ADMIN") {
                clientUrl = process.env.ADMIN_WEB_URL || process.env.CLIENT_URL;
              } else if (user.role === "RESTAURANT_OWNER") {
                clientUrl =
                  process.env.RESTAURANT_WEB_URL || process.env.CLIENT_URL;
              }

              const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>CraveCart Notification</title>
                      <style>
                        body, html {
                          margin: 0;
                          padding: 0;
                          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                          line-height: 1.6;
                          color: #333;
                          background-color: #f8f9fa;
                        }
                        .email-container {
                          max-width: 600px;
                          margin: 0 auto;
                          background-color: #ffffff;
                          border-radius: 8px;
                          overflow: hidden;
                          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .email-header {
                          background-color: #FF6B35;
                          padding: 20px;
                          text-align: center;
                        }
                        .logo {
                          max-width: 180px;
                          height: auto;
                        }
                        .email-content {
                          padding: 30px;
                        }
                        .email-title {
                          font-size: 24px;
                          font-weight: 600;
                          color: #FF6B35;
                          margin-bottom: 20px;
                        }
                        .email-message {
                          font-size: 16px;
                          color: #555;
                          margin-bottom: 25px;
                        }
                        .cta-button {
                          display: inline-block;
                          background-color: #FF6B35;
                          color: #ffffff !important;
                          text-decoration: none;
                          padding: 12px 24px;
                          border-radius: 4px;
                          font-weight: 600;
                          margin-top: 10px;
                        }
                        .email-footer {
                          background-color: #f1f1f1;
                          padding: 20px;
                          text-align: center;
                          font-size: 14px;
                          color: #777;
                        }
                        
                        @media screen and (max-width: 480px) {
                          .email-container {
                            width: 100%;
                            border-radius: 0;
                          }
                          .email-content {
                            padding: 20px;
                          }
                          .email-title {
                            font-size: 20px;
                          }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="email-container">
                        <div class="email-header">
                          <img src="https://res.cloudinary.com/dn1w8k2l1/image/upload/v1745527245/logo_jxgxfg.png" alt="CraveCart Logo" class="logo">
                        </div>
                        <div class="email-content">
                          <h1 class="email-title">${title}</h1>
                          <div class="email-message">
                            ${message}
                          </div>
                          <a href="${
                            actionUrl || clientUrl
                          }" class="cta-button">${
                actionText || "Visit CraveCart"
              }</a>
                        </div>
                        <div class="email-footer">
                          <p>© ${new Date().getFullYear()} CraveCart. All rights reserved.</p>
                          <p>This is an automated notification. Please do not reply to this email.</p>
                          
                        </div>
                      </div>
                    </body>
                    </html>
                    `;

              // Prepare email options with HTML and optional attachments
              const emailOptions = {
                html: htmlContent,
              };

              // Add attachments if provided
              if (attachments && Array.isArray(attachments)) {
                emailOptions.attachments = attachments;
              }

              sent = await sendNotificationEmail(
                user.email,
                title,
                message,
                emailOptions
              );
              break;

            case "SMS":
              if (
                !user.phoneNumber ||
                !/^\+?[\d\s-]{10,}$/.test(user.phoneNumber)
              ) {
                errorMessage = !user.phoneNumber
                  ? "User phone number not found"
                  : "Invalid phone number format";
                break;
              }
              sent = await sendNotificationSMS(user.phoneNumber, message);
              break;

            case "IN_APP":
              // For in-app notifications, also pass the actionUrl and actionText if available
              const inAppNotification = {
                title,
                message,
                actionUrl: actionUrl || null,
                actionText: actionText || null,
              };
              sent = await sendInApp(
                user._id,
                inAppNotification,
                user.role || "ADMIN"
              );
              break;

            case "PUSH":
              // Get user details from user service to get device tokens
              try {
                const userResponse = await axios.get(
                  `${process.env.USER_SERVICE_URL}/users/${user._id}/device-tokens`
                );

                if (
                  !userResponse.data.success ||
                  !userResponse.data.data ||
                  userResponse.data.data.length === 0
                ) {
                  errorMessage = "No device tokens found for user";
                  break;
                }

                // Extract just the tokens
                const deviceTokens = userResponse.data.data.map(
                  (device) => device.token
                );

                // Create notification object with additional data
                const pushNotification = {
                  title,
                  message,
                  actionUrl: actionUrl || null,
                  actionText: actionText || null,
                  notificationId: notification._id.toString(),
                  type:
                    user.userType === "DELIVERY_PERSON"
                      ? "delivery"
                      : "general",
                };

                // Send to all user's devices
                const pushResult = await sendMulticastPushNotification(
                  deviceTokens,
                  pushNotification
                );
                sent = pushResult.successCount > 0;

                if (
                  pushResult.failureCount > 0 &&
                  pushResult.successCount === 0
                ) {
                  errorMessage = `Failed to send to all ${pushResult.failureCount} devices`;
                } else if (pushResult.failureCount > 0) {
                  errorMessage = `Partially failed: ${pushResult.failureCount} devices failed, ${pushResult.successCount} succeeded`;
                }
              } catch (error) {
                errorMessage = `Error fetching device tokens: ${error.message}`;
                logger.error("Push notification error:", error);
              }
              break;

            default:
              errorMessage = `Unsupported channel: ${channel}`;
          }
        } catch (error) {
          errorMessage = error.message;
        }

        if (sent) {
          sentAt = new Date();
        }

        receiverData.receivingData.push({
          channel,
          status: sent ? "SENT" : "FAILED",
          sentAt,
          error: errorMessage,
        });
      }

      // Only add to notification if at least one channel was attempted
      if (receiverData.receivingData.length > 0) {
        notification.receivers.push(receiverData);
        notificationResults.push({
          userId: user._id,
          userType: user.role || "UNKNOWN", // Make sure to include userType here too
          channels: receiverData.receivingData,
        });
      }
    }

    // Check if any notifications were sent
    if (notification.receivers.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "No valid users found with required contact information for the specified channels",
      });
    }

    await notification.save();

    const response = {
      success: true,
      message: "Notifications sent successfully",
      data: {
        notificationId: notification._id,
        totalUsers: allUsers.length,
        results: notificationResults,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create notification",
      details: error.message,
    });
  }
};

const getNotificationsByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { channel, status, limit = 10, page = 1 } = req.query;

    const query = { roles: role };
    if (channel) {
      query["receivers.receivingData.channel"] = channel;
    }
    if (status) {
      query["receivers.receivingData.status"] = status;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
};

/**
 * Send notification directly to specific users by their IDs
 */
const sendDirectNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      userIds,
      channels,
      actionUrl,
      actionText,
      attachments,
    } = req.body;

    // Validate required fields
    if (!title || !message || !userIds || !channels) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, message, userIds, or channels",
      });
    }

    // Ensure userIds is an array
    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: "userIds must be an array of user IDs",
      });
    }

    // Normalize channels to uppercase
    const normalizedChannels = channels.map((channel) =>
      channel.toUpperCase().replace("-", "_")
    );

    // Create notification document
    const notification = new Notification({
      title,
      message,
      userIds, // Store the direct user IDs
      channels: normalizedChannels,
      actionUrl: actionUrl || null,
      actionText: actionText || null,
      receivers: [],
    });

    // Fetch user details for each user ID
    const allUsers = [];
    for (const userId of userIds) {
      try {
        const response = await axios.get(
          `${process.env.USER_SERVICE_URL}/api/users/contact/${userId}`
        );

        if (response.data && response.data.success) {
          allUsers.push(response.data.data);
        }
      } catch (error) {
        logger.error(`Failed to fetch user with ID ${userId}:`, error.message);
      }
    }

    if (allUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No valid users found for the specified IDs",
      });
    }

    // Create receiver entries and send notifications
    const notificationResults = [];

    for (const user of allUsers) {
      // Skip if no contact information
      if (!user.email && !user.phoneNumber) {
        continue;
      }

      const receiverData = {
        userId: user.userId,
        userType: user.role || "UNKNOWN", // Add the userType field
        receivingData: [],
      };

      // Send notifications through each channel
      for (const channel of normalizedChannels) {
        let sent = false;
        let sentAt = null;
        let errorMessage = null;

        try {
          switch (channel) {
            case "EMAIL":
              if (
                !user.email ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
              ) {
                errorMessage = !user.email
                  ? "User email not found"
                  : "Invalid email format";
                break;
              }

              // Determine the appropriate client URL based on user role
              let clientUrl = process.env.CLIENT_URL; // Default fallback URL

              if (user.role === "CUSTOMER") {
                clientUrl =
                  process.env.CUSTOMER_WEB_URL || process.env.CLIENT_URL;
              } else if (user.role === "ADMIN") {
                clientUrl = process.env.ADMIN_WEB_URL || process.env.CLIENT_URL;
              } else if (user.role === "RESTAURANT_OWNER") {
                clientUrl =
                  process.env.RESTAURANT_WEB_URL || process.env.CLIENT_URL;
              }

              const htmlContent = `
                      <!DOCTYPE html>
                      <html lang="en">
                      <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>CraveCart Notification</title>
                          <style>
                              body, html {
                                  margin: 0;
                                  padding: 0;
                                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                  line-height: 1.6;
                                  color: #333;
                                  background-color: #f8f9fa;
                              }
                              .email-container {
                                  max-width: 600px;
                                  margin: 0 auto;
                                  background-color: #ffffff;
                                  border-radius: 8px;
                                  overflow: hidden;
                                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                              }
                              .email-header {
                                  background-color: #FF6B35;
                                  padding: 20px;
                                  text-align: center;
                              }
                              .logo {
                                  max-width: 180px;
                                  height: auto;
                              }
                              .email-content {
                                  padding: 30px;
                              }
                              .email-title {
                                  font-size: 24px;
                                  font-weight: 600;
                                  color: #FF6B35;
                                  margin-bottom: 20px;
                              }
                              .email-message {
                                  font-size: 16px;
                                  color: #555;
                                  margin-bottom: 25px;
                              }
                              .cta-button {
                                  display: inline-block;
                                  background-color: #FF6B35;
                                  color: #ffffff !important;
                                  text-decoration: none;
                                  padding: 12px 24px;
                                  border-radius: 4px;
                                  font-weight: 600;
                                  margin-top: 10px;
                              }
                              .email-footer {
                                  background-color: #f1f1f1;
                                  padding: 20px;
                                  text-align: center;
                                  font-size: 14px;
                                  color: #777;
                              }
                              
                              @media screen and (max-width: 480px) {
                                  .email-container {
                                      width: 100%;
                                      border-radius: 0;
                                  }
                                  .email-content {
                                      padding: 20px;
                                  }
                                  .email-title {
                                      font-size: 20px;
                                  }
                              }
                          </style>
                      </head>
                      <body>
                          <div class="email-container">
                              <div class="email-header">
                                  <img src="https://res.cloudinary.com/dn1w8k2l1/image/upload/v1745527245/logo_jxgxfg.png" alt="CraveCart Logo" class="logo">
                              </div>
                              <div class="email-content">
                                  <h1 class="email-title">${title}</h1>
                                  <div class="email-message">
                                      ${message}
                                  </div>
                                  <a href="${
                                    actionUrl || clientUrl
                                  }" class="cta-button">${
                actionText || "Visit CraveCart"
              }</a>
                              </div>
                              <div class="email-footer">
                                  <p>© ${new Date().getFullYear()} CraveCart. All rights reserved.</p>
                                  <p>This is an automated notification. Please do not reply to this email.</p>
                                  
                              </div>
                          </div>
                      </body>
                      </html>
                      `;

              // Send email with HTML and optional attachments
              const emailOptions = {
                html: htmlContent,
              };

              // Add attachments if provided
              if (attachments && Array.isArray(attachments)) {
                emailOptions.attachments = attachments;
              }

              sent = await sendNotificationEmail(
                user.email,
                title,
                message,
                emailOptions
              );
              break;

            case "SMS":
              if (
                !user.phoneNumber ||
                !/^\+?[\d\s-]{10,}$/.test(user.phoneNumber)
              ) {
                errorMessage = !user.phoneNumber
                  ? "User phone number not found"
                  : "Invalid phone number format";
                break;
              }
              sent = await sendNotificationSMS(user.phoneNumber, message);
              break;

            case "IN_APP":
              const inAppNotification = {
                title,
                message,
                actionUrl: actionUrl || null,
                actionText: actionText || null,
              };

              // Log the user role for debugging
              logger.info(`User role before sending: ${user.role}`);

              // Make sure to pass the role (even if lowercase, it will be converted)
              sent = await sendInApp(
                user._id,
                inAppNotification,
                user.role || "ADMIN"
              );
              break;

            case "PUSH":
              if (!user.deviceTokens || user.deviceTokens.length === 0) {
                errorMessage = "No device tokens found for user";
                break;
              }

              // Extract just the tokens
              const deviceTokens = user.deviceTokens.map(
                (device) => device.token
              );

              // Create notification object
              const pushNotification = {
                title,
                message,
                actionUrl: actionUrl || null,
                actionText: actionText || null,
                notificationId: notification._id.toString(),
                type: "delivery", // or any other type identifier for the rider app
              };

              // Send to all user's devices
              const pushResult = await sendMulticastPushNotification(
                deviceTokens,
                pushNotification
              );
              sent = pushResult.successCount > 0;
              if (pushResult.failureCount > 0) {
                errorMessage = `Failed to send to ${pushResult.failureCount} devices`;
              }
              break;

            default:
              errorMessage = `Unsupported channel: ${channel}`;
          }
        } catch (error) {
          errorMessage = error.message;
        }

        if (sent) {
          sentAt = new Date();
        }

        receiverData.receivingData.push({
          channel,
          status: sent ? "SENT" : "FAILED",
          sentAt,
          error: errorMessage,
        });
      }

      // Only add to notification if at least one channel was attempted
      if (receiverData.receivingData.length > 0) {
        notification.receivers.push(receiverData);
        notificationResults.push({
          userId: user._id,
          userType: user.role || "UNKNOWN", // Make sure to include userType here too
          channels: receiverData.receivingData,
        });
      }
    }

    // Check if any notifications were sent
    if (notification.receivers.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "No valid users found with required contact information for the specified channels",
      });
    }

    await notification.save();

    const response = {
      success: true,
      message: "Direct notifications sent successfully",
      data: {
        notificationId: notification._id,
        totalUsers: allUsers.length,
        results: notificationResults,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to send direct notifications",
      details: error.message,
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId, userType } = req.body;

    if (!notificationId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: notificationId or userId",
      });
    }

    // Find the notification with the specified user
    const notification = await Notification.findOne({
      _id: notificationId,
      "receivers.userId": userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found for this user",
      });
    }

    // Update the read status for in-app notifications for this user
    const result = await Notification.updateOne(
      {
        _id: notificationId,
        "receivers.userId": userId,
        "receivers.receivingData.channel": "IN_APP",
      },
      {
        $set: {
          "receivers.$.receivingData.$[elem].read": true,
          "receivers.$.receivingData.$[elem].readAt": new Date(),
        },
      },
      {
        arrayFilters: [{ "elem.channel": "IN_APP" }],
      }
    );

    // Check if the update was successful
    if (result.modifiedCount > 0) {
      const count = await Notification.countDocuments({
        "receivers.userId": userId,
        "receivers.receivingData": {
          $elemMatch: {
            channel: "IN_APP",
            status: "SENT",
            read: false,
          },
        },
      });

      if (io[userType.toLowerCase()]) {
        io[userType.toLowerCase()]
          .to(userId.toString())
          .emit("unreadCount", { count });
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Failed to mark notification as read",
      });
    }
  } catch (error) {
    logger.error("Failed to mark notification as read:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
      details: error.message,
    });
  }
};

const getUnreadNotificationsCount = async (req, res) => {
  let retryCount = 0;
  const maxRetries = 3;

  const attemptFetchCount = async () => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "Missing required field: userId",
        });
      }

      logger.info(`Fetching unread notifications count for user: ${userId}`);

      // Count unread in-app notifications for this user
      // Using a timeout promise to prevent hanging operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Database query timeout after 5 seconds")),
          5000
        );
      });

      const countPromise = Notification.countDocuments({
        "receivers.userId": userId,
        "receivers.receivingData": {
          $elemMatch: {
            channel: "IN_APP",
            status: "SENT",
            read: false,
          },
        },
      });

      // Race the promises to handle both results and timeout
      const count = await Promise.race([countPromise, timeoutPromise]);

      logger.info(`Found ${count} unread notifications for user: ${userId}`);

      return res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      if (
        retryCount < maxRetries &&
        (error.code === "ECONNRESET" ||
          error.name === "MongoNetworkError" ||
          error.message.includes("timeout"))
      ) {
        retryCount++;
        const delay = retryCount * 500; // Progressive backoff: 500ms, 1000ms, 1500ms

        logger.warn(
          `Connection error in getUnreadNotificationsCount. Retrying (${retryCount}/${maxRetries}) after ${delay}ms`,
          {
            error: error.message,
            code: error.code,
            userId: req.params.userId,
          }
        );

        return new Promise((resolve) => {
          setTimeout(() => resolve(attemptFetchCount()), delay);
        });
      }

      logger.error(`Failed to get unread notifications count:`, {
        error: error.message,
        code: error.code,
        stack: error.stack,
        userId: req.params.userId,
        retryAttempts: retryCount,
      });

      return res.status(500).json({
        success: false,
        error: "Failed to get unread notifications count",
        details: error.message,
      });
    }
  };

  return attemptFetchCount();
};

const getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    // Find notifications that are unread
    const notifications = await Notification.find({
      "receivers.userId": userId,
      "receivers.receivingData": {
        $elemMatch: {
          channel: "IN_APP",
          status: "SENT",
          read: false,
        },
      },
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Mark these notifications as delivered if not already
    for (const notification of notifications) {
      const receiver = notification.receivers.find(
        (r) => r.userId.toString() === userId
      );

      if (receiver) {
        const inAppChannel = receiver.receivingData.find(
          (rd) => rd.channel === "IN_APP" && !rd.delivered
        );

        if (inAppChannel) {
          // Update delivered status
          await Notification.updateOne(
            {
              _id: notification._id,
              "receivers.userId": userId,
              "receivers.receivingData.channel": "IN_APP",
            },
            {
              $set: {
                "receivers.$.receivingData.$[elem].delivered": true,
                "receivers.$.receivingData.$[elem].deliveredAt": new Date(),
              },
            },
            {
              arrayFilters: [{ "elem.channel": "IN_APP" }],
            }
          );
        }
      }
    }

    const total = await Notification.countDocuments({
      "receivers.userId": userId,
      "receivers.receivingData": {
        $elemMatch: {
          channel: "IN_APP",
          status: "SENT",
          read: false,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Failed to get unread notifications:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get unread notifications",
      details: error.message,
    });
  }
};

module.exports = {
  createNotification,
  getNotificationsByRole,
  sendDirectNotification,
  markNotificationAsRead,
  getUnreadNotificationsCount,
  getUnreadNotifications,
  setSocketIO,
};
