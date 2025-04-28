const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
const axios = require('axios');
const DeliveryRoutes = require('./routes/Delivery-routes'); 

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Helper function to send in-app notifications
const sendInAppNotification = async (userId, title, message, role = 'CUSTOMER') => {
  try {
    console.log(`[NOTIFICATION] Preparing to send notification to user ${userId} with role ${role}`);
    console.log(`[NOTIFICATION] Title: "${title}"`);
    console.log(`[NOTIFICATION] Message: "${message}"`);
    
    const notificationUrl = `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005'}/api/notifications/senddirect`;
    console.log(`[NOTIFICATION] Sending request to: ${notificationUrl}`);
    
    const payload = {
      title,
      message,
      userIds: [userId],
      channels: ['IN_APP']
    };
    console.log(`[NOTIFICATION] Request payload: ${JSON.stringify(payload)}`);
    
    const response = await axios.post(notificationUrl, payload);
    console.log(`[NOTIFICATION] Response status: ${response.status}`);
    console.log(`[NOTIFICATION] Response data: ${JSON.stringify(response.data)}`);
    
    console.log(`[NOTIFICATION] Successfully sent notification to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[NOTIFICATION] ERROR: Failed to send in-app notification to user ${userId}:`, error.message);
    if (error.response) {
      console.error(`[NOTIFICATION] ERROR: Response status: ${error.response.status}`);
      console.error(`[NOTIFICATION] ERROR: Response data:`, error.response.data);
    }
    return false;
  }
};

// Make sendInAppNotification accessible across the application
app.set('sendInAppNotification', sendInAppNotification);

// Enable compression for all responses
app.use(compression());

// Configure Socket.IO with optimized settings
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*' ,
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Optimize Socket.IO performance
  pingInterval: 30000,         // Reduced from default 25000
  pingTimeout: 10000,          // Reduced from default 20000
  connectTimeout: 5000,        // Reduced from default 10000
  maxHttpBufferSize: 1e6,      // 1MB max message size (default is 1MB)
  transports: ['websocket', 'polling'],  // Prefer WebSocket
  allowUpgrades: true,
  httpCompression: true,
  perMessageDeflate: {
    threshold: 1024            // Only compress messages larger than 1KB
  }
});

// Make io accessible across the application
app.set('io', io);

// Create a dedicated namespace for customer order updates with middleware
const customerNamespace = io.of('/customer-updates');

// Add authentication middleware to the customer namespace
customerNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    return next(new Error('Authentication token is required'));
  }
  
  try {
    // Simplified token validation - replace with proper JWT validation in production
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      socket.userId = payload.id || payload._id;
      
      if (!socket.userId) {
        return next(new Error('User ID not found in token'));
      }
      
      // Add user data to socket
      socket.user = payload;
      return next();
    }
    
    return next(new Error('Invalid token format'));
  } catch (err) {
    return next(new Error('Authentication failed'));
  }
});

// Customer namespace connection handler
customerNamespace.on('connection', (socket) => {
  // Join customer-specific room automatically using the authenticated user ID
  const customerId = socket.userId;
  if (customerId) {
    socket.join(`customer-${customerId}`);
    
    // Send confirmation to client
    socket.emit('connection-established', {
      success: true,
      message: 'Successfully connected to customer namespace'
    });
  }
  
  // Join additional customer-specific room (for backward compatibility)
  socket.on('join-customer', (customerId) => {
    if (!customerId) return;
    
    const roomName = `customer-${customerId}`;
    socket.join(roomName);
    socket.emit('joined-customer', { customerId, success: true });
  });
  
  // Join order-specific room
  socket.on('join-order', (orderId) => {
    if (!orderId) return;
    
    const roomName = `order-${orderId}`;
    socket.join(roomName);
    
    // Send confirmation
    socket.emit('joined-order', {
      orderId,
      success: true,
      message: `Successfully joined order room ${orderId}`
    });
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for customer ${socket.id}:`, error);
  });
});

// Make customer namespace accessible across the application
app.set('customerIo', customerNamespace);

// Main socket.IO connection handler (for backward compatibility)
io.on('connection', (socket) => {
  // Join restaurant-specific room when restaurant connects
  socket.on('join-restaurant', (restaurantId) => {
    if (!restaurantId) return;
    
    socket.join(`restaurant-${restaurantId}`);
    socket.emit('joined-restaurant', { restaurantId, success: true });
  });
  
  // Join customer-specific room
  socket.on('join-customer', (customerId) => {
    if (!customerId) return;
    
    socket.join(`customer-${customerId}`);
    socket.emit('joined-customer', { customerId, success: true });
  });
  
  // Join order-specific room
  socket.on('join-order', (orderId) => {
    if (!orderId) return;
    
    socket.join(`order-${orderId}`);
    
    // Send confirmation
    socket.emit('joined-order', { 
      orderId, 
      success: true, 
      message: `Successfully joined order room for ${orderId}` 
    });
  });
});

// Enhanced middleware setup with security and performance headers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: false // Change to false for simple cross-origin requests without credentials
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || '*']
    }
  }
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Add request logging middleware - only log in development environment
if (process.env.NODE_ENV === 'development') {
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});
}

// Simple health check route with additional server info
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    serverTime: new Date().toISOString(),
    connections: {
      socket: Object.keys(io.sockets.sockets).length,
      customerNamespace: Object.keys(customerNamespace.sockets).length
    }
  });
});

// Import routes
const orderRoutes = require('./routes/order.routes');

// Register routes with base path
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', DeliveryRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Handle unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred' 
  });
});

// Start the server
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  console.log(`Order service running on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
});

// Connect to MongoDB with optimized settings
// Connect to MongoDB with optimized settings
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB connected successfully to database: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};


connectDB();

// Handle unexpected errors and graceful shutdown
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Prevent abrupt shutdown, but log critical error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Prevent abrupt shutdown, but log critical error
});

module.exports = { app, io }; // Export both app and io for testing
