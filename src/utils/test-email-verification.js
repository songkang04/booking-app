/**
 * Test script to verify the email verification flow works correctly
 * This script will:
 * 1. Generate a test verification token (simulating what would happen after registration)
 * 2. Call the verify-email endpoint with this token
 * 3. Check the response format to ensure it matches what the frontend expects
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Create a dummy token for testing (in a real scenario this would come from the database)
// In production, you'd get a real token from your database for a test user
const dummyToken = 'test_verification_token_' + Math.random().toString(36).substring(2, 15);

console.log('=== Email Verification Flow Test ===');
console.log('API URL:', API_URL);
console.log('Test token:', dummyToken);
console.log('\nCalling verify-email endpoint...');

// Call the verification endpoint
axios.post(`${API_URL}/auth/verify-email`, { token: dummyToken })
  .then(response => {
    console.log('\n✅ Response received:');

    // Log the full response structure
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', response.headers);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    // Check if response has the expected structure
    console.log('\n=== Response Structure Analysis ===');

    if (response.data && typeof response.data === 'object') {
      console.log('✅ Response is an object');

      if ('success' in response.data) {
        console.log(`✅ Response has 'success' property: ${response.data.success}`);
      } else {
        console.log('❌ Response does not have a direct success property');
      }

      if ('message' in response.data) {
        console.log(`✅ Response has 'message' property: "${response.data.message}"`);
      } else {
        console.log('❌ Response does not have a message property');
      }
    }

    // Simulate frontend handling to see if it would work
    console.log('\n=== Frontend Response Handling Simulation ===');
    try {
      // This is what the frontend does
      if (response.data.success) {
        console.log('✅ Frontend would handle this as a successful verification');
      } else {
        console.log('❌ Frontend would handle this as a failed verification');
      }
    } catch (error) {
      console.log('❌ Error in frontend handling:', error.message);
    }

    console.log('\nTest completed!');
  })
  .catch(error => {
    console.log('\n❌ Error calling verify-email endpoint:');

    if (error.response) {
      // The request was made and the server responded with a status code outside the 2xx range
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);

      // Check if error response has expected structure
      console.log('\n=== Error Response Structure ===');
      if (error.response.data && typeof error.response.data === 'object') {
        if ('success' in error.response.data) {
          console.log(`✅ Error response has 'success' property: ${error.response.data.success}`);
        }

        if ('message' in error.response.data) {
          console.log(`✅ Error response has 'message' property: "${error.response.data.message}"`);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received. Possible network issue.');
    } else {
      // Something happened in setting up the request
      console.log('Error setting up request:', error.message);
    }

    console.log('\nTest completed with errors!');
  });
