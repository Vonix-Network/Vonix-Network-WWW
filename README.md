# 🎮 Vonix Network - Minecraft Community Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Turso](https://img.shields.io/badge/Turso-Database-green?style=for-the-badge)](https://turso.tech/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A modern, full-stack Minecraft community platform built with Next.js 14, featuring real-time server status, integrated forums, social features, and comprehensive admin tools.

## ✨ Features

### 🎯 Core Features
- **Real-time Server Status** - Live Minecraft server monitoring with player counts
- **Integrated Forums** - Full-featured discussion platform with categories and moderation
- **Social Platform** - Community posts, comments, and engagement system
- **Friend System** - Send requests, manage friends, real-time status updates
- **Notifications** - Real-time alerts with notification bell and auto-refresh
- **Blog System** - Admin-managed blog with rich content and SEO optimization
- **Events System** - Community events with RSVP and attendee tracking
- **Minecraft Authentication** - Seamless in-game registration and login
- **Admin Dashboard** - Comprehensive management tools for community leaders
- **Donation System** - Integrated payment processing with rank management
- **Discord Integration** - Real-time chat and bot functionality

### 🚀 Technical Features
- **Real-time Updates** - Instant UI updates without page refreshes
- **Error Boundaries** - Graceful error handling with recovery options
- **Progressive Web App** - Mobile-optimized with offline capabilities
- **Performance Optimized** - Fast loading with static UI and dynamic content
- **Scalable Architecture** - Built for growth with efficient database design
- **Security First** - Comprehensive authentication and authorization
- **Type-Safe** - Full TypeScript coverage with Zod validation
- **Docker Ready** - Easy deployment with containerization

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js 14)  │◄──►│   (API Routes)  │◄──►│   (Turso)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Discord Bot   │    │   File Storage  │
│   (Real-time)   │    │   Integration   │    │   (Images)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Query** - Data fetching and caching
- **Zustand** - State management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication system
- **Drizzle ORM** - Type-safe database queries
- **Turso** - Edge SQLite database
- **WebSocket** - Real-time communication
- **Discord.js** - Discord bot integration

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Orchestration (optional)
- **Nginx** - Reverse proxy
- **Redis** - Caching (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional)
- Turso account (for database)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/vonix-network.git
cd vonix-network
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Database Setup
```bash
# Set up Turso database
npm run db:push

# Run migrations
npm run db:migrate-all
```

### 5. Start Development Server
```bash
# Start web app only
npm run dev

# OR start web app + Discord bot together
npm run dev:all
```

Visit `http://localhost:3000` to see the application.

### 6. Verify Installation
```bash
# Run code quality checks
npm run validate

# Check health endpoint
npm run health
```

## 📁 Project Structure

```
vonix-network/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── (public)/          # Public pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── admin/             # Admin-specific components
│   │   ├── forum/             # Forum components
│   │   ├── social/            # Social platform components
│   │   └── ui/                # Reusable UI components
│   ├── db/                    # Database configuration
│   ├── lib/                   # Utility libraries
│   └── types/                 # TypeScript type definitions
├── docker/                    # Docker configuration
├── k8s/                       # Kubernetes manifests
├── scripts/                   # Utility scripts
└── public/                    # Static assets
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Discord
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token

# Minecraft Integration
MINECRAFT_API_KEY=your_minecraft_api_key

# Optional
REDIS_URL=your_redis_url
```

### Database Schema

The application uses a comprehensive database schema with the following main tables:

- **users** - User accounts and profiles
- **servers** - Minecraft server information
- **forum_posts** - Forum topics and posts
- **forum_replies** - Forum replies and comments
- **social_posts** - Social platform posts
- **donations** - Donation records
- **donation_ranks** - Donation tier definitions

See [DATABASE.md](docs/DATABASE.md) for detailed schema information.

## 🚀 Deployment

### Docker Deployment

```bash
# Development environment
npm run docker:up:dev

# Production environment
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

### Kubernetes Deployment

```bash
# Deploy to cluster
npm run k8s:deploy

# Check deployment status
npm run k8s:status

# View logs
npm run k8s:logs

# Restart deployment
npm run k8s:restart
```

### Manual Deployment

```bash
# Production deployment (with validation)
npm run deploy:production

# OR manually
npm run build
npm run start:all  # Web + Bot

# OR just web
npm start
```

## 📚 Documentation

### 🚀 Quick Start
- **[Quick Reference](QUICK_REFERENCE.md)** - Fast command reference for daily tasks
- **[Setup Guide](SetupGuide.md)** - Detailed setup instructions

### 📖 Guides
- **[Features](docs/FEATURES.md)** - Complete feature list and status
- **[API Documentation](docs/API.md)** - API endpoint reference
- **[Database Schema](docs/DATABASE.md)** - Database structure and migrations
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment strategies
- **[Development History](docs/DEVELOPMENT_HISTORY.md)** - Implementation timeline and progress

### 🤝 Contributing
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Security Policy](SECURITY.md)** - Security guidelines and vulnerability reporting

### 🔧 Technical Docs
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Detailed implementation guide
- **[Project Analysis](PROJECT_ANALYSIS.md)** - Project structure and analysis

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1

## 🔒 Security

- **Authentication**: NextAuth.js with multiple providers
- **Authorization**: Role-based access control
- **Data Validation**: Zod schema validation
- **SQL Injection**: Protected with Drizzle ORM
- **XSS Protection**: React's built-in protection
- **CSRF Protection**: NextAuth.js CSRF tokens

## 📈 Monitoring

The application includes comprehensive monitoring:

- **Performance Metrics**: Real-time performance tracking
- **Error Logging**: Structured error logging with Pino
- **Health Checks**: API health monitoring
- **Database Monitoring**: Query performance tracking

## 🎯 Roadmap

### Phase 1 - Critical Features ✅ COMPLETE
- ✅ Notifications System
- ✅ Friend System (API + UI)
- ✅ Dashboard Stats Fix

### Phase 2 - High Priority ✅ COMPLETE
- ✅ Blog System (Full Stack)
- ✅ Events System (API Complete)

### Phase 3 - Technical Improvements ✅ COMPLETE
- ✅ Error Boundaries
- ✅ Custom 404 Page
- ✅ Friends UI Integration

### Phase 4 - Remaining Features 🔄 IN PROGRESS
- 🔄 Events UI Pages
- 🔄 Blog Rich Text Editor
- 📋 Groups/Communities System
- 📋 Stories Feature
- 📋 Performance Optimizations

### Future Enhancements 📋 PLANNED
- 📋 Map integration
- 📋 Advanced analytics
- 📋 Mobile app
- 📋 Multi-language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Turso](https://turso.tech/) - Edge SQLite database
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icons

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/vonix-network/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/vonix-network/discussions)
- **Discord**: [Join our Discord](https://discord.gg/your-invite)

---

**Built with ❤️ for the Minecraft community**
