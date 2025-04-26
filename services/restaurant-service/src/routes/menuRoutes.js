const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticate, authorizeRestaurant } = require('../middleware/auth');

// Middleware to authenticate and authorize restaurant users
// These would communicate with the user-service to verify tokens and roles

// Menu routes
router.post('/create/:restaurantId', menuController.createMenu);
router.get('/getmenus/:restaurantId', menuController.getMenu);

// Category routes
router.post('/createcategory/:restaurantId', menuController.addCategory);
router.put('/editcategory/:restaurantId/:categoryId', menuController.updateCategory);
router.delete('/deletecategory/:restaurantId/:categoryId',  menuController.deleteCategory);

// Menu item routes
router.post('/:restaurantId/menu/categories/:categoryId/items',  menuController.addMenuItem);
// Add Image route
router.post('/addmenuitemimage/:restaurantId/:categoryId/:itemId', menuController.addMenuItemImage);
router.get('/:restaurantId/menu/categories/:categoryId/items/:itemId', menuController.getMenuItem);
router.put('/:restaurantId/menu/categories/:categoryId/items/:itemId',  menuController.updateMenuItem);
router.delete('/:restaurantId/menu/categories/:categoryId/items/:itemId',  menuController.deleteMenuItem);

// Customization routes
router.post('/:restaurantId/menu/categories/:categoryId/items/:itemId/customization-groups',  menuController.addCustomizationGroup);
router.post('/:restaurantId/menu/categories/:categoryId/items/:itemId/customization-groups/:groupId/options', menuController.addCustomizationOption);

module.exports = router;