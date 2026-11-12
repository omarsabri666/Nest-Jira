# Jira-style project management API

Jira-style project management API.

## Features

- NestJS 11 and TypeScript with strict compiler settings
- PostgreSQL 16 with Prisma 7 and database migrations
- Redis 7 for caching, rate limiting, and BullMQ queues
- JWT and Passport authentication with refresh-token rotation
- Global RBAC plus project-scoped `OWNER`, `MEMBER`, and `VIEWER` roles
- Issue status workflow, comments, caching, and due-date reminder jobs
- Docker Compose for local PostgreSQL and Redis infrastructure
- Swagger/OpenAPI documentation with bearer authentication support
- Jest unit tests and Supertest end-to-end tests
- ESLint, Prettier, and GitHub Actions CI

## Architecture

```mermaid
flowchart LR
    Client[Client] --> API[NestJS API]
    API --> Guards[JWT and RBAC guards]
    Guards --> Services[Feature services]
    Services --> Prisma[Prisma]
    Prisma --> Postgres[(PostgreSQL)]
    Services --> Cache[(Redis cache)]
    Services --> Queue[(Redis / BullMQ)]
    Queue --> Processor[Mail and reminder processors]
    Processor --> Mailer[Mailer adapter]
```

All routes are protected by the global JWT guard unless explicitly marked public. Responses use a consistent envelope containing `success`, `data`, and `timestamp`, with optional pagination metadata.

## Project Structure

```text
src/
├── auth/       # Registration, login, JWT, refresh tokens
├── common/     # Shared DTOs, guards, decorators, filters, interceptors
├── config/     # Environment validation and typed configuration
├── health/     # Database and Redis health checks
├── issues/     # Issues, comments, workflow, caching, and events
├── mail/       # Mail service abstraction and mock implementation
├── prisma/     # Prisma client module and lifecycle management
├── projects/   # Projects and project membership
├── queues/     # BullMQ queues, processors, and schedulers
├── redis/      # Redis client module
└── users/      # User profiles and global role management

prisma/
├── migrations/ # Versioned database migrations
├── schema.prisma
└── seed.ts     # Roles, permissions, and development admin user

test/           # End-to-end test suites and test setup
```

## Prerequisites

- Node.js 22 or newer
- npm
- Docker Engine and Docker Compose

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env
   ```

   Replace both JWT secrets with values of at least 32 characters. The example values are suitable only for local development.

3. Start PostgreSQL and Redis:

   ```bash
   docker compose up -d
   ```

4. Apply migrations and seed the development database:

   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

   Use `npx prisma migrate dev` instead when developing a new schema migration.

5. Start the API:

   ```bash
   npm run start:dev
   ```

The API listens on `http://localhost:3000` by default. Swagger is available at [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) when enabled. The health endpoint is [`http://localhost:3000/health`](http://localhost:3000/health).

## Scripts

| Command                     | Description                                 |
| --------------------------- | ------------------------------------------- |
| `npm run start:dev`         | Start the API in watch mode                 |
| `npm run start`             | Start the compiled Nest application         |
| `npm run start:prod`        | Run the production build from `dist/`       |
| `npm run build`             | Lint, check formatting, and compile         |
| `npm run lint`              | Run ESLint with type-aware rules            |
| `npm run format`            | Format source and test files                |
| `npm run format:check`      | Check Prettier formatting                   |
| `npm run test:unit`         | Run unit tests                              |
| `npm run test:e2e`          | Run end-to-end tests                        |
| `npm run test:cov`          | Run unit tests with coverage output         |
| `npx prisma generate`       | Generate the Prisma client                  |
| `npx prisma migrate deploy` | Apply committed migrations                  |
| `npx prisma migrate dev`    | Create/apply a development migration        |
| `npm run prisma:seed`       | Seed roles, permissions, and the admin user |

## Environment Variables

Copy `.env.example` to `.env`; all application variables are listed below.

| Variable                  | Description                                         | Default / example                                                     |
| ------------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| `PORT`                    | HTTP server port                                    | `3000`                                                                |
| `NODE_ENV`                | Runtime environment                                 | `development`                                                         |
| `POSTGRES_USER`           | Docker PostgreSQL user                              | `postgres`                                                            |
| `POSTGRES_PASSWORD`       | Docker PostgreSQL password                          | `postgres`                                                            |
| `POSTGRES_DB`             | Docker PostgreSQL database                          | `nestjs_production_api`                                               |
| `DATABASE_URL`            | Prisma PostgreSQL connection string                 | `postgresql://postgres:postgres@localhost:5432/nestjs_production_api` |
| `REDIS_HOST`              | Redis hostname                                      | `localhost`                                                           |
| `REDIS_PORT`              | Redis port                                          | `6379`                                                                |
| `REDIS_PASSWORD`          | Optional Redis password                             | empty                                                                 |
| `CACHE_TTL`               | Cache lifetime in seconds                           | `60`                                                                  |
| `BULL_ATTEMPTS`           | Maximum queue attempts                              | `3`                                                                   |
| `BULL_BACKOFF_DELAY`      | Queue retry delay in milliseconds                   | `1000`                                                                |
| `BULL_REMOVE_ON_COMPLETE` | Completed jobs retained                             | `1000`                                                                |
| `BULL_REMOVE_ON_FAIL`     | Failed jobs retained                                | `5000`                                                                |
| `JWT_ACCESS_SECRET`       | Access-token signing secret, minimum 32 characters  | required                                                              |
| `JWT_REFRESH_SECRET`      | Refresh-token signing secret, minimum 32 characters | required                                                              |
| `JWT_ACCESS_EXPIRES_IN`   | Access-token lifetime                               | `15m`                                                                 |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh-token lifetime                              | `7d`                                                                  |
| `THROTTLE_TTL`            | Rate-limit window in seconds                        | `60`                                                                  |
| `THROTTLE_LIMIT`          | Requests allowed per window                         | `10`                                                                  |
| `SWAGGER_ENABLED`         | Enable Swagger in production                        | `false`                                                               |
| `SWAGGER_PATH`            | Swagger route without a leading slash               | `api/docs`                                                            |

`POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` configure Docker Compose. The application itself uses `DATABASE_URL`.

## API Overview

| Module   | Base routes                   | Purpose                                            |
| -------- | ----------------------------- | -------------------------------------------------- |
| Health   | `/health`                     | Public database and Redis readiness check          |
| Auth     | `/auth`                       | Register, login, refresh, logout, and current user |
| Users    | `/users`                      | Profiles, user administration, and global roles    |
| Projects | `/projects`                   | Project CRUD and member role management            |
| Issues   | `/projects/:projectId/issues` | Issue CRUD, status changes, and comments           |

Use Swagger for request schemas, authentication, permissions, and the complete endpoint list.

## Default Credentials

The seed script creates an administrator for local development:

```text
Email:    omar@example
Password: Admin123!
```

Change or remove this account before deploying to any shared or production environment. Never use the example JWT secrets in production.

## Testing

Unit tests cover authentication, guards, services, queue processors, and schedulers without requiring external services. Run them with:

```bash
npm run test:unit
npm run test:cov
```

End-to-end tests exercise the HTTP API, authentication, RBAC, projects, issues, and health checks. They require PostgreSQL and Redis, migrations, and seed data:

```bash
npm run test:e2e
```
