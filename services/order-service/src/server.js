const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your frontend URLs
    methods: ['GET', 'POST']
  },
  pingInterval: 25000,
  pingTimeout: 20000,
  connectTimeout: 10000
});

// Make io accessible across the application
app.set('io', io);

// Initialize SSE clients storage
app.set('sse-clients', {});

// Create a dedicated namespace for customer order updates
const customerNamespace = io.of('/customer-updates');

// Customer namespace connection handler
customerNamespace.on('connection', (socket) => {
  console.log('Customer connected to dedicated namespace:', socket.id);
  
  // Join customer-specific room
  socket.on('join-customer', (customerId) => {
    if (!customerId) return;
    
    console.log(`Customer ${customerId} joined dedicated namespace`);
    socket.join(`customer-${customerId}`);
  });
  
  // Join order-specific room
  socket.on('join-order', (orderId) => {
    if (!orderId) return;
    
    console.log(`Customer joining order room in dedicated namespace: ${orderId}`);
    socket.join(`order-${orderId}`);
    
    // Send confirmation
    socket.emit('joined-order', {
      orderId,
      success: true,
      message: `Successfully joined order room ${orderId} in customer namespace`
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`Customer disconnected from dedicated namespace (${reason}):`, socket.id);
  });
});

// Make customer namespace accessible across the application
app.set('customerIo', customerNamespace);

// Main socket.IO connection handler (for backward compatibility with restaurant portal)
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join restaurant-specific room when restaurant connects
  socket.on('join-restaurant', (restaurantId) => {
    console.log(`Restaurant ${restaurantId} joined`);
    socket.join(`restaurant-${restaurantId}`);
  });
  
  // Join customer-specific room when customer connects
  socket.on('join-customer', (customerId) => {
    if (!customerId) {
      console.log('Empty customer ID provided, cannot join room');
      return;
    }
    
    console.log(`Customer ${customerId} is joining room`);
    socket.join(`customer-${customerId}`);
    
    // Make sure to handle both id formats to support both portals
    const idStr = String(customerId);
    if (idStr.includes('_id') || idStr.includes('id')) {
      // If the ID includes "id" text, it might be an object instead of just an ID string
      try {
        const idObj = JSON.parse(idStr);
        const actualId = idObj._id || idObj.id;
        if (actualId && actualId !== customerId) {
          console.log(`Customer also joining with parsed ID: ${actualId}`);
          socket.join(`customer-${actualId}`);
        }
      } catch (err) {
        // Not a JSON object, ignore
        console.log('Not a parsable JSON object ID, using as-is');
      }
    }
    
    // Confirm room was joined by listing all rooms for this socket
    const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    console.log(`Customer socket ${socket.id} is now in rooms:`, rooms);
  });
  
  // Join order-specific room
  socket.on('join-order', (orderId) => {
    if (!orderId) {
      console.log('Empty order ID provided, cannot join room');
      return;
    }
    
    console.log(`Joining order room: ${orderId}`);
    socket.join(`order-${orderId}`);
    
    // Confirm room was joined by listing all rooms for this socket
    const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    console.log(`Order socket ${socket.id} is now in rooms:`, rooms);
    
    // Send a confirmation back to the client
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

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Simple health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Import routes
const orderRoutes = require('./routes/order.routes');

// Register routes
app.use('/api/orders', orderRoutes);

// Start the server
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

module.exports = { app, io }; // Export both app and io for testing
