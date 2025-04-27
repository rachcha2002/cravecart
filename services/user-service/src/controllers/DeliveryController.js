const User = require('../models/User');

const findNearbyDrivers = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const nearbyDrivers = await User.find({
      role: 'delivery',
      status: 'active',
      'deliveryInfo.currentLocation': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: 1000 // 1km in meters
        }
      }
    }).select('_id').sort('distance');

    return res.status(200).json({
      success: true,
      count: nearbyDrivers.length,
      data: nearbyDrivers
    });
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while finding nearby drivers'
    });
  }
};

const updateDriverLocation = async (req, res) => {
  try {
    const userId = req.params.id; 
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        'deliveryInfo.currentLocation': {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Driver location updated successfully',
      data: {
        currentLocation: updatedUser.deliveryInfo.currentLocation
      }
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating driver location'
    });
  }
};

module.exports = {
  findNearbyDrivers,
  updateDriverLocation
};
