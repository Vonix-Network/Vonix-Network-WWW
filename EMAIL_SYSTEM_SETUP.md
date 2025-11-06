# 📧 Email System - Complete Setup Guide

## Overview

Professional email system with different templates for **one-time purchases** vs **subscription renewals**.

---

## ✅ What's Implemented

### 1. **Email Templates** (`src/lib/email.ts`)

Three beautiful, professional email templates:

#### **A) Rank Purchase Email** (One-Time)
- ✅ Gradient header with cyan/blue colors
- ✅ Personalized greeting with username
- ✅ Rank badge display with custom colors
- ✅ Purchase details table (rank, amount, duration, expiration)
- ✅ Info box explaining rank duration
- ✅ "View Dashboard" CTA button
- ✅ Plain text fallback for email clients

**Subject:** `🎉 {RankName} Rank Activated!`

#### **B) Subscription Activation Email** (Recurring)
- ✅ Same beautiful design as one-time
- ✅ **Different content** emphasizing auto-renewal
- ✅ Subscription details (billing cycle, next billing date)
- ✅ Info box with cancellation instructions
- ✅ Link to subscription management page
- ✅ Next billing date prominently displayed

**Subject:** `🎉 {RankName} Subscription Activated!`

#### **C) Subscription Renewal Email** (Auto-Renewal)
- ✅ Simpler design for renewals
- ✅ Amount charged and next billing date
- ✅ Link to manage subscriptions
- ✅ "Your rank benefits continue" message

**Subject:** `✅ {RankName} Subscription Renewed`

---

## 📨 When Emails Are Sent

### **One-Time Purchase**
**Trigger:** User completes payment for a rank (without auto-renew)  
**Endpoint:** `/api/subscriptions/purchase`  
**Email Type:** Rank Purchase Email  
**Content:**
- Shows expiration date
- Explains rank duration
- "Extend or upgrade anytime" message

### **Subscription First Payment**
**Trigger:** User completes first payment with auto-renew enabled  
**Endpoint:** `/api/stripe/webhook` (invoice.payment_succeeded with billing_reason=subscription_create)  
**Email Type:** Subscription Activation Email  
**Content:**
- Shows next billing date
- Explains auto-renewal
- Links to subscription management

### **Subscription Renewal**
**Trigger:** Stripe automatically charges for renewal  
**Endpoint:** `/api/stripe/webhook` (invoice.payment_succeeded)  
**Email Type:** Subscription Renewal Email  
**Content:**
- Confirms payment
- Shows next billing date
- Simple notification

---

## 🎨 Email Design Features

### **Professional Styling**
```css
✅ Gradient header (cyan to blue)
✅ Clean white card layout
✅ Responsive design (mobile-friendly)
✅ Custom rank badge with colors
✅ Info boxes with left border accent
✅ CTA buttons with gradient
✅ Clean footer with links
```

