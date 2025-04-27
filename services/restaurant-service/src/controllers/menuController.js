const Menu = require("../models/Menu");
const mongoose = require("mongoose");
const axios = require("axios");

const USER_SERVICE_URL =
  `${process.env.USER_SERVICE_URL}/api` || "http://localhost:3001/api";

/**
 * Validates if a user has access to a restaurant
 * @param {string} userId - The ID of the user
 * @param {string} restaurantId - The ID of the restaurant
 * @returns {Promise<boolean>} - True if user has access, throws error otherwise
 */
const validateRestaurantAccess = async (userId, restaurantId) => {
  // Validate that restaurantId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new Error("Invalid restaurant ID");
  }

  try {
    // Make an API call to the user-service to validate access
    const response = await axios.get(
      `${USER_SERVICE_URL}/restaurants/validate-restaurant-access`,
      {
        params: {
          userId,
          restaurantId,
        },
      }
    );

    // If response is successful and user has access
    if (response.data.success && response.data.hasAccess) {
      return true;
    } else {
      throw new Error("User does not have access to this restaurant");
    }
  } catch (error) {
    // If there's an error with the request itself
    if (error.response) {
      // The user-service responded with an error status
      throw new Error(
        `Access validation failed: ${
          error.response.data.message || "Unauthorized"
        }`
      );
    } else if (error.request) {
      // No response was received from the user-service
      throw new Error("Unable to validate access: User service unavailable");
    } else {
      // Something else went wrong
      throw error;
    }
  }
};

exports.createMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    //const userId = req.user.id; // Assuming auth middleware sets this

    // Validate restaurant access
    // await validateRestaurantAccess(userId, restaurantId);

    // Check if menu already exists for this restaurant
    const existingMenu = await Menu.findOne({ restaurantId });
    if (existingMenu) {
      return res.status(400).json({
        success: false,
        message: "Menu already exists for this restaurant",
      });
    }

    // Create new menu with empty categories
    const newMenu = new Menu({
      restaurantId,
      categories: [],
    });

    await newMenu.save();

    res.status(201).json({
      success: true,
      data: newMenu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating menu",
    });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const menu = await Menu.findOne({ restaurantId });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving menu",
    });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    //const userId = req.user.id;
    const { name, description, image, availabilityTimes, sortOrder } = req.body;

    // Validate restaurant access
    // await validateRestaurantAccess(userId, restaurantId);

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Create new category
    const newCategory = {
      name,
      description,
      image,
      items: [],
      availabilityTimes: availabilityTimes || { allDay: true },
      sortOrder: sortOrder || menu.categories.length,
      isAvailable: true,
    };

    menu.categories.push(newCategory);
    await menu.save();

    res.status(201).json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error adding category",
    });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.params;
    //const userId = req.user.id;

    // Validate restaurant access
    // await validateRestaurantAccess(userId, restaurantId);

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Find the category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Create the menu item from request body
    const menuItem = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      discountedPrice: req.body.discountedPrice,
      imageUrl: req.body.imageUrl,
      calories: req.body.calories,
      preparationTime: req.body.preparationTime,
      isVegetarian: req.body.isVegetarian,
      isVegan: req.body.isVegan,
      isGlutenFree: req.body.isGlutenFree,
      spicyLevel: req.body.spicyLevel,
      allergens: req.body.allergens,
      customizationGroups: req.body.customizationGroups || [],
      isAvailable: req.body.isAvailable !== false, // Default to true
      isFeatured: req.body.isFeatured || false,
    };

    // Add to category
    category.items.push(menuItem);
    await menu.save();

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error adding menu item",
    });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { restaurantId, categoryId, itemId } = req.params;
    //const userId = req.user.id;

    // Validate restaurant access
    // await validateRestaurantAccess(userId, restaurantId);

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Find the category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Find the menu item
    const item = category.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Update fields
    const updateFields = [
      "name",
      "description",
      "price",
      "discountedPrice",
      "imageUrl",
      "calories",
      "preparationTime",
      "isVegetarian",
      "isVegan",
      "isGlutenFree",
      "spicyLevel",
      "allergens",
      "customizationGroups",
      "isAvailable",
      "isFeatured",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await menu.save();

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating menu item",
    });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, categoryId, itemId } = req.params;
    //const userId = req.user.id;

    // Validate restaurant access
    //await validateRestaurantAccess(userId, restaurantId);

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Find the category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Remove the item
    const itemIndex = category.items.findIndex(
      (item) => item._id.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    category.items.splice(itemIndex, 1);
    await menu.save();

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting menu item",
    });
  }
};

