# Square Payments Integration

## Overview

This document describes the complete Square Payments integration for Vonix Network. The integration is **optional** and can be enabled/disabled via environment variables without affecting the rest of the application.

## Features

- ✅ **Optional Integration** - Enable/disable via environment variable
- ✅ **One-Time Payments** - Process single donations
- ✅ **Recurring Subscriptions** - Monthly recurring donations
- ✅ **Subscription Management** - View, update, pause, resume, and cancel subscriptions
- ✅ **Customer Management** - Automatic customer creation and lookup
- ✅ **Graceful Degradation** - All functions work when Square is disabled
- ✅ **Frontend Protection** - UI only renders when Square is enabled

---

## Installation

### 1. Install Square SDK

```bash
npm install square
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

#### **Disabled State (Default)**
```env
SQUARE_INTEGRATION_ENABLED=false
```

#### **Enabled State**
```env
# Enable Square Payments
SQUARE_INTEGRATION_ENABLED=true

# Square API Credentials
# Get these from: https://developer.squareup.com/apps
SQUARE_ACCESS_TOKEN=your_access_token_here
SQUARE_LOCATION_ID=your_location_id_here
SQUARE_APPLICATION_ID=your_application_id_here

# Environment: 'sandbox' for testing, 'production' for live
SQUARE_ENVIRONMENT=sandbox
```

### 3. Get Square Credentials

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create or select your application
3. Copy the following:
   - **Access Token**: Found in "Credentials" tab
   - **Application ID**: Found in "Credentials" tab
   - **Location ID**: Found in "Locations" tab

---

## Architecture

### File Structure

```
src/
├── lib/square/
│   ├── config.ts          # Configuration and isSquareEnabled()
│   ├── client.ts          # Square SDK client wrapper
│   ├── payments.ts        # One-time payment processing
│   └── subscriptions.ts   # Subscription management
│
├── app/api/square/
│   ├── status/route.ts    # GET /api/square/status
│   ├── payment/route.ts   # POST /api/square/payment
│   └── subscription/
│       └── route.ts       # GET/POST/PATCH/DELETE /api/square/subscription
```

### Core Functions

#### **Configuration** (`src/lib/square/config.ts`)

```typescript
// Check if Square is enabled
isSquareEnabled(): boolean

// Get Square configuration
getSquareConfig(): SquareConfig

// Validate configuration
validateSquareConfig(): void

// Log status to console
logSquareStatus(): void
```

#### **Payments** (`src/lib/square/payments.ts`)

```typescript
// Process one-time payment
createPayment(params: CreatePaymentParams): Promise<PaymentResult>

// Get payment details
getPayment(paymentId: string): Promise<Payment | null>
```

#### **Subscriptions** (`src/lib/square/subscriptions.ts`)

```typescript
// Create subscription
createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>

// Get user's subscriptions
getUserSubscriptions(customerId: string): Promise<UserSubscription[]>

// Get subscription details
getSubscription(subscriptionId: string): Promise<Subscription | null>

// Cancel subscription
cancelSubscription(subscriptionId: string): Promise<SubscriptionResult>

// Update subscription
updateSubscription(subscriptionId: string, updates: object): Promise<SubscriptionResult>

// Pause subscription
pauseSubscription(subscriptionId: string): Promise<SubscriptionResult>

