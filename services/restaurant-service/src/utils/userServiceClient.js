const axios = require('axios');

const userServiceBaseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';

const getUserById = async (id) => {
  try {
    // Get auth token from environment variable 
    const authToken = process.env.USER_SERVICE_API_KEY || 'your_api_key_here';
    
    const response = await axios.get(`${userServiceBaseUrl}/api/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
        
      }
    });
    
    console.log('User fetched successfully:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Error fetching user:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    throw new Error(`Failed to fetch user from user-service: ${error.message}`);
  }
};

module.exports = { getUserById };