// smsService.js
const axios = require("axios");
const winston = require("winston");

// Minimal logger configuration
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

/**
 * Format phone number for Sri Lankan numbers (remove first 0, add 94)
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Clean the number (remove spaces, dashes, etc.)
  let formatted = phoneNumber.trim().replace(/\D/g, "");

  // If number starts with 0, remove it and add 94
  if (formatted.startsWith("0")) {
    formatted = "94" + formatted.substring(1);
  }
  // If number doesn't start with 94, add it
  else if (!formatted.startsWith("94")) {
    formatted = "94" + formatted;
  }

  return formatted;
};

/**
 * Send SMS notification using notify.lk
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<boolean>} - Success status
 */
const sendNotificationSMS = async (to, message) => {
  try {
    // Format the phone number
    const formattedNumber = formatPhoneNumber(to);

    // Prepare form data
    const params = new URLSearchParams();
    params.append("user_id", process.env.NOTIFYLK_USER_ID);
    params.append("api_key", process.env.NOTIFYLK_API_KEY);
    params.append("sender_id", process.env.NOTIFYLK_SENDER_ID);
    params.append("to", formattedNumber);
    params.append("message", message);

    // Send the request
    const response = await axios.post(
      "https://app.notify.lk/api/v1/send",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Check response
    if (response.data && response.data.status === "success") {
      return true;
    }

    return false;
  } catch (error) {
    logger.error("SMS sending failed:", {
      error: error.message,
      to,
    });
    return false;
  }
};

module.exports = {
  sendNotificationSMS,
  formatPhoneNumber, // Export for testing if needed
};