// Resume subscription
resumeSubscription(subscriptionId: string): Promise<SubscriptionResult>
```

---

## API Endpoints

### **GET /api/square/status**

Check if Square is enabled and get configuration.

**Response:**
```json
{
  "enabled": true,
  "environment": "sandbox",
  "applicationId": "sq0idp-..."
}
```

**When Disabled:**
```json
{
  "enabled": false,
  "environment": null,
  "applicationId": null
}
```

---

### **POST /api/square/payment**

Process a one-time payment.

**Request:**
```json
{
  "sourceId": "cnon:card-nonce-ok",
  "amount": 25.00,
  "message": "Thank you for Vonix!",
  "email": "user@example.com",
  "minecraftUsername": "Player123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "paymentId": "KkAkhdMsgzn59SM8A89WgKwekxLZY"
}
```

**Response (Square Disabled):**
```json
{
  "error": "Payment processing is currently unavailable",
  "disabled": true
}
```

---

### **GET /api/square/subscription**

Get user's active subscriptions.

**Query Parameters:**
- `customerId` (required): Square customer ID

**Response (Enabled):**
```json
{
  "subscriptions": [
    {
      "id": "sub_123",
      "status": "ACTIVE",
      "planName": "Monthly Donation",
      "amount": 10.00,
      "currency": "USD",
      "interval": "monthly",
      "nextBillingDate": "2025-11-30"
    }
  ],
  "disabled": false
}
```

**Response (Disabled):**
```json
{
  "subscriptions": [],
  "disabled": true,
  "message": "Subscription management is currently unavailable"
}
```

---

### **POST /api/square/subscription**

Create a new subscription.

**Request:**
```json
{
  "customerId": "CUSTOMER_ID",
  "planId": "PLAN_VARIATION_ID",
  "sourceId": "card_id_from_saved_card"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "sub_123456"
}
```

---

### **PATCH /api/square/subscription**

Update subscription amount.

**Request:**
```json
{
  "subscriptionId": "sub_123456",
  "priceOverride": 20.00
}
```

---

### **DELETE /api/square/subscription**

Cancel a subscription.

**Query Parameters:**
- `subscriptionId` (required): Subscription ID to cancel

**Response:**
```json
{
  "success": true,
  "message": "Subscription canceled successfully"
}
```

---

## Frontend Integration

### Check if Square is Enabled

```typescript
// In your component
const [squareEnabled, setSquareEnabled] = useState(false);

useEffect(() => {
  async function checkSquare() {
    const response = await fetch('/api/square/status');
    const data = await response.json();
    setSquareEnabled(data.enabled);
  }
  checkSquare();
}, []);
```

### Conditional UI Rendering

```typescript
// Only show payment form if Square is enabled
{squareEnabled && (
  <SquarePaymentForm />
)}

{!squareEnabled && (
  <div className="text-center p-6 border border-yellow-500/30 rounded-lg bg-yellow-500/10">
    <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
    <p className="text-gray-300">
      Square payments are currently unavailable.
    </p>
  </div>
)}
```

### Web Payments SDK Integration

```typescript
'use client';

import { useEffect, useState } from 'react';

