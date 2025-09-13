// Configuration file for WhatsApp Bot
module.exports = {
  // Google Sheets API URL
  SHEETS_URL: 'https://script.google.com/macros/s/AKfycbyCPhCjeVZ7nyuCwg34pHtK4Sk9w6GJuyHiR5sJpEJbzR8xbi3LXtQ1p9WhtcypDQrw8A/exec',
  
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
