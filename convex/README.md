# Convex Backend

## Overview
This directory contains the Convex backend for the Quizora quiz application.

## Structure

### Core Files
- `schema.ts` - Database schema definitions
- `auth.config.js` - Clerk authentication configuration
- `router.ts` - HTTP router configuration
- `crons.ts` - Scheduled jobs (cleanup old quizzes)

### Feature Modules
- `users.ts` - User management and sync with Clerk
- `quizzes.ts` - Quiz CRUD operations
- `sessions.ts` - Quiz session management (create, join, query)
- `gameplay.ts` - Real-time gameplay logic (start, answer, leaderboard)

## Database Schema

### Tables
1. **users** - Stores Clerk user information
2. **quizzes** - Quiz definitions
3. **questions** - Quiz questions
4. **quiz_sessions** - Live quiz sessions
5. **participants** - Players in sessions
6. **answers** - Player answers and scores

## Authentication

Authentication is handled by Clerk. The `auth.config.js` file configures Convex to accept Clerk JWT tokens.

### Getting User Identity
```typescript
const identity = await ctx.auth.getUserIdentity();
const userId = identity?.subject; // Clerk user ID
```

## Performance Optimizations

All queries use `Promise.all()` for parallel execution where possible:
- Session data fetching
- Answer submission
- User sync operations

## Cron Jobs

- **Daily at midnight UTC**: Deletes quizzes older than 90 days

## Development

Start the Convex dev server:
```bash
npx convex dev
```

Deploy to production:
```bash
npx convex deploy
```
