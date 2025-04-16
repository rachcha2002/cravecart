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

/**
 * Add restaurant image
 * @route POST /api/users/restaurant/images
 * @access Private/Restaurant
 */
const addRestaurantImage = async (req, res) => {
  try {
    const { url, description, isPrimary } = req.body;
    const userId = req.user._id;

    if (!url) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "restaurant") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (isPrimary) {
      if (user.restaurantInfo.images) {
        user.restaurantInfo.images.forEach((image) => {
          image.isPrimary = false;
        });
      } else {
        user.restaurantInfo.images = [];
      }
    }

    user.restaurantInfo.images.push({
      url,
      description,
      isPrimary: isPrimary || false,
      uploadedAt: Date.now(),
    });

    await user.save();

    res.json({
      message: "Image added successfully",
      images: user.restaurantInfo.images,
    });
  } catch (error) {
    console.error("Add restaurant image error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Remove restaurant image
 * @route DELETE /api/users/restaurant/images/:imageId
 * @access Private/Restaurant
 */
const removeRestaurantImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user || user.role !== "restaurant") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.restaurantInfo.images) {
      return res.status(404).json({ message: "No images found" });
    }

    user.restaurantInfo.images = user.restaurantInfo.images.filter(
      (image) => image._id.toString() !== imageId
    );

    await user.save();

    res.json({
      message: "Image removed successfully",
      images: user.restaurantInfo.images,
    });
  } catch (error) {
    console.error("Remove restaurant image error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update restaurant description
 * @route PATCH /api/users/restaurant/description
 * @access Private/Restaurant
 */
const updateRestaurantDescription = async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.user._id;

    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "restaurant") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.restaurantInfo) {
      user.restaurantInfo = {};
    }

    user.restaurantInfo.description = description;
    await user.save();

    res.json({
      message: "Restaurant description updated successfully",
      description: user.restaurantInfo.description,
    });
  } catch (error) {
    console.error("Update restaurant description error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Add customer default location
 * @route POST /api/users/customer/locations
 * @access Private/Customer
 */
const addDefaultLocation = async (req, res) => {
  try {
    const { name, address, coordinates, isDefault } = req.body;
    const userId = req.user._id;

    if (!name || !address || !coordinates) {
      return res
        .status(400)
        .json({ message: "Name, address, and coordinates are required" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.defaultLocations) {
      user.defaultLocations = [];
    }

    if (isDefault) {
      user.defaultLocations.forEach((location) => {
        location.isDefault = false;
      });
    }

    user.defaultLocations.push({
      name,
      address,
      location: {
        type: "Point",
        coordinates,
      },
      isDefault: isDefault || false,
      createdAt: Date.now(),
    });

    await user.save();

    res.json({
      message: "Default location added successfully",
      locations: user.defaultLocations,
    });
  } catch (error) {
    console.error("Add default location error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update customer default location
 * @route PUT /api/users/customer/locations/:locationId
 * @access Private/Customer
 */
const updateDefaultLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { name, address, coordinates, isDefault } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.defaultLocations || user.defaultLocations.length === 0) {
      return res.status(404).json({ message: "No locations found" });
    }

    const locationIndex = user.defaultLocations.findIndex(
      (loc) => loc._id.toString() === locationId
    );

    if (locationIndex === -1) {
      return res.status(404).json({ message: "Location not found" });
    }

    if (isDefault) {
      user.defaultLocations.forEach((location) => {
        location.isDefault = false;
      });
    }

    user.defaultLocations[locationIndex] = {
      ...user.defaultLocations[locationIndex],
      name: name || user.defaultLocations[locationIndex].name,
      address: address || user.defaultLocations[locationIndex].address,
      location: coordinates
        ? {
            type: "Point",
            coordinates,
          }
        : user.defaultLocations[locationIndex].location,
      isDefault:
        isDefault !== undefined
          ? isDefault
          : user.defaultLocations[locationIndex].isDefault,
    };

    await user.save();

    res.json({
      message: "Default location updated successfully",
      locations: user.defaultLocations,
    });
  } catch (error) {
    console.error("Update default location error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Remove customer default location
 * @route DELETE /api/users/customer/locations/:locationId
 * @access Private/Customer
 */
const removeDefaultLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!user.defaultLocations || user.defaultLocations.length === 0) {
      return res.status(404).json({ message: "No locations found" });
    }

    user.defaultLocations = user.defaultLocations.filter(
      (location) => location._id.toString() !== locationId
    );

    await user.save();

    res.json({
      message: "Default location removed successfully",
      locations: user.defaultLocations,
    });
  } catch (error) {
    console.error("Remove default location error:", error);
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
  addRestaurantImage,
  removeRestaurantImage,
  updateRestaurantDescription,
  addDefaultLocation,
  updateDefaultLocation,
  removeDefaultLocation,
};
