const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const Delivery = require('./routes/delivery-routes');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, specify your actual domains
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  },
  pingTimeout: 20000, // Increase ping timeout to 20 seconds
  pingInterval: 10000, // Set ping interval to 10 seconds
});

app.use(cors());
app.use(helmet());
app.use(express.json());

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: process.env.SERVICE_NAME || 'Socket Service' });
});

app.use('/api/deliveries', Delivery);

// Diagnostic endpoint for socket connections
app.get('/api/socket-status', (req, res) => {
  try {
    const rooms = io.sockets.adapter.rooms;
    const sockets = io.sockets.sockets;
    
    const roomsData = {};
    
    // Only collect order tracking rooms
    for (const [roomName, roomSet] of rooms.entries()) {
      if (roomName.startsWith('orderRoom_')) {
        roomsData[roomName] = {
          clients: Array.from(roomSet).length,
          clientIds: Array.from(roomSet)
        };
      }
    }
    
    res.json({
      status: 'ok',
      connectedClients: sockets.size,
      trackingRooms: roomsData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3005;
// REMOVE app.listen and use server.listen instead:
server.listen(PORT, () => {
  console.log(`${process.env.SERVICE_NAME || 'Socket Service'} running on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('👋 New connection established:', socket.id);
  
  socket.on('riderAcceptOrder', (data) => {
    console.log(`🔔 Rider ${data.riderId} accepted order ${data.orderId}`);
    // Join both the formatted and raw order ID rooms to ensure compatibility
    socket.join(`orderRoom_${data.orderId}`);
    
    // Log the rooms this socket has joined
    console.log(`🚪 Socket ${socket.id} joined rooms:`, Array.from(socket.rooms));
  });
  
  socket.on('customerTrackOrder', (data) => {
    // Extract the MongoDB ID from formatted IDs like "ORD-67815" if needed
    let orderId = data.orderId;
    console.log(`👀 Customer tracking order ${orderId}`);
    
    // Join room with the exact orderId sent by the client
    socket.join(`orderRoom_${orderId}`);
    
    // Log the rooms this socket has joined
    console.log(`🚪 Socket ${socket.id} joined customer tracking room for order ${orderId}`);
    console.log(`📊 Current rooms for this socket:`, Array.from(socket.rooms));
    
    // Emit an acknowledgment back to the client
    socket.emit('trackingSessionEstablished', {
      success: true,
      message: 'You are now tracking this order',
      orderId: orderId
    });
  });

  socket.on('riderLocation', (data) => {
    console.log(`📍 Received rider location update for order ${data.orderId}:`, {
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: data.timestamp || new Date().toISOString()
    });
    
    // Send confirmation back to the rider
    socket.emit('locationReceived', {
      success: true,
      timestamp: new Date().toISOString(),
      orderId: data.orderId
    });
    
    // Log the client count in the room before emitting
    const room = `orderRoom_${data.orderId}`;
    const clientsInRoom = io.sockets.adapter.rooms.get(room)?.size || 0;
    console.log(`👥 Room ${room} has ${clientsInRoom} clients connected`);
    
    if (clientsInRoom > 0) {
      // Broadcast to everyone in the room including the sender
      io.to(room).emit('riderLocationUpdate', data);
      console.log(`✅ Location update broadcasted to ${clientsInRoom} clients in room ${room}`);
    } else {
      console.log(`⚠️ No clients in room ${room} to receive location update`);
    }
    
    // Also broadcast with just the order number for compatibility
    if (data.orderId.includes('-')) {
      const rawOrderId = data.orderId.split('-')[1];
      const altRoom = `orderRoom_${rawOrderId}`;
      const altClientsInRoom = io.sockets.adapter.rooms.get(altRoom)?.size || 0;
      
      if (altClientsInRoom > 0) {
        io.to(altRoom).emit('riderLocationUpdate', data);
        console.log(`✅ Location update also broadcasted to ${altClientsInRoom} clients in alt room ${altRoom}`);
      }
    }
  });
  
  // Handle manual request for initial location
  socket.on('requestInitialRiderLocation', (data) => {
    console.log(`🔄 Client requested initial rider location for order ${data.orderId}`);
    // This could trigger a request to the rider app to send their location immediately
    socket.to(`orderRoom_${data.orderId}`).emit('requestLocationUpdate', {
      orderId: data.orderId,
      requestedAt: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`👋 Socket disconnected: ${socket.id}`);
  });
  
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

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

module.exports = app;
