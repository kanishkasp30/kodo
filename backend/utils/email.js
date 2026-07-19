const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config();

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendOTPEmail = async (toEmail, otp, name) => {
  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.subject = 'Verify your Kōdo account';
  email.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #E8572A;">Welcome to Kōdo, ${name}!</h2>
      <p>Use the code below to verify your email address:</p>
      <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1C1917;">${otp}</span>
      </div>
      <p style="color: #666; font-size: 13px;">This code expires in 10 minutes.</p>
    </div>
  `;
  email.sender = { name: 'Kodo', email: 'kanishkasp30@gmail.com' };
  email.to = [{ email: toEmail }];

  await apiInstance.sendTransacEmail(email);
};

module.exports = { sendOTPEmail };