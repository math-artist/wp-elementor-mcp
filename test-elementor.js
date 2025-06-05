import axios from 'axios';

// Test configuration - using your local WordPress setup
const config = {
  baseUrl: 'http://elementortest.local',
  username: process.env.WORDPRESS_USERNAME || 'admin',  // Since MCP works, the creds are correct
  applicationPassword: process.env.WORDPRESS_APPLICATION_PASSWORD || 'dpvR Bj1g DtsN WBwN HUQz tMpO'  // Using placeholder - you'll need to update this
};

console.log('🔧 Configuration:');
console.log(`   Base URL: ${config.baseUrl}`);
console.log(`   Username: ${config.username}`);
console.log(`   App Password: ${config.applicationPassword.substring(0, 8)}...`);
console.log('');

// Setup axios instance
const axiosInstance = axios.create({
  baseURL: `${config.baseUrl}/wp-json/wp/v2/`,
  auth: {
    username: config.username,
    password: config.applicationPassword,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testElementorFunctions() {
  console.log('🧪 Testing Elementor MCP Server Functions Directly...\n');

  try {
    // Test 1: Get a post with edit context (like the MCP server does)
    console.log('1️⃣ Testing get post with edit context (post ID 9)...');
    try {
      const response = await axiosInstance.get('posts/9', {
        params: { context: 'edit' }
      });
      
      console.log('✅ Success! Post data retrieved');
      console.log(`📝 Title: ${response.data.title.rendered}`);
      console.log(`🔧 Has meta?: ${response.data.meta ? 'Yes' : 'No'}`);
      
      if (response.data.meta) {
        const elementorData = response.data.meta._elementor_data;
        console.log(`🎨 Has Elementor data?: ${elementorData ? 'Yes' : 'No'}`);
        
        if (elementorData) {
          console.log(`📊 Elementor data length: ${elementorData.length} characters`);
          console.log(`🔍 First 200 chars: ${elementorData.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    
    console.log('\n---\n');

    // Test 2: Get pages with edit context
    console.log('2️⃣ Testing get pages with edit context...');
    try {
      const response = await axiosInstance.get('pages', {
        params: { context: 'edit', per_page: 5 }
      });
      
      console.log('✅ Success! Pages retrieved');
      console.log(`📄 Number of pages: ${response.data.length}`);
      
      response.data.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.title.rendered} (ID: ${page.id})`);
        if (page.meta && page.meta._elementor_data) {
          console.log(`      🎨 Has Elementor data (${page.meta._elementor_data.length} chars)`);
        }
      });
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    
    console.log('\n---\n');

    // Test 3: Test updating Elementor data on our test page (ID 37)
    console.log('3️⃣ Testing update Elementor data (page ID 37)...');
    try {
      const elementorData = JSON.stringify([
        {
          "id": "section1",
          "elType": "section",
          "settings": {
            "layout": "boxed"
          },
          "elements": [
            {
              "id": "column1",
              "elType": "column",
              "settings": {
                "_column_size": 100
              },
              "elements": [
                {
                  "id": "heading1",
                  "elType": "widget",
                  "widgetType": "heading",
                  "settings": {
                    "title": "Direct API Test!",
                    "size": "h1",
                    "align": "center"
                  }
                },
                {
                  "id": "text1",
                  "elType": "widget",
                  "widgetType": "text-editor",
                  "settings": {
                    "editor": "<p>This Elementor content was created by directly testing the WordPress REST API!</p>"
                  }
                }
              ]
            }
          ]
        }
      ]);

      const updateData = {
        meta: {
          _elementor_data: elementorData,
          _elementor_edit_mode: 'builder',
        },
      };

      const response = await axiosInstance.post(`pages/37`, updateData);
      
      console.log('✅ Success! Elementor data updated');
      console.log(`📄 Updated page: ${response.data.title.rendered}`);
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      if (error.response?.data) {
        console.log(`📋 Response data:`, JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('\n---\n');

    // Test 4: Check if we can read back the Elementor data we just wrote
    console.log('4️⃣ Testing read back Elementor data (page ID 37)...');
    try {
      const response = await axiosInstance.get('pages/37', {
        params: { context: 'edit' }
      });
      
      console.log('✅ Success! Page data retrieved');
      if (response.data.meta && response.data.meta._elementor_data) {
        console.log(`🎨 Elementor data found! Length: ${response.data.meta._elementor_data.length} characters`);
        
        try {
          const parsed = JSON.parse(response.data.meta._elementor_data);
          console.log(`📊 Parsed Elementor data:`, JSON.stringify(parsed, null, 2));
        } catch (parseError) {
          console.log(`❌ Failed to parse Elementor data: ${parseError.message}`);
        }
      } else {
        console.log(`❌ No Elementor data found in meta`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n---\n');

    // Test 5: Check user permissions
    console.log('5️⃣ Testing user permissions...');
    try {
      const response = await axiosInstance.get('users/me');
      console.log('✅ Success! User info retrieved');
      console.log(`👤 User: ${response.data.name} (ID: ${response.data.id})`);
      console.log(`🔐 Capabilities:`, response.data.capabilities ? Object.keys(response.data.capabilities).slice(0, 10).join(', ') + '...' : 'Not available');
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

  } catch (globalError) {
    console.log(`💥 Global error: ${globalError.message}`);
  }
}

// Run the tests
testElementorFunctions().then(() => {
  console.log('\n🏁 Testing complete!');
}).catch(error => {
  console.error('💥 Test script failed:', error.message);
}); 