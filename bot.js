const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');

class WhatsAppBot {
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
        
        this.isReady = false;
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // QR Code generation
        this.client.on('qr', (qr) => {
            console.log('🔗 QR Code received, scan it with your WhatsApp mobile app:');
            qrcode.generate(qr, { small: true });
            console.log('\n📱 Scan the QR code above with your WhatsApp mobile app to authenticate.');
        });

        // Client ready
        this.client.on('ready', () => {
            console.log('✅ WhatsApp client is ready!');
            this.isReady = true;
            this.setupScheduler();
        });

        // Authentication success
        this.client.on('authenticated', () => {
            console.log('🔐 Authentication successful!');
        });

        // Authentication failure
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Authentication failed:', msg);
        });

        // Client disconnected
        this.client.on('disconnected', (reason) => {
            console.log('🔌 Client was logged out:', reason);
            this.isReady = false;
        });

        // Error handling
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
        // Remove any non-digit characters
        let cleanNumber = number.toString().replace(/\D/g, '');
        
        // Add country code if not present (assuming India +91)
        if (cleanNumber.length === 10) {
            cleanNumber = '91' + cleanNumber;
        }
        
        // Format for WhatsApp (country code + number + @c.us)
        return cleanNumber + '@c.us';
    }

    createPersonalizedMessage(name) {
        return config.MESSAGE_TEMPLATE.replace('{name}', name);
    }

    async sendMessageToContact(contact) {
        try {
            const phoneNumber = this.formatPhoneNumber(contact.number);
            const message = this.createPersonalizedMessage(contact.name);
            
            console.log(`📤 Sending message to ${contact.name} (${contact.number})`);
            
            const chatId = phoneNumber;
            await this.client.sendMessage(chatId, message);
            
            console.log(`✅ Message sent successfully to ${contact.name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to send message to ${contact.name}:`, error.message);
            return false;
        }
    }

    async sendScheduledMessages() {
        if (!this.isReady) {
            console.log('⚠️ WhatsApp client is not ready. Skipping scheduled messages.');
            return;
        }

        console.log('🕙 Starting scheduled message sending...');
        
        const contacts = await this.fetchContactsFromSheets();
        
        if (contacts.length === 0) {
            console.log('⚠️ No contacts found in Google Sheets.');
            return;
        }

        let successCount = 0;
        let failureCount = 0;

        for (const contact of contacts) {
            const success = await this.sendMessageToContact(contact);
            if (success) {
                successCount++;
            } else {
                failureCount++;
            }
            
            // Add a small delay between messages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`📊 Message sending completed: ${successCount} successful, ${failureCount} failed`);
    }

    setupScheduler() {
        // Schedule messages daily at 10:00 AM
        const cronExpression = '0 10 * * *'; // Every day at 10:00 AM
        
        console.log(`⏰ Setting up daily scheduler for ${config.SCHEDULE_TIME}`);
        
        cron.schedule(cronExpression, () => {
            console.log('⏰ Scheduled time reached! Starting message sending...');
            this.sendScheduledMessages();
        }, {
            timezone: config.TIMEZONE
        });

        console.log('✅ Scheduler setup complete. Messages will be sent daily at 10:00 AM');
    }

    async start() {
        console.log('🚀 Starting WhatsApp Bot...');
        console.log('📋 Configuration:');
        console.log(`   - Sheets URL: ${config.SHEETS_URL}`);
        console.log(`   - Schedule Time: ${config.SCHEDULE_TIME}`);
        console.log(`   - Timezone: ${config.TIMEZONE}`);
        console.log(`   - Message Template: ${config.MESSAGE_TEMPLATE}`);
        console.log('');

        try {
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Failed to initialize WhatsApp client:', error);
            process.exit(1);
        }
    }

    async stop() {
        console.log('🛑 Stopping WhatsApp Bot...');
        if (this.client) {
            await this.client.destroy();
        }
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
    if (global.bot) {
        await global.bot.stop();
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
    if (global.bot) {
        await global.bot.stop();
    }
});

// Start the bot
const bot = new WhatsAppBot();
global.bot = bot;
bot.start().catch(console.error);