exports.getMenuItem = async (req, res) => {
  try {
    const { restaurantId, categoryId, itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID",
      });
    }

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Find the category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Find the menu item
    const item = category.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving menu item",
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.params;
    //const userId = req.user.id;

    // Validate restaurant access
    //await validateRestaurantAccess(userId, restaurantId);

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Find the category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Update fields
    const updateFields = [
      "name",
      "description",
      "image",
      "availabilityTimes",
      "sortOrder",
      "isAvailable",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        category[field] = req.body[field];
      }
    });

    await menu.save();

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating category",
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.params;
    //const userId = req.user.id;

    // Validate restaurant access
    // await validateRestaurantAccess(userId, restaurantId);

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Remove the category
    const categoryIndex = menu.categories.findIndex(
      (cat) => cat._id.toString() === categoryId
    );
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    menu.categories.splice(categoryIndex, 1);
    await menu.save();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting category",
    });
  }
};

exports.addCustomizationGroup = async (req, res) => {
  try {
    const { restaurantId, categoryId, itemId } = req.params;
    // const userId = req.user.id;
    const { name, required, multiSelect, options } = req.body;

    // Validate restaurant access
    //await validateRestaurantAccess(userId, restaurantId);

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Find the category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Find the menu item
    const item = category.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Create new customization group
    const newGroup = {
      name,
      required: required || false,
      multiSelect: multiSelect || false,
      options: options || [],
    };

    item.customizationGroups.push(newGroup);
    await menu.save();

    res.status(201).json({
      success: true,
      data: newGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error adding customization group",
    });
  }
};

exports.addCustomizationOption = async (req, res) => {
  try {
    const { restaurantId, categoryId, itemId, groupId } = req.params;
    //const userId = req.user.id;
    const { name, price } = req.body;

    // Validate restaurant access
    // await validateRestaurantAccess(userId, restaurantId);

    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found for this restaurant",
      });
    }

    // Find the category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Find the menu item
    const item = category.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Find the customization group
    const group = item.customizationGroups.id(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Customization group not found",
      });
    }

    // Add the option
    const newOption = {
      name,
      price: price || 0,
    };

    group.options.push(newOption);
    await menu.save();

    res.status(201).json({
      success: true,
      data: newOption,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error adding customization option",
    });
  }
};

/**
 * Add menu image
 * @route POST /api/menus/addimage/:restaurantId/:categoryId/:itemId
 * @access Private/Restaurant
 */
exports.addMenuItemImage = async (req, res) => {
  try {
    const { url, description, restaurantId, categoryId, itemId } = req.body;

    if (!url) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    // Find the Menu for the restaurant
    const menu = await Menu.findOne({ restaurantId });
    if (!menu) {
      return res
        .status(404)
        .json({ message: "Menu not found for this restaurant" });
    }

    // Find the Category
    const category = menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Find the Menu Item
    const item = category.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Add image to the menu item
    if (!item.images) {
      item.images = []; // Initialize if not present
    }

    item.images.push({
      url,
      description: description || "",
      uploadedAt: Date.now(),
    });

    await menu.save(); // Save the updated menu

    res.json({
      success: true,
      message: "Image added successfully",
      images: item.images, // return updated images
    });
  } catch (error) {
    console.error("Add menu item image error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
