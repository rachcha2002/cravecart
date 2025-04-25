// src/routes/menuRoutes.js
const express = require('express');
const menuController = require('../controllers/menuController');
const router = express.Router();


// Base menu routes
router.post('/',  menuController.createMenu);
router.get('/restaurant/:restaurantId', menuController.getMenuByRestaurantId);
router.put('/:id',  menuController.updateMenu);

// Menu category routes
router.post('/:id/categories', menuController.addMenuCategory);
router.put('/:menuId/categories/:categoryId',  menuController.updateMenuCategory);
router.delete('/:menuId/categories/:categoryId',  menuController.deleteMenuCategory);

// Menu item routes
router.post('/:menuId/categories/:categoryId/items',  menuController.addMenuItem);
router.put('/:menuId/categories/:categoryId/items/:itemId',  menuController.updateMenuItem);
router.delete('/:menuId/categories/:categoryId/items/:itemId',  menuController.deleteMenuItem);

// Item availability toggle
router.patch('/:menuId/categories/:categoryId/items/:itemId/availability', menuController.toggleItemAvailability);

module.exports = router;