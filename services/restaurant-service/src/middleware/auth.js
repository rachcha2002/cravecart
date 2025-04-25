// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { getUserById } = require('../utils/userServiceClient');

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * Authenticate user with JWT token from Authorization header
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user to request object
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Authorize restaurant owners/staff to manage their own restaurant's menu
 * This middleware should be used after the authenticate middleware
 */
exports.authorizeRestaurant = async (req, res, next) => {
  try {
    // First check if user has admin role (can access all)
    if (req.user.role === 'admin') {
      return next();
    }

    // Get the restaurant ID either from the request body, params, or query
    let restaurantId = req.body.restaurantId;
    
    // If no restaurantId in body, check if we're dealing with existing menu
    if (!restaurantId) {
      // For update operations using menuId
      if (req.params.id) {
        const Menu = require('../models/menu');
        const menu = await Menu.findById(req.params.id);
        if (!menu) {
          return res.status(404).json({
            success: false,
            message: 'Menu not found'
          });
        }
        restaurantId = menu.restaurantId;
      } 
      // For operations on existing menu using menuId
      else if (req.params.menuId) {
        const Menu = require('../models/menu');
        const menu = await Menu.findById(req.params.menuId);
        if (!menu) {
          return res.status(404).json({
            success: false,
            message: 'Menu not found'
          });
        }
        restaurantId = menu.restaurantId;
      }
    }

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required'
      });
    }

    // Get user details from user service
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is associated with the restaurant
    // This assumes user object has restaurantId property or restaurants array
    const isRestaurantOwner = user.restaurantId && user.restaurantId.toString() === restaurantId.toString();
    const isRestaurantStaff = user.restaurants && 
                             Array.isArray(user.restaurants) && 
                             user.restaurants.some(id => id.toString() === restaurantId.toString());

    if (isRestaurantOwner || isRestaurantStaff) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You are not authorized to manage this restaurant\'s menu'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

/**
 * Check if user has admin role
 */
exports.authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Admin access required'
  });
};

/**
 * Middleware to authorize specific roles
 * @param {Array} roles - Array of authorized roles
 */
exports.authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action'
    });
  };
};