const User = require("../models/User");

/**
 * Get all users (admin only)
 * @route GET /api/users
 * @access Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, status, isVerified, page = 1, limit = 10 } = req.query;

    const query = {};

    // Apply filters if provided
    if (role) query.role = role;
    if (status) query.status = status;
    if (isVerified !== undefined) query.isVerified = isVerified === "true";

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private/Admin or Self
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Admin can access any user, others can only access themselves
    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private/Admin or Self
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Admin can update any user, others can only update themselves
    if (req.user.role !== "admin" && req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fields that can't be updated directly
    const restrictedFields = ["password", "role", "isVerified", "status"];

    // Only admin can update restricted fields
    if (req.user.role !== "admin") {
      restrictedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          delete req.body[field];
        }
      });
    }

    // Update user fields
    const updateData = { ...req.body, updatedAt: Date.now() };

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update user status (admin only)
 * @route PATCH /api/users/:id/status
 * @access Private/Admin
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: "User status updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Verify user (admin only)
 * @route PATCH /api/users/:id/verify
 * @access Private/Admin
 */
const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isVerified = isVerified;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: `User ${isVerified ? "verified" : "unverified"} successfully`,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Verify user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get nearby restaurants (for customers)
 * @route GET /api/users/restaurants/nearby
 * @access Private
 */
const getNearbyRestaurants = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters, default 10km

    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    const restaurants = await User.find({
      role: "restaurant",
      isVerified: true,
      status: "active",
      "restaurantInfo.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).select("-password");

    res.json({ restaurants });
  } catch (error) {
    console.error("Get nearby restaurants error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update delivery personnel location
 * @route PATCH /api/users/delivery/location
 * @access Private/Delivery
 */
const updateDeliveryLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    // Ensure user is delivery personnel
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update delivery personnel location
    req.user.deliveryInfo.currentLocation = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
    req.user.updatedAt = Date.now();
    await req.user.save();

    res.json({
      message: "Location updated successfully",
      location: req.user.deliveryInfo.currentLocation,
    });
  } catch (error) {
    console.error("Update delivery location error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update delivery availability status
 * @route PATCH /api/users/delivery/availability
 * @access Private/Delivery
 */
const updateDeliveryAvailability = async (req, res) => {
  try {
    const { availabilityStatus } = req.body;

    if (!["available", "busy", "offline"].includes(availabilityStatus)) {
      return res.status(400).json({ message: "Invalid availability status" });
    }

    // Ensure user is delivery personnel
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update delivery personnel availability status
    req.user.deliveryInfo.availabilityStatus = availabilityStatus;
    req.user.updatedAt = Date.now();
    await req.user.save();

    res.json({
      message: "Availability status updated successfully",
      availabilityStatus: req.user.deliveryInfo.availabilityStatus,
    });
  } catch (error) {
    console.error("Update delivery availability error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get available delivery personnel near a location
 * @route GET /api/users/delivery/available
 * @access Private/Admin or Restaurant
 */
const getAvailableDeliveryPersonnel = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query; // maxDistance in meters, default 5km

    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    // Check if user has permission
    if (!["admin", "restaurant"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find available delivery personnel near the location
    const deliveryPersonnel = await User.find({
      role: "delivery",
      isVerified: true,
      status: "active",
      "deliveryInfo.availabilityStatus": "available",
      "deliveryInfo.currentLocation": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).select("-password");

    res.json({ deliveryPersonnel });
  } catch (error) {
    console.error("Get available delivery personnel error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  verifyUser,
  deleteUser,
  getNearbyRestaurants,
  updateDeliveryLocation,
  updateDeliveryAvailability,
  getAvailableDeliveryPersonnel,
};
