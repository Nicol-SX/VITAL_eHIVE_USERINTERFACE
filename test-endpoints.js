const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const ENDPOINTS = {
  batch: '/batch',
  processes: '/processes'
};

// Test parameters
const testParams = {
  page: '0',
  limit: '50',
  dateRange: 'Last 30 days',
  sortColumn: 'hrpsDateTime',
  sortDirection: 'desc'
};

async function testEndpoint(endpoint) {
  try {
    // Construct URL with query parameters
    const queryParams = new URLSearchParams(testParams);
    const url = `${BASE_URL}${endpoint}?${queryParams}`;
    
    console.log(`\nTesting ${endpoint} endpoint...`);
    console.log('URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('Error:', data.error);
      console.error('Details:', data.details);
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('Starting endpoint tests...');
  
  // Test batch endpoint
  const batchResult = await testEndpoint(ENDPOINTS.batch);
  
  // Test processes endpoint
  const processesResult = await testEndpoint(ENDPOINTS.processes);
  
  // Print summary
  console.log('\nTest Summary:');
  console.log('-------------');
  console.log('Batch Endpoint:', batchResult.success ? '✅ Working' : '❌ Failed');
  console.log('Processes Endpoint:', processesResult.success ? '✅ Working' : '❌ Failed');
}

runTests(); 