// emailService.js
const nodemailer = require("nodemailer");
const winston = require("winston");

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
  ],
});

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @param {string|null} html - Optional HTML content
 * @returns {Promise<boolean>} - Success status
 */
const sendNotificationEmail = async (to, subject, text, options = {}) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: "CraveCart Notifications",
        address: process.env.EMAIL_FROM,
      },
      to,
      subject,
      text,
    };

    // Add HTML content if provided
    if (options.html) {
      mailOptions.html = options.html;
    }

    // Add attachments if provided
    if (options.attachments && Array.isArray(options.attachments)) {
      mailOptions.attachments = options.attachments;
    }

    // Send the email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    logger.error("Email sending failed:", {
      error: error.message,
      to,
      subject,
    });
    return false;
  }
};

/**
 * Send an email via API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMail = async (req, res) => {
  const { to, subject, text, html, attachments, fromName } = req.body;

  // Validate required fields
  if (!to || !subject) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: to and subject are required",
    });
  }

  try {
    // Create mail options
    const mailOptions = {
      from: {
        name: fromName || "CraveCart Notifications",
        address: process.env.EMAIL_USER,
      },
      to,
      subject,
    };

    // Add optional fields if provided
    if (text) mailOptions.text = text;
    if (html) mailOptions.html = html;
    if (attachments && Array.isArray(attachments)) {
      mailOptions.attachments = attachments;
    }

    // Create transporter and send mail
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    logger.error("Error sending email:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  sendNotificationEmail,
  sendMail,
};
