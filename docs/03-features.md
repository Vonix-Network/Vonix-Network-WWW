# 3. Features Guide

This guide provides a detailed overview of the key features of the Vonix Network web application.

---

## Authentication

-   **Powered by**: NextAuth.js
-   **Features**:
    -   Secure user registration and login.
    -   Session management with JWTs.
    -   Password hashing with bcrypt.
    -   Role-based access control (RBAC).

---

## User Profiles

-   **URL**: `/profile/[username]`
-   **Features**:
    -   Displays user's avatar, username, and role.
    -   Shows activity feed (forum posts, social posts).
    -   Tracks user statistics (posts, reputation, etc.).

---

## Server List

-   **URL**: `/servers`
-   **Features**:
    -   Lists all game servers with their status (online/offline).
    -   Displays real-time player counts.
    -   Provides connection information (IP address, port).

---

## Forum

-   **URL**: `/forum`
-   **Features**:
    -   Categorized discussion forums.
    -   Create, read, update, and delete posts and replies.
    -   Moderation tools for staff (pin, lock, delete).

---

## Social Feed

-   **URL**: `/social`
-   **Features**:
    -   A micro-blogging feed for short user posts.
    -   Like and comment on posts.
    -   Follow other users to see their posts in a personalized feed.

---

## Donations & Subscriptions

-   **URL**: `/donations`
-   **Payment Providers**: Stripe and Square, configurable via environment variables.
-   **Features**:
    -   One-time donations.
    -   Recurring subscriptions for donor ranks.
    -   Secure payment processing with PCI-compliant SDKs.
    -   Webhook integration for handling payment events (renewals, failures).
    -   Enterprise-grade security features (rate limiting, idempotency, signature verification).

---

## Admin Dashboard

-   **URL**: `/admin`
-   **Access**: Restricted to `admin` and `superadmin` roles.
-   **Features**:
    -   **User Management**: View, edit, and manage all users.
    -   **Donation Management**: View all donations and subscriptions.
    -   **Site Settings**: Configure application-wide settings.
    -   **Content Management**: Manage forum categories, ranks, etc.

---

## Moderation Dashboard

-   **URL**: `/moderation`
-   **Access**: Restricted to `moderator`, `admin`, and `superadmin` roles.
-   **Features**:
    -   View and act on user reports.
    -   Moderate forum and social content.

---

## Discord Integration

-   **Configuration**: `DISCORD_*` environment variables.
-   **Features**:
    -   Sends messages to a Discord channel via webhooks.
    -   Can be used for notifications (e.g., new registrations, donations).
    -   Bot integration for more advanced features.
