const jwt = require('jsonwebtoken');
const axios = require('axios');

// Config for user-service connection
const userServiceBaseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

exports.authenticate = async (req, res, next) => {
  try {
    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user info in request object
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

exports.authorizeRestaurant = async (req, res, next) => {
  try {
    // Check if user has restaurant role
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Restaurant privileges required.'
      });
    }
    
    // Validate that this user owns this restaurant
    const { restaurantId } = req.params;
    
    // Make API call to user-service to validate ownership
    // This is how microservices communicate with each other
    try {
      const response = await axios.get(`${userServiceBaseUrl}/restaurants/validate-restaurant-access`, {
        params: {
          userId: req.user.id,
          restaurantId: restaurantId
        },
        headers: {
          'Authorization': req.headers.authorization
        }
      });
      
      if (response.data.success) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to manage this restaurant'
        });
      }
    } catch (error) {
      // If user-service is down or returns an error
      console.error('Error validating with user-service:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error validating restaurant ownership'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Authorization error'
    });
  }
};