### **Brand Colors**
- Primary: Cyan (#06b6d4)
- Secondary: Blue (#3b82f6)
- Background: White/Gray gradient
- Text: Dark gray (#374151)

### **Rank Badge**
- Displays custom rank color
- Shows rank badge or name
- Centered with gradient background

---

## 📋 Email Data Structure

### **RankPurchaseEmailData**
```typescript
{
  username: string;              // "JohnDoe"
  rankName: string;              // "VIP+"
  rankBadge?: string;            // "👑 VIP+"
  rankColor?: string;            // "#06b6d4"
  amount: number;                // 28.50
  days: number;                  // 90
  expiresAt: string;             // ISO date
  isSubscription?: boolean;      // true/false
  subscriptionInterval?: string; // "Every 3 Months"
  nextBillingDate?: string;      // ISO date (for subscriptions)
}
```

---

## 🔧 Configuration

### **Required Environment Variables**

Already configured in Admin → Settings → Email:

```env
# SMTP Settings (from admin dashboard)
email.smtpHost = smtp.gmail.com
email.smtpPort = 587
email.smtpUser = your-email@gmail.com
email.smtpPass = your-app-password
email.fromEmail = noreply@vonixnetwork.com
email.useTLS = true

# App URL (for email links)
NEXT_PUBLIC_APP_URL = http://localhost:3000  # or your production URL
```

---

## 🚀 How It Works

### **Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                      User Makes Purchase                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
            ┌──────────▼──────────┐
            │   One-Time Purchase  │     │   Subscription
            └──────────┬───────────┘     └───────┬────────────
                       │                          │
            ┌──────────▼───────────┐   ┌────────▼──────────┐
            │ /api/subscriptions/  │   │ Manual payment    │
            │      purchase        │   │ creates intent    │
            └──────────┬───────────┘   └─────────┬─────────┘
                       │                          │
            ┌──────────▼──────────────┐  ┌───────▼──────────┐
            │  Rank Assigned          │  │ Subscription     │
            │  Email Sent ✉️          │  │ Created          │
            │  (Expiration Date)      │  └────────┬─────────┘
            └─────────────────────────┘           │
                                        ┌─────────▼─────────┐
                                        │ Stripe Webhook    │
                                        │ First Payment     │
                                        └─────────┬─────────┘
                                        ┌─────────▼─────────┐
                                        │ Rank Assigned     │
                                        │ Email Sent ✉️     │
                                        │ (Next Billing)    │
                                        └───────────────────┘
                                                 │
                                        ┌────────▼─────────┐
                                        │ Future Renewals   │
                                        │ (Webhook)         │
                                        └────────┬──────────┘
                                        ┌────────▼──────────┐
                                        │ Renewal Email ✉️  │
                                        └───────────────────┘
```

---

## 📝 Code Locations

### **Email Templates**
```
src/lib/email.ts
- sendRankPurchaseEmail()         ← One-time & subscription activation
- sendSubscriptionRenewalEmail()  ← Renewal notifications
- testEmailConfig()               ← Test SMTP settings
```

### **Integration Points**
```
src/app/api/subscriptions/purchase/route.ts
- Lines 142-188: Email sending after purchase

src/app/api/stripe/webhook/route.ts
- Lines 118-150: Email sending for subscription payments
```

---

## 🧪 Testing

### **Test One-Time Purchase Email**
1. Go to `/donations/subscribe`
2. Select a rank and duration
3. **Don't enable** auto-renew
4. Complete payment
5. Check your email for "🎉 {Rank} Rank Activated!"

### **Test Subscription Activation Email**
1. Go to `/donations/subscribe`
2. Select a rank and duration
3. **Enable** "Auto-renew subscription"
4. Complete payment
5. Check your email for "🎉 {Rank} Subscription Activated!"

### **Test Subscription Renewal Email**
- Wait for Stripe to process a renewal (or trigger manually via Stripe dashboard)
- Check your email for "✅ {Rank} Subscription Renewed"

### **Test SMTP Configuration**
- Go to **Admin → Settings → Email**
- Click "Test Email" button
- Check your inbox

---

## 📊 Email Content Comparison

| Feature | One-Time | Subscription Activation | Renewal |
|---------|----------|------------------------|---------|
| **Header** | ✨ Thank You for Your Purchase | ✨ Thank You for Your Subscription | ✅ Subscription Renewed |
| **Rank Badge** | ✅ Yes | ✅ Yes | ❌ No |
| **Amount** | ✅ One-time | ✅ Initial payment | ✅ Renewal amount |
| **Date Label** | "Expires On" | "Next Billing Date" | "Next Billing Date" |
| **Info Box** | Rank Duration | Subscription Details | Continuation Notice |
| **CTA Button** | View Dashboard | View Dashboard | ❌ No |
| **Subscription Link** | ❌ No | ✅ Yes (footer) | ✅ Yes (footer) |
| **Cancellation Info** | ❌ No | ✅ Yes | ❌ No |

---

## 🎯 Key Differences

### **One-Time Purchase Email**
```
"Your VIP+ rank will remain active until December 5, 2025.
You can extend or upgrade your rank anytime from the donation page."

[View Your Dashboard] ← CTA Button
```

### **Subscription Email**
```
"Your subscription will automatically renew on December 5, 2025.
You can cancel anytime from your Settings → Subscriptions page."

Billing Cycle: Every 3 Months

[View Your Dashboard] ← CTA Button

To manage your subscription, visit: Settings → Subscriptions
```

### **Renewal Email**
```
"Your VIP+ subscription has been successfully renewed!

Amount Charged: $28.50 USD
Next Billing Date: March 5, 2026

Your rank benefits will continue without interruption."
```

---

## 🔒 Security & Best Practices

✅ **Email sending never blocks the purchase**
- Wrapped in try-catch
- Errors logged but don't fail transaction
- User still gets their rank even if email fails

✅ **Personal data protection**
- Only sends to user's registered email
- No sensitive data in email body
- Links require authentication

✅ **Template safety**
- HTML sanitization built-in
- Plain text fallback included
- XSS protection

✅ **SMTP Security**
- TLS encryption
- App passwords (not real passwords)
- Credential storage in database

---

## 📈 Next Steps (Optional Enhancements)

### **Future Email Types**
- [ ] Subscription cancellation confirmation
- [ ] Payment failed notification
- [ ] Rank expiring soon warning (7 days before)
- [ ] Upgrade offer emails
- [ ] Welcome series for new subscribers

### **Advanced Features**
- [ ] Email preferences (opt-in/opt-out)
- [ ] Email open tracking
- [ ] Click tracking on CTAs
- [ ] A/B testing different templates
- [ ] Multilingual support

---

## ✅ Status: Production Ready

All email functionality is **fully implemented and tested**:
- ✅ Professional HTML templates
- ✅ Proper SMTP integration
- ✅ One-time purchase emails
- ✅ Subscription activation emails
- ✅ Renewal notification emails
- ✅ Error handling and logging
- ✅ Mobile responsive design
- ✅ Plain text fallbacks
- ✅ Type-safe implementation

**The email system is ready for production use!** 🎉
