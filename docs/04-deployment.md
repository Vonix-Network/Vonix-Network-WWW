# 4. Deployment

This guide covers deploying the Vonix Network web application to a production environment.

---

## Recommended Host: Vercel

[Vercel](https://vercel.com/) is the recommended hosting platform for this Next.js application. It provides seamless integration, automatic deployments, and a global CDN.

---

## 1. Connect Your Repository

1.  Create a new project on Vercel.
2.  Connect your Git repository (GitHub, GitLab, Bitbucket).
3.  Vercel will automatically detect that it's a Next.js project.

---

## 2. Configure Environment Variables

In your Vercel project settings, navigate to **Settings → Environment Variables**. Add all the variables from your `.env.local` file.

**IMPORTANT**: For production, ensure you use your **live** API keys for services like Stripe and Square.

-   `NODE_ENV`: `production`
-   `NEXTAUTH_URL`: Your production domain (e.g., `https://www.vonix.network`)
-   `DATABASE_URL`: Your production database URL (e.g., from Turso).
-   `STRIPE_SECRET_KEY`: Your **live** Stripe secret key.
-   `SQUARE_ACCESS_TOKEN`: Your **production** Square access token.
-   `STRIPE_WEBHOOK_SECRET`: Your production Stripe webhook secret.
-   `SQUARE_WEBHOOK_SIGNATURE_KEY`: Your production Square webhook signature key.

---

## 3. Configure Webhooks

Your payment providers need to be able to send events to your deployed application. In your Stripe and Square dashboards, update your webhook endpoint URLs to use your production domain:

-   **Stripe Webhook URL**: `https://<your-domain>/api/webhooks/stripe`
-   **Square Webhook URL**: `https://<your-domain>/api/webhooks/square`

---

## 4. Deploy

Trigger a deployment in Vercel (this usually happens automatically when you push to your main branch).

Vercel will build the application, run optimizations, and deploy it to their global network.

---

## 5. Custom Domain

In your Vercel project settings, navigate to **Settings → Domains** to add your custom domain (e.g., `vonix.network`). Vercel will provide instructions for updating your DNS records.

---

## Build Command and Output Directory

Vercel will automatically use the correct settings for a Next.js project:

-   **Build Command**: `npm run build`
-   **Output Directory**: `.next`

You typically do not need to change these.

---

## Serverless Functions

All API routes in the `/src/app/api` directory will be deployed as serverless functions, which scale automatically with traffic.

---

## Database

For production, it is highly recommended to use a hosted database service like [Turso](https://turso.tech/) rather than a local file. Update your `DATABASE_URL` environment variable accordingly.
