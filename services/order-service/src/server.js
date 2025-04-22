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
  }
});

// Make io accessible across the application
app.set('io', io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join restaurant-specific room when restaurant connects
  socket.on('join-restaurant', (restaurantId) => {
    console.log(`Restaurant ${restaurantId} joined`);
    socket.join(`restaurant-${restaurantId}`);
  });
  
  // Join customer-specific room when customer connects
  socket.on('join-customer', (customerId) => {
    if (!customerId) return;
    
    console.log(`Customer ${customerId} joined`);
    socket.join(`customer-${customerId}`);
    
    // Make sure to handle both id formats to support both portals
    const idStr = String(customerId);
    if (idStr.includes('_id') || idStr.includes('id')) {
      // If the ID includes "id" text, it might be an object instead of just an ID string
      try {
        const idObj = JSON.parse(idStr);
        const actualId = idObj._id || idObj.id;
        if (actualId && actualId !== customerId) {
          socket.join(`customer-${actualId}`);
        }
      } catch (err) {
        // Not a JSON object, ignore
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
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
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`${process.env.SERVICE_NAME || 'Service'} running on port ${PORT}`);
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
