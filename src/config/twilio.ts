import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Проверяем, что Twilio правильно настроен (accountSid должен начинаться с "AC")
const isTwilioConfigured = accountSid && authToken && phoneNumber && accountSid.startsWith('AC');

if (!isTwilioConfigured) {
  console.warn('⚠️ Twilio credentials not configured or invalid. SMS functionality will be disabled.');
  console.warn('   Set TWILIO_ACCOUNT_SID (must start with AC), TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
}

const client = isTwilioConfigured ? twilio(accountSid!, authToken!) : null;

export const sendSMS = async (to: string, message: string): Promise<boolean> => {
  if (!client || !phoneNumber) {
    console.log(`📱 SMS Mock: Would send to ${to}: ${message}`);
    return true; // Mock mode for development
  }

  try {
    await client.messages.create({
      body: message,
      from: phoneNumber,
      to: to,
    });
    console.log(`✅ SMS sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    return false;
  }
};

export const generateSMSCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};







