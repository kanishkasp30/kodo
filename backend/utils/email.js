const axios = require('axios');
require('dotenv').config();

const sendOTPEmail = async (toEmail, otp, name) => {
  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: { name: 'Kodo', email: process.env.EMAIL_USER },
      to: [{ email: toEmail }],
      subject: 'Verify your Kōdo account',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #E8572A;">Welcome to Kōdo, ${name}!</h2>
          <p>Use the code below to verify your email address:</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1C1917;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 13px;">This code expires in 10 minutes.</p>
        </div>
      `,
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );
};

module.exports = { sendOTPEmail };