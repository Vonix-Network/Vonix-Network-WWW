# 1. Getting Started

This guide will walk you through setting up the Vonix Network web application for local development.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (or a compatible package manager like yarn or pnpm)
- [Git](https://git-scm.com/)

---

## 1. Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone <repository-url>
cd Vonix-Network-WWW
```

---

## 2. Install Dependencies

Install the required npm packages:

```bash
npm install
```

---

## 3. Environment Variables

The application uses environment variables for configuration. You'll need to create a `.env.local` file.

1.  **Copy the example file**:
    ```bash
    cp .env.example .env.local
    ```

2.  **Edit `.env.local`** and fill in the required values:

    -   `NEXTAUTH_SECRET`: A random string for session encryption. Generate one with `openssl rand -base64 32`.
    -   `NEXTAUTH_URL`: Your local development URL, typically `http://localhost:3000`.
    -   `DATABASE_URL`: The path to your local database file. The default `file:./data/vonix.db` is usually fine.

    For optional features like Discord or payments, fill in those variables as well. See the comments in `.env.example` for details.

---

## 4. Initialize the Database

This project uses Drizzle ORM with a Turso/SQLite database. The initialization script will create the database file and apply the schema.

Run the following command:

```bash
npm run db:init
```

This command executes the `src/db/init.ts` script, which:
- Creates the database file if it doesn't exist.
- Runs Drizzle migrations to set up the tables.
- Seeds the database with initial data (e.g., default site settings).

---

## 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

This will start the application, typically on port 3000.

---

## 6. Access the Application

Open your web browser and navigate to:

[http://localhost:3000](http://localhost:3000)

You should now see the Vonix Network homepage. You can create an account, log in, and start exploring the features.

---

## Troubleshooting

-   **Port already in use**: If port 3000 is taken, you can run the server on a different port:
    ```bash
    npm run dev -- -p 3001
    ```

-   **Database errors**: If you encounter database issues, you can safely delete the `data/vonix.db` file and re-run `npm run db:init` to start with a fresh database.

-   **Environment variable issues**: Ensure your `.env.local` file is correctly named and in the root of the project. Restart the development server after making changes to this file.
