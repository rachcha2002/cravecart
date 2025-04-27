// seed-menu.js for seeding the database with sample menu data
const mongoose = require('mongoose');
const Menu = require('../models/menuModel');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/restaurant_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


// Sample menu data
const sampleMenu = {
  restaurantId: RESTAURANT_ID,
  categories: [
    {
      name: 'Appetizers',
      description: 'Start your meal with these delicious options',
      imageUrl: 'https://example.com/images/appetizers.jpg',
      sortOrder: 1,
      availabilityTimes: {
        allDay: true
      },
      items: [
        {
          name: 'Garlic Bread',
          description: 'Freshly baked bread with garlic butter and herbs',
          price: 4.99,
          calories: 320,
          preparationTime: 8,
          isVegetarian: true,
          spicyLevel: 0,
          allergens: ['Wheat', 'Dairy'],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Add Cheese',
              required: false,
              multiSelect: false,
              options: [
                { name: 'Add Mozzarella', price: 1.50 },
                { name: 'Add Parmesan', price: 1.00 }
              ]
            }
          ]
        },
        {
          name: 'Mozzarella Sticks',
          description: 'Golden fried mozzarella sticks served with marinara sauce',
          price: 7.99,
          discountedPrice: 5.99,
          calories: 450,
          preparationTime: 10,
          isVegetarian: true,
          spicyLevel: 0,
          allergens: ['Dairy', 'Wheat'],
          isAvailable: true
        },
        {
          name: 'Buffalo Wings',
          description: 'Crispy chicken wings tossed in spicy buffalo sauce',
          price: 11.99,
          calories: 580,
          preparationTime: 15,
          isVegetarian: false,
          spicyLevel: 2,
          allergens: [],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Sauce Options',
              required: false,
              multiSelect: false,
              options: [
                { name: 'Mild', price: 0 },
                { name: 'Medium', price: 0 },
                { name: 'Hot', price: 0 },
                { name: 'Extra Hot', price: 0.50 }
              ]
            },
            {
              name: 'Dipping Sauce',
              required: false,
              multiSelect: true,
              options: [
                { name: 'Blue Cheese', price: 0.75 },
                { name: 'Ranch', price: 0.75 },
                { name: 'Honey Mustard', price: 0.75 }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Main Courses',
      description: 'Hearty and satisfying entrees',
      imageUrl: 'https://example.com/images/mains.jpg',
      sortOrder: 2,
      availabilityTimes: {
        allDay: true
      },
      items: [
        {
          name: 'Classic Burger',
          description: 'Angus beef patty with lettuce, tomato, and special sauce',
          price: 12.99,
          calories: 780,
          preparationTime: 18,
          isVegetarian: false,
          spicyLevel: 0,
          allergens: ['Wheat', 'Dairy', 'Eggs'],
          isAvailable: true,
          isFeatured: true,
          customizationGroups: [
            {
              name: 'Protein Options',
              required: false,
              multiSelect: false,
              options: [
                { name: 'Extra Patty', price: 3.50 },
                { name: 'Substitute Chicken', price: 1.00 },
                { name: 'Substitute Impossible Patty', price: 2.50 }
              ]
            },
            {
              name: 'Add Cheese',
              required: false,
              multiSelect: false,
              options: [
                { name: 'American', price: 1.00 },
                { name: 'Cheddar', price: 1.00 },
                { name: 'Swiss', price: 1.50 },
                { name: 'Blue Cheese', price: 1.50 }
              ]
            },
            {
              name: 'Add Toppings',
              required: false,
              multiSelect: true,
              options: [
                { name: 'Bacon', price: 2.00 },
                { name: 'Avocado', price: 1.50 },
                { name: 'Caramelized Onions', price: 1.00 },
                { name: 'Sautéed Mushrooms', price: 1.00 },
                { name: 'Fried Egg', price: 1.50 }
              ]
            }
          ]
        },
        {
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon with lemon herb butter, served with seasonal vegetables',
          price: 18.99,
          calories: 520,
          preparationTime: 20,
          isVegetarian: false,
          isGlutenFree: true,
          spicyLevel: 0,
          allergens: ['Fish'],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Cooking Preference',
              required: true,
              multiSelect: false,
              options: [
                { name: 'Medium Rare', price: 0 },
                { name: 'Medium', price: 0 },
                { name: 'Well Done', price: 0 }
              ]
            },
            {
              name: 'Sides',
              required: true,
              multiSelect: false,
              options: [
                { name: 'Mashed Potatoes', price: 0 },
                { name: 'Rice Pilaf', price: 0 },
                { name: 'Quinoa', price: 1.50 },
                { name: 'Extra Vegetables', price: 2.00 }
              ]
            }
          ]
        },
        {
          name: 'Vegetable Stir Fry',
          description: 'Fresh seasonal vegetables stir-fried in a savory ginger soy sauce, served over rice',
          price: 14.99,
          calories: 420,
          preparationTime: 15,
          isVegetarian: true,
          isVegan: true,
          isGlutenFree: false,
          spicyLevel: 1,
          allergens: ['Soy', 'Wheat'],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Add Protein',
              required: false,
              multiSelect: false,
              options: [
                { name: 'Tofu', price: 2.50 },
                { name: 'Chicken', price: 3.50 },
                { name: 'Shrimp', price: 4.50 },
                { name: 'Beef', price: 4.00 }
              ]
            },
            {
              name: 'Spice Level',
              required: false,
              multiSelect: false,
              options: [
                { name: 'Mild', price: 0 },
                { name: 'Medium', price: 0 },
                { name: 'Hot', price: 0 },
                { name: 'Extra Hot', price: 0 }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Desserts',
      description: 'Sweet treats to end your meal',
      imageUrl: 'https://example.com/images/desserts.jpg',
      sortOrder: 3,
      availabilityTimes: {
        allDay: true
      },
      items: [
        {
          name: 'Chocolate Lava Cake',
          description: 'Warm chocolate cake with a molten center, served with vanilla ice cream',
          price: 8.99,
          calories: 550,
          preparationTime: 15,
          isVegetarian: true,
          spicyLevel: 0,
          allergens: ['Wheat', 'Dairy', 'Eggs'],
          isAvailable: true,
          isFeatured: true
        },
        {
          name: 'New York Cheesecake',
          description: 'Creamy cheesecake with graham cracker crust',
          price: 7.99,
          calories: 490,
          preparationTime: 5,
          isVegetarian: true,
          spicyLevel: 0,
          allergens: ['Wheat', 'Dairy', 'Eggs'],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Toppings',
              required: false,
              multiSelect: true,
              options: [
                { name: 'Strawberry Sauce', price: 1.00 },
                { name: 'Chocolate Sauce', price: 1.00 },
                { name: 'Caramel Sauce', price: 1.00 },
                { name: 'Fresh Berries', price: 2.00 }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Beverages',
      description: 'Refreshing drinks',
      imageUrl: 'https://example.com/images/beverages.jpg',
      sortOrder: 4,
      availabilityTimes: {
        allDay: true
      },
      items: [
        {
          name: 'Fresh Lemonade',
          description: 'Freshly squeezed lemonade with a hint of mint',
          price: 3.99,
          calories: 120,
          preparationTime: 5,
          isVegetarian: true,
          isVegan: true,
          isGlutenFree: true,
          spicyLevel: 0,
          allergens: [],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Sweetener',
              required: false,
              multiSelect: false,
              options: [
                { name: 'Regular', price: 0 },
                { name: 'Less Sweet', price: 0 },
                { name: 'No Sugar', price: 0 }
              ]
            }
          ]
        },
        {
          name: 'Craft Beer Selection',
          description: 'Rotating selection of local craft beers',
          price: 6.99,
          calories: 180,
          preparationTime: 3,
          isVegetarian: true,
          isVegan: true,
          isGlutenFree: false,
          spicyLevel: 0,
          allergens: ['Wheat'],
          isAvailable: true
        },
        {
          name: 'Organic Coffee',
          description: 'Fair trade organic coffee',
          price: 2.99,
          calories: 5,
          preparationTime: 3,
          isVegetarian: true,
          isVegan: true,
          isGlutenFree: true,
          spicyLevel: 0,
          allergens: [],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Add-ins',
              required: false,
              multiSelect: true,
              options: [
                { name: 'Cream', price: 0 },
                { name: 'Almond Milk', price: 0.50 },
                { name: 'Oat Milk', price: 0.50 },
                { name: 'Caramel Syrup', price: 0.75 },
                { name: 'Vanilla Syrup', price: 0.75 }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Brunch',
      description: 'Weekend brunch offerings',
      imageUrl: 'https://example.com/images/brunch.jpg',
      sortOrder: 5,
      availabilityTimes: {
        allDay: false,
        specificHours: {
          from: '09:00',
          to: '14:00'
        }
      },
      items: [
        {
          name: 'Avocado Toast',
          description: 'Sourdough toast topped with smashed avocado, poached eggs, and microgreens',
          price: 11.99,
          calories: 440,
          preparationTime: 12,
          isVegetarian: true,
          isGlutenFree: false,
          spicyLevel: 0,
          allergens: ['Wheat', 'Eggs'],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Add Protein',
              required: false,
              multiSelect: false,
              options: [
                { name: 'Smoked Salmon', price: 4.50 },
                { name: 'Bacon', price: 2.50 },
                { name: 'Turkey', price: 3.00 }
              ]
            },
            {
              name: 'Bread Options',
              required: false,
              multiSelect: false,
              options: [
                { name: 'Sourdough', price: 0 },
                { name: 'Multigrain', price: 0 },
                { name: 'Gluten-Free', price: 1.50 }
              ]
            }
          ]
        },
        {
          name: 'Belgian Waffles',
          description: 'Fluffy waffles served with maple syrup and fresh berries',
          price: 10.99,
          calories: 580,
          preparationTime: 15,
          isVegetarian: true,
          spicyLevel: 0,
          allergens: ['Wheat', 'Dairy', 'Eggs'],
          isAvailable: true,
          customizationGroups: [
            {
              name: 'Toppings',
              required: false,
              multiSelect: true,
              options: [
                { name: 'Whipped Cream', price: 1.00 },
                { name: 'Chocolate Chips', price: 1.50 },
                { name: 'Banana Slices', price: 1.00 },
                { name: 'Candied Pecans', price: 2.00 }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Function to seed database
const seedDatabase = async () => {
  try {
    // Clear existing menu for this restaurant
    await Menu.deleteMany({ restaurantId: RESTAURANT_ID });
    
    // Create new menu
    const newMenu = new Menu(sampleMenu);
    await newMenu.save();
    
    console.log('Database seeded successfully!');
    console.log(`Menu created with ID: ${newMenu._id}`);
    
    // Disconnect from database
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.disconnect();
  }
};

// Execute seed function
seedDatabase();