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

// Email template styles
const emailStyles = `
  <style>
    .email-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .email-header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .email-body {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .rank-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 16px;
      margin: 10px 0;
    }
    .info-box {
      background-color: #f0f9ff;
      border-left: 4px solid #06b6d4;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .details-table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
    }
    .details-table td {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .details-table td:first-child {
      color: #6b7280;
      width: 40%;
    }
    .details-table td:last-child {
      font-weight: 600;
      color: #111827;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
`;

interface RankPurchaseEmailData {
  username: string;
  rankName: string;
  rankBadge?: string;
  rankColor?: string;
  amount: number;
  days: number;
  expiresAt: string;
  isSubscription?: boolean;
  subscriptionInterval?: string;
  nextBillingDate?: string;
}

// Email template for one-time rank purchase
export async function sendRankPurchaseEmail(
  to: string,
  data: RankPurchaseEmailData
): Promise<boolean> {
  const { username, rankName, rankBadge, rankColor, amount, days, expiresAt, isSubscription } = data;

  const subject = isSubscription 
    ? `🎉 ${rankName} Subscription Activated!`
    : `🎉 ${rankName} Rank Activated!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="email-header">
          <h1>✨ Thank You for Your ${isSubscription ? 'Subscription' : 'Purchase'}!</h1>
        </div>
        
        <div class="email-body">
          <p style="font-size: 16px; color: #374151;">Hi <strong>${username}</strong>,</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Your ${isSubscription ? 'subscription has been activated' : 'donation rank has been activated'} successfully! 
            Thank you for supporting Vonix Network. ${isSubscription ? 'Your subscription will renew automatically.' : ''}
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div class="rank-badge" style="background-color: ${rankColor || '#06b6d4'}; color: #ffffff;">
              ${rankBadge || rankName}
            </div>
          </div>

          <table class="details-table">
            <tr>
              <td>Rank</td>
              <td>${rankName}</td>
            </tr>
            <tr>
              <td>Amount Paid</td>
              <td>$${amount.toFixed(2)} USD</td>
            </tr>
            <tr>
              <td>Duration</td>
              <td>${days} days</td>
            </tr>
            <tr>
              <td>${isSubscription ? 'Next Billing Date' : 'Expires On'}</td>
              <td>${new Date(expiresAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</td>
            </tr>
            ${isSubscription ? `
            <tr>
              <td>Billing Cycle</td>
              <td>${data.subscriptionInterval || 'Monthly'}</td>
            </tr>
            ` : ''}
          </table>

          ${isSubscription ? `
          <div class="info-box">
            <strong>📋 Subscription Details:</strong>
            <p style="margin: 8px 0 0 0; color: #374151;">
              Your subscription will automatically renew on ${new Date(expiresAt).toLocaleDateString()}. 
              You can cancel anytime from your Settings → Subscriptions page.
            </p>
          </div>
          ` : `
          <div class="info-box">
            <strong>⏰ Rank Duration:</strong>
            <p style="margin: 8px 0 0 0; color: #374151;">
              Your ${rankName} rank will remain active until ${new Date(expiresAt).toLocaleDateString()}. 
              You can extend or upgrade your rank anytime from the donation page.
            </p>
          </div>
          `}

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
              View Your Dashboard
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Your support helps us maintain and improve Vonix Network. Thank you for being an awesome member of our community!
          </p>
        </div>

        <div class="email-footer">
          <p><strong>Vonix Network</strong></p>
          <p>Questions? Contact us on Discord or visit our support page.</p>
          ${isSubscription ? `
          <p style="font-size: 12px; margin-top: 20px;">
            To manage your subscription, visit: 
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/subscriptions" 
               style="color: #06b6d4;">Settings → Subscriptions</a>
          </p>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${username},

Your ${isSubscription ? 'subscription has been activated' : 'donation rank has been activated'} successfully!

Rank: ${rankName}
Amount Paid: $${amount.toFixed(2)} USD
Duration: ${days} days
${isSubscription ? 'Next Billing Date' : 'Expires On'}: ${new Date(expiresAt).toLocaleDateString()}

${isSubscription 
  ? `Your subscription will automatically renew. You can cancel anytime from Settings → Subscriptions.`
  : `Your ${rankName} rank will remain active until ${new Date(expiresAt).toLocaleDateString()}.`
}

Thank you for supporting Vonix Network!

View your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard
  `.trim();

  return sendEmail({ to, subject, html, text });
}

// Email template for subscription renewal
export async function sendSubscriptionRenewalEmail(
  to: string,
  data: {
    username: string;
    rankName: string;
    amount: number;
    nextBillingDate: string;
  }
): Promise<boolean> {
  const { username, rankName, amount, nextBillingDate } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${emailStyles}
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div class="email-container">
        <div class="email-header">
          <h1>✅ Subscription Renewed</h1>
        </div>
        
        <div class="email-body">
          <p>Hi <strong>${username}</strong>,</p>
          
          <p>Your <strong>${rankName}</strong> subscription has been successfully renewed!</p>

          <table class="details-table">
            <tr>
              <td>Amount Charged</td>
              <td>$${amount.toFixed(2)} USD</td>
            </tr>
            <tr>
              <td>Next Billing Date</td>
              <td>${new Date(nextBillingDate).toLocaleDateString()}</td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Your rank benefits will continue without interruption.
          </p>
        </div>

        <div class="email-footer">
          <p>Manage subscriptions: 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/subscriptions" style="color: #06b6d4;">
              Settings → Subscriptions
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `✅ ${rankName} Subscription Renewed`,
    html,
  });
}

// Test email configuration
export async function testEmailConfig(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Test Email from Vonix Network',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${emailStyles}
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        <div class="email-container">
          <div class="email-header">
            <h1>📧 Email Test</h1>
          </div>
          <div class="email-body">
            <p>This is a test email to verify your SMTP configuration.</p>
            <p>If you received this email, your email settings are working correctly!</p>
          </div>
          <div class="email-footer">
            <p>Sent from Vonix Network Admin Dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: 'This is a test email to verify your SMTP configuration. If you received this email, your email settings are working correctly!',
  });
}
