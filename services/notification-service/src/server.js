const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { createServer } = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const notificationRoutes = require("./routes/notificationRoutes");
const notificationController = require("./controllers/notificationController");

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Create namespaces for different client types
const customerIO = io.of("/customer");
const restaurantIO = io.of("/restaurant");
const adminIO = io.of("/admin");
const deliveryIO = io.of("/delivery");

// Handle customer connections
customerIO.on("connection", (socket) => {
  console.log("Customer client connected:", socket.id);

  socket.on("join-customer", (userId) => {
    socket.join(userId);
    console.log(`Customer ${userId} joined room ${socket.id}`);
    socket.emit("joined", {
      userId,
      message: "Successfully joined customer notification room",
    });
  });

  // Listen for order status updates
  socket.on("order-status-update", (data) => {
    console.log("Received order status update:", data);
    // Emit to specific customer
    customerIO.to(data.userId).emit("notification", {
      type: "order-status-update",
      message: data.message,
      orderId: data.orderId,
      data: data.orderData,
    });
  });

  socket.on("disconnect", () => {
    console.log("Customer client disconnected:", socket.id);
  });
});

// Handle restaurant connections
restaurantIO.on("connection", (socket) => {
  console.log("Restaurant client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`Restaurant ${userId} joined room ${socket.id}`);
    socket.emit("joined", {
      userId,
      message: "Successfully joined restaurant notification room",
    });
  });

  socket.on("disconnect", () => {
    console.log("Restaurant client disconnected:", socket.id);
  });
});

// Handle admin connections
adminIO.on("connection", (socket) => {
  console.log("Admin client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`Admin ${userId} joined room ${socket.id}`);
    socket.emit("joined", {
      userId,
      message: "Successfully joined admin notification room",
    });
  });

  socket.on("disconnect", () => {
    console.log("Admin client disconnected:", socket.id);
  });
});

// Handle delivery connections
deliveryIO.on("connection", (socket) => {
  console.log("Delivery client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`Delivery ${userId} joined room ${socket.id}`);
    socket.emit("joined", {
      userId,
      message: "Successfully joined delivery notification room",
    });
  });

  socket.on("disconnect", () => {
    console.log("Delivery client disconnected:", socket.id);
  });
});

notificationController.setSocketIO({
  customer: customerIO,
  restaurant: restaurantIO,
  admin: adminIO,
  delivery: deliveryIO,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Set Socket.IO instance in notification controller
notificationController.setSocketIO(io);

// Routes
app.use("/api/notifications", notificationRoutes);

// Simple health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

const PORT = process.env.PORT || 5005;

httpServer.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
