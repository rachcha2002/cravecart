const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { port, serviceName, connectDB } = require("./config");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const deliveryRoutes = require("./routes/DeliveryRoutes");

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Simple health check route - doesn't depend on database connectivity
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: serviceName, timestamp: new Date().toISOString() });
});

// Add health check at /api/health path for Kubernetes probes
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: serviceName, timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/deliveries", deliveryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(port, () => {
  console.log(`${serviceName} running on port ${port}`);
});

module.exports = app; 
