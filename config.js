// Configuration file for WhatsApp Bot
module.exports = {
  // Google Sheets API URL
  SHEETS_URL: 'https://script.google.com/macros/s/AKfycbxTstRIZ8n5ItcVCq43r4UJhdNwuy0_cu3s-uvR9jWVVFa1N7FV218Ulp-5BWUVkrlD/exec',
  
  // Message template with {name} placeholder
  MESSAGE_TEMPLATE: 'Hello! {name} 👋 Thanks for reaching out. Please let me know your query and I\'ll get back to you shortly.',
  
  // Schedule time (24-hour format)
  SCHEDULE_TIME: '10:00',
  
  // Timezone
  TIMEZONE: 'Asia/Kolkata',
  
  // WhatsApp session data directory
  SESSION_DIR: './session-data',
  
  // Logging
  LOG_LEVEL: 'info'
};
