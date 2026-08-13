import dotenv from 'dotenv';
dotenv.config();

export const emailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER || '',
  password: process.env.EMAIL_PASSWORD || '',
  from: process.env.EMAIL_FROM || 'no-reply@ayoolasignature.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Ayoola Signature',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@ayoolasignature.com',
};

export default emailConfig;