export function SquarePaymentForm() {
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    async function initializeSquare() {
      // Check if Square is enabled first
      const statusResponse = await fetch('/api/square/status');
      const status = await statusResponse.json();
      
      if (!status.enabled) {
        console.log('Square is disabled');
        return;
      }

      // Load Square Web Payments SDK
      if (!(window as any).Square) {
        throw new Error('Square Web Payments SDK not loaded');
      }

      const payments = (window as any).Square.payments(
        status.applicationId,
        status.locationId
      );
      
      const card = await payments.card();
      await card.attach('#card-container');
      
      setPayments(payments);
      setCard(card);
    }

    initializeSquare();
  }, []);

  async function handlePayment() {
    if (!card) return;

    try {
      const result = await card.tokenize();
      if (result.status === 'OK') {
        // Send to backend
        const response = await fetch('/api/square/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token,
            amount: 25.00,
            message: 'Thank you!',
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert('Payment successful!');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  }

  return (
    <div>
      <div id="card-container"></div>
      <button onClick={handlePayment}>Pay Now</button>
    </div>
  );
}
```

---

## Subscription Management Page Example

```typescript
'use client';

import { useState, useEffect } from 'react';

export function SubscriptionManager() {
  const [squareEnabled, setSquareEnabled] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscriptions() {
      // Check if Square is enabled
      const statusResponse = await fetch('/api/square/status');
      const status = await statusResponse.json();
      setSquareEnabled(status.enabled);

      if (!status.enabled) {
        setLoading(false);
        return;
      }

      // Load subscriptions
      const response = await fetch('/api/square/subscription?customerId=CUSTOMER_ID');
      const data = await response.json();
      
      if (data.disabled) {
        setSquareEnabled(false);
      } else {
        setSubscriptions(data.subscriptions);
      }
      
      setLoading(false);
    }

    loadSubscriptions();
  }, []);

  async function cancelSubscription(subscriptionId: string) {
    const response = await fetch(
      `/api/square/subscription?subscriptionId=${subscriptionId}`,
      { method: 'DELETE' }
    );
    
    const data = await response.json();
    if (data.success) {
      alert('Subscription canceled');
      // Reload subscriptions
    }
  }

  if (!squareEnabled) {
    return (
      <div className="text-center p-6">
        <p>Subscription management is currently unavailable.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>My Subscriptions</h2>
      {subscriptions.length === 0 ? (
        <p>No active subscriptions</p>
      ) : (
        <ul>
          {subscriptions.map((sub: any) => (
            <li key={sub.id}>
              <p>{sub.planName} - ${sub.amount}/{sub.interval}</p>
              <p>Status: {sub.status}</p>
              <button onClick={() => cancelSubscription(sub.id)}>
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## Behavior When Disabled

When `SQUARE_INTEGRATION_ENABLED=false` or credentials are missing:

### Backend Behavior:
- ✅ `isSquareEnabled()` returns `false`
- ✅ All payment/subscription functions log a message and return gracefully
- ✅ API endpoints return `disabled: true` with appropriate messages
- ✅ No API calls to Square are made
- ✅ No errors thrown, application continues normally

### Frontend Behavior:
- ✅ Payment forms are not rendered
- ✅ Subscription management page shows "unavailable" message
- ✅ Donation page shows alternative payment methods only
- ✅ No Square SDK loaded

---

## Testing

### Test with Sandbox

1. Set `SQUARE_ENVIRONMENT=sandbox`
2. Use sandbox credentials from Square Dashboard
3. Test card numbers:
   - **Success**: `4111 1111 1111 1111`
   - **Decline**: `4000 0000 0000 0002`
   - CVV: any 3 digits
   - Exp: any future date

### Test Disabled State

1. Set `SQUARE_INTEGRATION_ENABLED=false`
2. Verify all payment UI is hidden
3. Verify API returns `disabled: true`
4. Verify no errors in console

---

## Production Deployment

1. Get production credentials from Square Dashboard
2. Set `SQUARE_ENVIRONMENT=production`
3. Use production access token
4. Test thoroughly before going live
5. Monitor Square Dashboard for transactions

---

## Troubleshooting

### Square SDK not loading
- Add Square SDK to your HTML head:
  ```html
  <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
  ```
  Or for production:
  ```html
  <script src="https://web.squarecdn.com/v1/square.js"></script>
  ```

### Payments failing
- Check Square Dashboard for error details
- Verify credentials are correct
- Ensure location ID matches your account
- Check network requests in browser DevTools

### Subscriptions not working
- Verify you have subscription plans created in Square Dashboard
- Check that catalog API is accessible
- Ensure customer has a saved payment method

---

## Security Considerations

- ✅ Never expose `SQUARE_ACCESS_TOKEN` in frontend code
- ✅ All payments processed server-side
- ✅ Use tokenization (Web Payments SDK) for card data
- ✅ Validate all inputs before processing
- ✅ Rate limit payment endpoints
- ✅ Log all transactions for audit trail

---

## Support

For Square-specific issues, refer to:
- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Square API Reference](https://developer.squareup.com/reference/square)
- [Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview)

---

## Summary

This integration is designed to be **completely optional** and **gracefully degradable**. When disabled, the application functions normally with alternative payment methods. When enabled, it provides full payment and subscription management capabilities through Square's robust payment infrastructure.
