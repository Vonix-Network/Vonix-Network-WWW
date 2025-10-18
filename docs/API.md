# API Documentation

## Overview

Vonix Network provides a comprehensive REST API for managing Minecraft community features. All API endpoints are built with Next.js API routes and follow RESTful conventions.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

### API Key Authentication

Some endpoints require API key authentication for Minecraft server integration:

```http
X-API-Key: your-api-key-here
```

### Session Authentication

Most endpoints use NextAuth.js session authentication:

```http
Cookie: next-auth.session-token=your-session-token
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 100 requests per 15 minutes
- **File upload endpoints**: 10 requests per hour

## Endpoints

### Authentication

#### POST `/api/auth/[...nextauth]`
NextAuth.js authentication endpoint.

**Providers**: Discord, Credentials

### User Management

#### GET `/api/user/profile`
Get current user profile.

**Authentication**: Required
**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "player123",
    "email": "player@example.com",
    "minecraftUsername": "Player123",
    "role": "user",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/user/profile`
Update user profile.

**Authentication**: Required
**Body**:
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "bio": "Updated bio"
}
```

### Minecraft Integration

#### POST `/api/registration/check-registration`
Check if a Minecraft player is registered.

**Authentication**: API Key required
**Body**:
```json
{
  "minecraft_uuid": "player-uuid-here"
}
```

**Response**:
```json
{
  "registered": true,
  "user": {
    "id": 1,
    "username": "player123",
    "minecraft_username": "Player123",
    "role": "user"
  }
}
```

#### POST `/api/registration/minecraft-login`
Authenticate Minecraft player.

**Authentication**: API Key required
**Body**:
```json
{
  "minecraft_username": "Player123",
  "minecraft_uuid": "player-uuid-here",
  "password": "player-password"
}
```

#### POST `/api/registration/minecraft-register`
Register new Minecraft player.

**Authentication**: API Key required
**Body**:
```json
{
  "minecraft_username": "Player123",
  "minecraft_uuid": "player-uuid-here",
  "password": "secure-password"
}
```

### Server Management

#### GET `/api/servers/update`
Get live server status.

**Query Parameters**:
- `serverId`: Server ID to check

**Response**:
```json
{
  "online": true,
  "players": {
    "online": 15,
    "max": 100,
    "list": [
      {
        "name": "Player123",
        "uuid": "player-uuid"
      }
    ]
  },
  "version": "1.20.1",
  "motd": "Welcome to our server!",
  "icon": "data:image/png;base64,..."
}
```

### Forum

#### GET `/api/forum/categories`
Get all forum categories.

**Response**:
```json
{
  "categories": [
    {
      "id": 1,
      "name": "General Discussion",
      "description": "General topics and community discussion",
      "slug": "general",
      "icon": "💬",
      "orderIndex": 1,
      "postCount": 25
    }
  ]
}
```

#### GET `/api/forum/categories/[id]/topics`
Get topics in a category.

**Path Parameters**:
- `id`: Category ID

**Response**:
```json
{
  "topics": [
    {
      "id": 1,
      "title": "Welcome to the server!",
      "content": "Welcome everyone...",
      "pinned": false,
      "locked": false,
      "views": 150,
      "createdAt": "2024-01-01T00:00:00Z",
      "author": {
        "username": "admin"
      },
      "replyCount": 5
    }
  ]
}
```

#### POST `/api/forum/posts`
Create new forum post.

**Authentication**: Required
**Body**:
```json
{
  "categoryId": 1,
  "title": "New Topic Title",
  "content": "Topic content here..."
}
```

#### GET `/api/forum/posts/[id]/replies`
Get replies for a forum post.

**Path Parameters**:
- `id`: Post ID

**Response**:
```json
{
  "replies": [
    {
      "id": 1,
      "content": "Great post!",
      "createdAt": "2024-01-01T00:00:00Z",
      "author": {
        "id": 1,
        "username": "player123",
        "avatar": "https://...",
        "role": "user"
      }
    }
  ]
}
```

#### POST `/api/forum/replies/[id]`
Create reply to forum post.

**Authentication**: Required
**Path Parameters**:
- `id`: Post ID

**Body**:
```json
{
  "content": "Reply content here..."
}
```

### Social Platform

#### GET `/api/social/posts`
Get social posts feed.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Posts per page (default: 20)

**Response**:
```json
{
  "posts": [
    {
      "id": 1,
      "content": "Just built an amazing castle!",
      "imageUrl": "https://...",
      "createdAt": "2024-01-01T00:00:00Z",
      "author": {
        "id": 1,
        "username": "builder123",
        "avatar": "https://...",
        "role": "user"
      },
      "likesCount": 15,
      "commentsCount": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST `/api/social/posts`
Create new social post.

**Authentication**: Required
**Body**:
```json
{
  "content": "Post content here...",
  "imageUrl": "https://example.com/image.jpg"
}
```

#### POST `/api/social/posts/like`
Like/unlike a social post.

**Authentication**: Required
**Body**:
```json
{
  "postId": 1
}
```

#### GET `/api/social/posts/[id]/comments`
Get comments for a social post.

**Path Parameters**:
- `id`: Post ID

**Response**:
```json
{
  "comments": [
    {
      "id": 1,
      "content": "Amazing build!",
      "createdAt": "2024-01-01T00:00:00Z",
      "author": {
        "id": 1,
        "username": "player123",
        "avatar": "https://..."
      },
      "likesCount": 5,
      "replies": []
    }
  ]
}
```

### Admin

#### GET `/api/admin/users/with-ranks`
Get all users with their ranks.

**Authentication**: Admin required
**Response**:
```json
{
  "users": [
    {
      "id": 1,
      "username": "player123",
      "email": "player@example.com",
      "role": "user",
      "donationRankId": "vip",
      "totalDonated": 50.00,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z",
  "cache": {
    "disabled": true,
    "reason": "force-dynamic rendering"
  }
}
```

#### POST `/api/admin/donations`
Create new donation record.

**Authentication**: Admin required
**Body**:
```json
{
  "minecraftUsername": "Player123",
  "amount": 25.00,
  "currency": "USD",
  "method": "PayPal",
  "message": "Thank you for the great server!",
  "displayed": true
}
```

#### GET `/api/admin/donor-ranks`
Get all donation ranks.

**Authentication**: Admin required
**Response**:
```json
{
  "ranks": [
    {
      "id": "vip",
      "name": "VIP",
      "minAmount": 25.00,
      "color": "#FFD700",
      "textColor": "#000000",
      "badge": "VIP",
      "glow": true,
      "duration": 30
    }
  ]
}
```

### Discord Integration

#### GET `/api/discord/status`
Get Discord bot status.

**Response**:
```json
{
  "connected": true,
  "guilds": 1,
  "users": 150,
  "uptime": "2 days, 5 hours"
}
```

#### POST `/api/discord/control`
Control Discord bot.

**Authentication**: Admin required
**Body**:
```json
{
  "action": "restart",
  "reason": "Maintenance"
}
```

### Search

#### GET `/api/search`
Search across the platform.

**Query Parameters**:
- `q`: Search query
- `type`: Search type (users, posts, topics)
- `page`: Page number
- `limit`: Results per page

**Response**:
```json
{
  "results": [
    {
      "type": "user",
      "id": 1,
      "title": "player123",
      "description": "Active community member",
      "url": "/profile/player123"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

### Health & Monitoring

#### GET `/api/health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "2.0.0",
  "database": "connected",
  "discord": "connected"
}
```

#### GET `/api/metrics`
Get system metrics.

**Authentication**: Admin required
**Response**:
```json
{
  "users": {
    "total": 150,
    "active": 25,
    "newToday": 3
  },
  "posts": {
    "total": 500,
    "today": 15
  },
  "servers": {
    "total": 3,
    "online": 2
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## WebSocket API

### Connection

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000/api/ws');
```

### Events

#### Server Status Updates
```json
{
  "type": "server_status",
  "data": {
    "serverId": 1,
    "online": true,
    "players": 15
  }
}
```

#### New Forum Post
```json
{
  "type": "forum_post",
  "data": {
    "id": 1,
    "title": "New Topic",
    "categoryId": 1
  }
}
```

#### New Social Post
```json
{
  "type": "social_post",
  "data": {
    "id": 1,
    "content": "New post content"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class VonixAPI {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async getServerStatus(serverId: number) {
    const response = await fetch(`${this.baseUrl}/api/servers/update?serverId=${serverId}`);
    return response.json();
  }

  async createForumPost(categoryId: number, title: string, content: string) {
    const response = await fetch(`${this.baseUrl}/api/forum/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      },
      body: JSON.stringify({ categoryId, title, content })
    });
    return response.json();
  }
}

// Usage
const api = new VonixAPI('https://your-domain.com');
const status = await api.getServerStatus(1);
```

### Python

```python
import requests

class VonixAPI:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.api_key = api_key

    def get_server_status(self, server_id):
        response = requests.get(f"{self.base_url}/api/servers/update", 
                              params={"serverId": server_id})
        return response.json()

    def create_forum_post(self, category_id, title, content):
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        
        data = {
            "categoryId": category_id,
            "title": title,
            "content": content
        }
        
        response = requests.post(f"{self.base_url}/api/forum/posts", 
                               json=data, headers=headers)
        return response.json()

# Usage
api = VonixAPI("https://your-domain.com")
status = api.get_server_status(1)
```

## Rate Limiting

Rate limits are enforced per IP address and user session:

- **Authentication endpoints**: 5 requests per minute
- **API endpoints**: 100 requests per 15 minutes
- **File upload**: 10 requests per hour
- **Search endpoints**: 50 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

**Query Parameters**:
- `sort`: Sort field (e.g., `createdAt`, `-createdAt` for descending)
- `filter`: Filter criteria (e.g., `role:admin`)
- `search`: Search term

**Example**:
```
GET /api/admin/users/with-ranks?sort=-createdAt&filter=role:admin&search=john
```

---

For more detailed information about specific endpoints, please refer to the source code in the `src/app/api/` directory.

