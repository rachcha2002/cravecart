const mongoose = require("mongoose");

const receiverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  receivingData: [
    {
      channel: {
        type: String,
        enum: ["SMS", "EMAIL", "IN_APP"],
        required: true,
      },
      status: {
        type: String,
        enum: ["PENDING", "SENT", "FAILED"],
        default: "PENDING",
      },
      sentAt: {
        type: Date,
      },
    },
  ],
});

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  roles: [
    {
      type: String,
      enum: ["ADMIN", "CUSTOMER", "RESTAURANT_OWNER", "DELIVERY_PERSON"],
      required: true,
    },
  ],
  channels: [
    {
      type: String,
      enum: ["SMS", "EMAIL", "IN_APP"],
      required: true,
    },
  ],
  receivers: [receiverSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
notificationSchema.index({ "receivers.userId": 1 });
notificationSchema.index({ "receivers.receivingData.channel": 1 });
notificationSchema.index({ "receivers.receivingData.status": 1 });
notificationSchema.index({ roles: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
