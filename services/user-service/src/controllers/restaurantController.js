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

module.exports = { getRestaurants, getRestaurantById };