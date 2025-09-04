const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Helper function to log test results
function logTestResult(testName, passed, message = '') {
  const status = passed ? '✅ PASSED' : '❌ FAILED';
  console.log(`${status} - ${testName}${message ? `: ${message}` : ''}`);
  return passed;
}

// Test the /api/interests/me endpoint
async function testGetUserInterests(token) {
  try {
    console.log('\n🔍 Testing GET /api/interests/me');
    
    const response = await axios.get(`${BASE_URL}/interests/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        status: 'pending',
        type: 'house',
        search: 'test'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    const passed = response.status === 200 && response.data.success === true;
    logTestResult('GET /api/interests/me', passed, `Found ${response.data.count} interests`);
    
    return passed;
  } catch (error) {
    console.error('Test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    logTestResult('GET /api/interests/me', false, error.message);
    return false;
  }
}

// Login to get a token
async function login() {
  try {
    console.log('🔑 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.data.token) {
      console.log('✅ Successfully logged in');
      return response.data.token;
    }
    
    console.error('Login failed: No token in response');
    return null;
  } catch (error) {
    console.error('Login failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting tests for /api/interests/me endpoint\n');
  
  // First, log in to get a token
  const token = await login();
  if (!token) {
    console.error('❌ Cannot proceed with tests: Login failed');
    process.exit(1);
  }
  
  // Run the tests
  const results = [
    await testGetUserInterests(token)
  ];
  
  // Calculate and display test results
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed (${successRate.toFixed(0)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.error('❌ Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
});
