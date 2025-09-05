const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const config = require('./config');

class TestMessageSender {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "whatsapp-bot-scheduler"
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });
        
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            console.log('🔗 QR Code received, scan it with your WhatsApp mobile app:');
            qrcode.generate(qr, { small: true });
            console.log('\n📱 Scan the QR code above with your WhatsApp mobile app to authenticate.');
        });

        this.client.on('ready', async () => {
            console.log('✅ WhatsApp client is ready!');
            await this.sendTestMessages();
        });

        this.client.on('authenticated', () => {
            console.log('🔐 Authentication successful!');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ Authentication failed:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('🔌 Client was logged out:', reason);
        });

        this.client.on('error', (error) => {
            console.error('❌ WhatsApp client error:', error);
        });
    }

    async fetchContactsFromSheets() {
        try {
            console.log('📊 Fetching contacts from Google Sheets...');
            const response = await axios.get(config.SHEETS_URL);
            
            if (response.data.success && response.data.data) {
                console.log(`✅ Successfully fetched ${response.data.count} contacts`);
                return response.data.data;
            } else {
                throw new Error('Invalid response format from Google Sheets');
            }
        } catch (error) {
            console.error('❌ Error fetching contacts from Google Sheets:', error.message);
            return [];
        }
    }

    formatPhoneNumber(number) {
        let cleanNumber = number.toString().replace(/\D/g, '');
        
        if (cleanNumber.length === 10) {
            cleanNumber = '91' + cleanNumber;
        }
        
        return cleanNumber + '@c.us';
    }

    createPersonalizedMessage(name) {
        return config.MESSAGE_TEMPLATE.replace('{name}', name);
    }

    async sendTestMessages() {
        console.log('🧪 Starting test message sending...');
        
        const contacts = await this.fetchContactsFromSheets();
        
        if (contacts.length === 0) {
            console.log('⚠️ No contacts found in Google Sheets.');
            await this.client.destroy();
            return;
        }

        console.log(`\n📤 Sending test messages to ${contacts.length} contacts...`);
        console.log('⚠️ This will send actual WhatsApp messages!');
        console.log('Press Ctrl+C to cancel within 5 seconds...\n');

        // Wait 5 seconds for user to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));

        let successCount = 0;
        let failureCount = 0;

        for (const contact of contacts) {
            try {
                const phoneNumber = this.formatPhoneNumber(contact.number);
                const message = this.createPersonalizedMessage(contact.name);
                
                console.log(`📤 Sending message to ${contact.name} (${contact.number})`);
                
                const chatId = phoneNumber;
                await this.client.sendMessage(chatId, message);
                
                console.log(`✅ Message sent successfully to ${contact.name}`);
                successCount++;
                
                // Add delay between messages
                await new Promise(resolve => setTimeout(resolve, 3000));
                
            } catch (error) {
                console.error(`❌ Failed to send message to ${contact.name}:`, error.message);
                failureCount++;
            }
        }

        console.log(`\n📊 Test completed: ${successCount} successful, ${failureCount} failed`);
        await this.client.destroy();
        process.exit(0);
    }

    async start() {
        console.log('🧪 Starting WhatsApp Test Message Sender...');
        console.log('⚠️ This will send actual messages to all contacts in your Google Sheet!');
        console.log('');

        try {
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Failed to initialize WhatsApp client:', error);
            process.exit(1);
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Test cancelled by user');
    process.exit(0);
});

// Start the test sender
const testSender = new TestMessageSender();
testSender.start().catch(console.error);
