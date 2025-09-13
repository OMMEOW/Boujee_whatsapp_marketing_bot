const axios = require('axios');
const config = require('./config');

async function testSheetsConnection() {
    console.log('🧪 Testing Google Sheets connection...');
    console.log(`📊 Sheets URL: ${config.SHEETS_URL}`);
    console.log('');

    try {
        const response = await axios.get(config.SHEETS_URL);
        
        console.log('✅ Connection successful!');
        console.log(`📈 Response status: ${response.status}`);
        console.log(`📊 Data received:`, JSON.stringify(response.data, null, 2));
        
        if (response.data.success && response.data.data) {
            console.log(`\n👥 Found ${response.data.count} contacts:`);
            response.data.data.forEach((contact, index) => {
                console.log(`   ${index + 1}. ${contact['Business Name']} - ${contact['Phone Number']}`);
            });
            
            // Test message template
            console.log('\n📝 Testing message template:');
            const testContact = response.data.data[0];
            const testMessage = config.MESSAGE_TEMPLATE.replace('{name}', testContact['Business Name']);
            console.log(`   Template: ${config.MESSAGE_TEMPLATE}`);
            console.log(`   Sample: ${testMessage}`);
        } else {
            console.log('⚠️ Invalid data format received');
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data: ${JSON.stringify(error.response.data)}`);
        }
    }
}

// Run the test
testSheetsConnection();
