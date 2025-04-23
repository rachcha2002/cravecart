const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Enable compression for all responses
app.use(compression());

// Configure Socket.IO with optimized settings
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
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

// Initialize SSE clients storage with cleanup interval
const sseClients = {};
app.set('sse-clients', sseClients);

// Set up periodic cleanup of abandoned SSE connections (every 10 minutes)
setInterval(() => {
  const clients = app.get('sse-clients');
  let disconnectedClients = 0;
  
  // Check each order's clients
  Object.keys(clients).forEach(orderId => {
    const orderClients = clients[orderId];
    
    // Check each client for this order
    Object.keys(orderClients).forEach(clientId => {
      const client = orderClients[clientId];
      
      // Check if the client is still writable
      if (client.writableEnded || !client.writable) {
        delete orderClients[clientId];
        disconnectedClients++;
      }
    });
    
    // Clean up empty order entries
    if (Object.keys(orderClients).length === 0) {
      delete clients[orderId];
    }
  });
  
  if (disconnectedClients > 0) {
    console.log(`Cleaned up ${disconnectedClients} abandoned SSE connections`);
  }
}, 10 * 60 * 1000); // 10 minutes

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
  console.log('Customer connected to dedicated namespace:', socket.id, 'User ID:', socket.userId);
  
  // Join customer-specific room automatically using the authenticated user ID
  const customerId = socket.userId;
  if (customerId) {
    socket.join(`customer-${customerId}`);
    console.log(`Customer ${customerId} joined dedicated namespace automatically`);
    
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
    console.log(`Customer ${customerId} joined room: ${roomName}`);
    socket.emit('joined-customer', { customerId, success: true });
  });
  
  // Join order-specific room
  socket.on('join-order', (orderId) => {
    if (!orderId) return;
    
    const roomName = `order-${orderId}`;
    socket.join(roomName);
    console.log(`Client ${socket.id} joining order room: ${roomName}`);
    
    // Send confirmation
    socket.emit('joined-order', {
      orderId,
      success: true,
      message: `Successfully joined order room ${orderId}`
    });
  });
  
  // Handle disconnect with reason logging
  socket.on('disconnect', (reason) => {
    console.log(`Customer disconnected from namespace (${reason}):`, socket.id);
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
  console.log('Client connected to main namespace:', socket.id);
  
  // Join restaurant-specific room when restaurant connects
  socket.on('join-restaurant', (restaurantId) => {
    if (!restaurantId) return;
    
    console.log(`Restaurant ${restaurantId} joined`);
    socket.join(`restaurant-${restaurantId}`);
    socket.emit('joined-restaurant', { restaurantId, success: true });
  });
  
  // Join customer-specific room
  socket.on('join-customer', (customerId) => {
    if (!customerId) {
      console.log('Empty customer ID provided, cannot join room');
      return;
    }
    
    console.log(`Customer ${customerId} joining room in main namespace`);
    socket.join(`customer-${customerId}`);
    socket.emit('joined-customer', { customerId, success: true });
  });
  
  // Join order-specific room
  socket.on('join-order', (orderId) => {
    if (!orderId) {
      console.log('Empty order ID provided, cannot join room');
      return;
    }
    
    console.log(`Joining order room: ${orderId}`);
    socket.join(`order-${orderId}`);
    
    // Send confirmation
    socket.emit('joined-order', { 
      orderId, 
      success: true, 
      message: `Successfully joined order room for ${orderId}` 
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected (${reason}):`, socket.id);
  });
});

// Enhanced middleware setup with security and performance headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Simple health check route with additional server info
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    serverTime: new Date().toISOString(),
    connections: {
      socket: Object.keys(io.sockets.sockets).length,
      customerNamespace: Object.keys(customerNamespace.sockets).length,
      sse: Object.keys(app.get('sse-clients') || {}).reduce((count, orderId) => {
        return count + Object.keys(app.get('sse-clients')[orderId]).length;
      }, 0)
    }
  });
});

// Import routes
const orderRoutes = require('./routes/order.routes');

// Register routes with base path
app.use('/api/orders', orderRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start the server
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  console.log(`Order service running on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
});

// Connect to MongoDB with optimized settings
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log('MongoDB connected successfully');
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

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, io }; // Export both app and io for testing
