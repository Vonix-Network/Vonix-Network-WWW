# Vonix Network - Web Application

Welcome to the official web application for the Vonix Network. This project serves as the central hub for our community, providing a feature-rich platform for players, staff, and visitors.

---

## ✨ Features

- **User Authentication**: Secure login and registration system with NextAuth.
- **Player Profiles**: Detailed user profiles with stats, ranks, and activity.
- **Server List**: Real-time server status and player counts.
- **Forum**: Community discussion forums with categories, posts, and replies.
- **Social Feed**: A Twitter-like social feed for user posts and interactions.
- **Leaderboards**: Ranking of top players based on various metrics.
- **Donations & Subscriptions**: Support the network through donations and rank subscriptions with Stripe and Square integration.
- **Admin & Moderation Dashboards**: Powerful tools for staff to manage the community and application.
- **Discord Integration**: Connects the web application with our Discord server.

---

## 📚 Documentation

This project is documented in the `/docs` directory. For a complete overview, please start with the following files:

- **[Getting Started](./docs/01-getting-started.md)**: How to set up and run the project locally.
- **[Project Structure](./docs/02-project-structure.md)**: An overview of the repository layout.
- **[Features Guide](./docs/03-features.md)**: A detailed guide to all application features.
- **[Deployment](./docs/04-deployment.md)**: Instructions for deploying the application to production.

---

## 🚀 Quick Start

To get the application running locally, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Vonix-Network-WWW
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    - Copy `.env.example` to `.env.local`.
    - Fill in the required variables (database, auth secret, etc.).
    ```bash
    cp .env.example .env.local
    ```

4.  **Initialize the database**:
    ```bash
    npm run db:init
    ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```

6.  **Open your browser** to `http://localhost:3000`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Database**: [Turso](https://turso.tech/) (SQLite)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/), [Square](https://developer.squareup.com/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🤝 Contributing

Please refer to the `CONTRIBUTING.md` file for guidelines on how to contribute to this project.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
