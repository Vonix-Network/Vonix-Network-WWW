import nodemailer from 'nodemailer';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function getEmailSettings() {
  try {
    const emailSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'email.smtpHost'))
      .limit(1);

    if (emailSettings.length === 0) {
      // Fallback to environment variables
      return {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'noreply@vonixnetwork.com',
        useTLS: process.env.SMTP_TLS !== 'false',
      };
    }

    // Load all email settings from database
    const allSettings = await db.select().from(settings);
    const config: Record<string, string> = {};
    allSettings.forEach(s => {
      if (s.key.startsWith('email.')) {
        config[s.key.replace('email.', '')] = s.value;
      }
    });

    return {
      host: config.smtpHost || 'smtp.gmail.com',
      port: parseInt(config.smtpPort || '587'),
      user: config.smtpUser || '',
      pass: config.smtpPass || '',
      from: config.fromEmail || 'noreply@vonixnetwork.com',
      useTLS: config.useTLS !== 'false',
    };
  } catch (error) {
    console.error('Error loading email settings:', error);
    // Fallback to environment variables
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'noreply@vonixnetwork.com',
      useTLS: process.env.SMTP_TLS !== 'false',
    };
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = await getEmailSettings();

    // Check if SMTP is configured
    if (!config.user || !config.pass) {
      console.error('❌ Email not sent: SMTP not configured');
      console.log('💡 Configure email settings in Admin → Settings → Email');
      return false;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: config.useTLS ? {
        rejectUnauthorized: false
      } : undefined,
    });

    // Send email
    const info = await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// Test email configuration
export async function testEmailConfig(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Test Email from Vonix Network',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #06b6d4;">Email Configuration Test</h2>
        <p>This is a test email to verify your SMTP configuration.</p>
        <p>If you received this email, your email settings are working correctly!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Sent from Vonix Network Admin Dashboard
        </p>
      </div>
    `,
    text: 'This is a test email to verify your SMTP configuration. If you received this email, your email settings are working correctly!',
  });
}
