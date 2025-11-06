# 2. Project Structure

This document provides an overview of the directory structure and key files in the project.

---

## Root Directory

```
/
├── .env.example         # Example environment variables
├── .gitignore           # Files and directories ignored by Git
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies and scripts
├── README.md            # Main project README
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── /docs/               # Project documentation
├── /public/             # Static assets (images, fonts)
└── /src/                # Main application source code
```

---

## `/src` Directory

The `src` directory contains all the application's source code.

### `/src/app`

This directory uses the Next.js App Router for routing and layouts.

-   **/api/**: API routes for server-side logic.
-   **/(auth)/**: Routes and layout for authentication (login, register).
-   **/(dashboard)/**: Protected routes and layout for logged-in users.
-   **/(public)/**: Publicly accessible routes and main application layout.
-   `layout.tsx`: The root layout for the entire application.
-   `page.tsx`: The homepage of the application.

### `/src/components`

Contains all React components used in the application.

-   **/admin/**: Components specific to the admin dashboard.
-   **/auth/**: Components for login, registration, etc.
-   **/donations/**: Components for the donation and subscription system.
-   **/layout/**: Main layout components (navigation, footer).
-   **/ui/**: Reusable UI components (buttons, cards, etc.), often from `shadcn/ui`.

### `/src/db`

Handles all database-related code.

-   `index.ts`: Initializes the Drizzle ORM client.
-   `init.ts`: Script for initializing and seeding the database.
-   `schema.ts`: Defines the database schema (tables, columns, relations).

### `/src/lib`

Contains libraries, helper functions, and utility code.

-   `auth.ts`: Authentication configuration and session management (NextAuth.js).
-   `discord/`: Functions for interacting with the Discord API.
-   `payments/`: Logic for Stripe and Square payment processing.
-   `rbac.ts`: Role-Based Access Control (RBAC) permission logic.
-   `utils.ts`: General utility functions.

### `/src/styles`

Global styles and CSS files.

-   `globals.css`: Base styles for the application.

### `/src/types`

Contains TypeScript type definitions.

-   `next-auth.d.ts`: Extends the default NextAuth types with user roles, etc.

---

## Key Files

-   **`src/app/layout.tsx`**: The root layout that wraps all pages. It includes the main HTML structure and providers.

-   **`src/lib/auth.ts`**: The core of the authentication system. Configures NextAuth.js with providers and callbacks.

-   **`src/db/schema.ts`**: The single source of truth for the database structure. All tables and relations are defined here.

-   **`next.config.js`**: Configuration for the Next.js framework, including plugins, redirects, and headers.

-   **`tailwind.config.ts`**: Defines the design system for Tailwind CSS, including colors, fonts, and spacing.
