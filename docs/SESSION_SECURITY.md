# Session Security & Cookie Hardening

## Auth.js Configuration

### Required Environment Variables

```bash
# Generate a secure secret (32+ characters)
# Run: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here

# Auth URL - must match your actual domain
AUTH_URL=https://vonix.network
# For local dev: AUTH_URL=http://localhost:3000

# Trust host (required for multi-domain)
AUTH_TRUST_HOST=true
```

### Fixing "Invalid Compact JWE" Errors

This error occurs when:
1. `NEXTAUTH_SECRET` changed and old cookies exist
2. Secret is missing or too short
3. Session format changed

**Solutions:**
1. Clear all cookies for the domain
2. Generate a new secure secret and restart server
3. Use a persistent secret in production (never rotate without migration)

### Cookie Security Settings

The current `auth.ts` configuration includes:
- `secure: true` in production (HTTPS only)
- `sameSite: 'lax'` to prevent CSRF
- `httpOnly: true` to prevent XSS access
- 30-day session expiration

### Production Checklist

- [ ] Set `NEXTAUTH_SECRET` to a cryptographically secure value
- [ ] Set `AUTH_URL` to match your production domain
- [ ] Enable `AUTH_TRUST_HOST=true`
- [ ] Verify HTTPS is enforced
- [ ] Configure session domain for multi-subdomain support
- [ ] Set up session rotation/refresh
- [ ] Monitor failed auth attempts

### Rate Limiting

Current implementation in `auth.ts`:
- 5 login attempts per 15 minutes per IP
- In-memory rate limiting (consider Redis for production scale)

### Recommended Improvements

1. **Redis Session Store**: For multi-server deployments
2. **CAPTCHA**: Add after 3 failed attempts
3. **2FA Support**: Optional TOTP/SMS verification
4. **Session Monitoring**: Track active sessions per user
5. **IP Allowlisting**: For admin accounts
6. **Audit Logging**: Log all auth events

### Security Headers

Already configured in `next.config.js`:
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`

### Testing

```bash
# Test auth flow
curl -X POST http://localhost:3000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Verify session
curl http://localhost:3000/api/auth/session \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Migration Notes

- **Layout Guards**: Replaced middleware with server-side layout guards
- **No Middleware**: Auth checks now in `(auth)/layout.tsx`, `(dashboard)/layout.tsx`, `(dashboard)/admin/layout.tsx`, `(dashboard)/moderation/layout.tsx`
- **Backup**: Old middleware saved as `src/middleware.ts.backup`
