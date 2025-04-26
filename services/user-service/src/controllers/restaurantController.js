const User = require('../models/User'); // Adjust the path as needed based on your project structure

/**
 * @desc    Get all restaurants
 * @route   GET /api/restaurants
 * @access  Public
 */
const getRestaurants = async (req, res) => {
  try {
    const restaurants = await User.find({ role: "restaurant" })
      .select('name restaurantInfo profilePicture email phoneNumber address')
      .lean();
    
    if (restaurants.length === 0) {
      return res.status(404).json({ success: false, message: "No restaurants found" });
    }

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const getRestaurantById = async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await User.findById(id)
      .select('name restaurantInfo profilePicture email phoneNumber address')
      .lean();

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error("Error fetching restaurant by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const validateRestaurantAccess = async (req, res) => {
  try {
    const { userId, restaurantId } = req.query;
    
    // Validate that both parameters are provided
    if (!userId || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Both userId and restaurantId are required'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        hasAccess: false
      });
    }
    
    // Check if user has restaurant role
    if (user.role !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: 'User is not a restaurant owner',
        hasAccess: false
      });
    }
    
    // Check if this user owns this restaurant
    // Based on your User schema, you're storing restaurantId in user.restaurantInfo
    // We need to compare that with the requested restaurantId
    if (user._id.toString() !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'User does not have access to this restaurant',
        hasAccess: false
      });
    }
    
    // If all checks pass, return success
    return res.status(200).json({
      success: true,
      message: 'User has access to this restaurant',
      hasAccess: true
    });
  } catch (error) {
    console.error('Error validating restaurant access:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating restaurant access',
      hasAccess: false
    });
  }
};

module.exports = { getRestaurants, getRestaurantById, validateRestaurantAccess };