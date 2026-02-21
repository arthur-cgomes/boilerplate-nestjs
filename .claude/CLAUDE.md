# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development
npm run start:dev          # Start with hot-reload (recommended)
npm run start:debug        # Debug mode with watch

# Production
npm run build              # Compile TypeScript
npm run start:prod         # Run migrations then start (production)

# Code Quality
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting

# Testing
npm test                   # Run unit tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report (requires 100% on services)
npm run test:e2e           # End-to-end tests

# Database Migrations
npm run migration:generate # Generate migration from entity changes
npm run migration:run      # Execute pending migrations
npm run migration:revert   # Rollback last migration
```

## Architecture Overview

This is a NestJS boilerplate with JWT authentication, TypeORM/PostgreSQL, Redis caching, and Supabase integration.

### Module Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Application bootstrap
├── config/                    # Configuration files
│   └── typeorm.config.ts
├── common/                    # Shared resources
│   ├── constants/             # App constants, error/success messages
│   ├── decorators/            # Custom decorators (@CurrentUser, @Roles)
│   ├── dto/                   # Shared DTOs (GetAllResponseDto, PaginationDto)
│   ├── entity/                # BaseCollection entity
│   ├── enum/                  # UserType, SortOrder, AuthProvider enums
│   ├── guards/                # RolesGuard
│   ├── services/              # EmailClientService
│   ├── utils/                 # Test utilities
│   └── validators/            # Custom validators (IsStrongPassword)
├── auth/                      # Authentication module
│   ├── dto/                   # Login, RefreshToken, PasswordReset DTOs
│   ├── entity/                # LoginAttempt, PasswordResetToken, RefreshToken
│   ├── interfaces/            # JwtPayload, LoginResponse
│   ├── services/              # LoginAttemptService, TokenBlacklistService
│   ├── strategies/            # JwtStrategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── user/                      # User management module
│   ├── dto/                   # CreateUser, UpdateUser, User DTOs
│   ├── entity/                # User entity
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.module.ts
├── health-check/              # Health check module
│   ├── dto/                   # HealthCheckResponse DTO
│   ├── interfaces/
│   ├── health-check.controller.ts
│   ├── health-check.service.ts
│   └── health-check.module.ts
├── feature-flag/              # Feature flags module
│   ├── dto/                   # CreateFeatureFlag, UpdateFeatureFlag DTOs
│   ├── entity/                # FeatureFlag entity
│   ├── interfaces/            # FeatureFlagContext
│   ├── feature-flag.controller.ts
│   ├── feature-flag.service.ts
│   └── feature-flag.module.ts
├── file-upload/               # File upload module (Supabase Storage)
│   ├── dto/                   # UploadFile DTOs
│   ├── entity/                # FileRecord entity
│   ├── interfaces/            # UploadResult
│   ├── file-upload.controller.ts
│   ├── file-upload.service.ts
│   └── file-upload.module.ts
├── audit-log/                 # Audit logging module
│   ├── dto/                   # AuditLogQuery DTO
│   ├── entity/                # AuditLog entity
│   ├── enum/                  # AuditAction enum
│   ├── interfaces/
│   ├── audit-log.controller.ts
│   ├── audit-log.service.ts
│   └── audit-log.module.ts
└── migrations/                # TypeORM migrations
```

### Key Patterns

- **Repository Pattern**: TypeORM repositories injected into services
- **DTO Validation**: class-validator decorators on DTOs at controller boundaries
- **Pagination**: Query params `take`, `skip`, `search`, `sort`, `order` returning `GetAllResponseDto`
- **Auth Flow**: POST /v1/auth/login → JWT with userId, email, name, userType → Bearer token in Authorization header
- **Soft Delete**: Entities use `active` flag and `deleteAt` timestamp
- **Audit Logging**: Track entity changes with AuditLogService

### Database

- PostgreSQL with TypeORM, migrations in `/src/migrations/`
- Redis for caching (feature flags, token blacklist)
- Config in `/src/config/typeorm.config.ts` using env vars
- Base entity has UUID PK, audit fields (createdAt, updatedAt, createdBy, deleteAt, active)

### Testing

- Tests located in `__tests__/` directories within each module
- Mocks co-located in `__tests__/mocks/`
- Coverage requirement: 100% on service files
- Uses Jest TestingModule with mocked dependencies

### API Documentation

Swagger available at `/api` with bearer auth support. All endpoints use `@ApiOperation` and `@ApiResponse` decorators.

### Environment Variables

Required in `.env` (see `.env.example`):

```bash
# General
NODE_ENV=local
HOST=0.0.0.0
PORT=3000

# JWT Auth
AUTH_SECRET=your-super-secret-key
EXPIRE_IN=7200
REFRESH_EXPIRE_IN=604800

# PostgreSQL
TYPEORM_HOST=localhost
TYPEORM_PORT=5432
TYPEORM_USERNAME=postgres
TYPEORM_PASSWORD=postgres
TYPEORM_DATABASE=boilerplate_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Supabase (optional - for social login and file upload)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_BUCKET=uploads
```

### Docker

`docker-compose.yml` provides PostgreSQL, MySQL, MongoDB, and Redis for local development.

```bash
docker-compose up -d postgres redis
```

---

## API Testing Guide (cURL)

Base URL: `http://localhost:3000/v1`

### 1. Health Check

```bash
# Check application health (no auth required)
curl -X GET http://localhost:3000/v1/health-check
```

### 2. User Registration

```bash
# Create a new user (no auth required)
curl -X POST http://localhost:3000/v1/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com",
    "password": "SenhaSegura@123",
    "name": "João Silva"
  }'
```

### 3. Authentication

```bash
# Login - get access token and refresh token
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com",
    "password": "SenhaSegura@123"
  }'

# Save the tokens from response:
# export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIs..."
# export REFRESH_TOKEN="a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Refresh access token
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }'

# Logout (invalidate tokens)
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Logout from all devices
curl -X POST http://localhost:3000/v1/auth/logout-all \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4. Password Recovery

```bash
# Request password reset (sends email)
curl -X POST http://localhost:3000/v1/auth/password/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com"
  }'

# Confirm password reset (use token from email/response)
curl -X POST http://localhost:3000/v1/auth/password/confirm-reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-here",
    "newPassword": "NovaSenha@456"
  }'
```

### 5. User Management

```bash
# Get current user profile
curl -X GET http://localhost:3000/v1/user/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Update current user
curl -X PUT http://localhost:3000/v1/user/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Atualizado"
  }'

# Get user by ID
curl -X GET http://localhost:3000/v1/user/{userId}

# List all users (with pagination)
curl -X GET "http://localhost:3000/v1/user?take=10&skip=0&search=joao&sort=createdAt&order=DESC"

# Update user by ID (admin only)
curl -X PUT http://localhost:3000/v1/user/{userId} \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Nome",
    "userType": "admin"
  }'

# Delete current user account
curl -X DELETE http://localhost:3000/v1/user/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Delete user by ID (admin only)
curl -X DELETE http://localhost:3000/v1/user/{userId} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 6. Feature Flags

```bash
# Check if a feature flag is enabled for current user
curl -X GET http://localhost:3000/v1/feature-flags/check/new_dashboard \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get all feature flags status for current user
curl -X GET http://localhost:3000/v1/feature-flags/check \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# List all feature flags (admin/global only)
curl -X GET "http://localhost:3000/v1/feature-flags?take=20&skip=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get feature flag by ID (admin/global only)
curl -X GET http://localhost:3000/v1/feature-flags/{id} \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Create feature flag (admin only)
curl -X POST http://localhost:3000/v1/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "new_feature",
    "name": "Nova Funcionalidade",
    "description": "Descrição da nova funcionalidade",
    "enabled": false,
    "rolloutPercentage": 50,
    "allowedUserTypes": ["admin", "global"]
  }'

# Update feature flag (admin only)
curl -X PUT http://localhost:3000/v1/feature-flags/{id} \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "rolloutPercentage": 100
  }'

# Toggle feature flag on/off (admin only)
curl -X POST http://localhost:3000/v1/feature-flags/{id}/toggle \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Delete feature flag (admin only)
curl -X DELETE http://localhost:3000/v1/feature-flags/{id} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 7. File Upload (requires Supabase configuration)

```bash
# Upload single file
curl -X POST http://localhost:3000/v1/files/upload?folder=avatars \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg"

# Upload multiple files (max 10)
curl -X POST http://localhost:3000/v1/files/upload/multiple?folder=documents \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.pdf"

# List user files
curl -X GET "http://localhost:3000/v1/files?take=10&skip=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get file by ID
curl -X GET http://localhost:3000/v1/files/{fileId} \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get signed URL (temporary access)
curl -X GET "http://localhost:3000/v1/files/{fileId}/signed-url?expiresIn=3600" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Delete file
curl -X DELETE http://localhost:3000/v1/files/{fileId} \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 8. Audit Log (admin/global only)

```bash
# List audit logs with filters
curl -X GET "http://localhost:3000/v1/audit-log?take=20&skip=0&entityName=User&action=UPDATE" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get entity change history
curl -X GET http://localhost:3000/v1/audit-log/entity/User/{entityId} \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get user activity
curl -X GET "http://localhost:3000/v1/audit-log/user/{userId}?take=50" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Quick Start Test Script

```bash
#!/bin/bash
# Complete API test flow

BASE_URL="http://localhost:3000/v1"

echo "1. Health Check..."
curl -s $BASE_URL/health-check | jq

echo -e "\n2. Creating user..."
USER_RESPONSE=$(curl -s -X POST $BASE_URL/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@email.com",
    "password": "Test@123456",
    "name": "Test User"
  }')
echo $USER_RESPONSE | jq

USER_ID=$(echo $USER_RESPONSE | jq -r '.id')
USER_EMAIL=$(echo $USER_RESPONSE | jq -r '.email')

echo -e "\n3. Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"Test@123456\"
  }")
echo $LOGIN_RESPONSE | jq

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refreshToken')

echo -e "\n4. Get current user profile..."
curl -s $BASE_URL/user/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

echo -e "\n5. Update user profile..."
curl -s -X PUT $BASE_URL/user/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Test User"}' | jq

echo -e "\n6. List all users..."
curl -s "$BASE_URL/user?take=5" | jq

echo -e "\n7. Refresh token..."
curl -s -X POST $BASE_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq

echo -e "\n8. Check feature flags..."
curl -s $BASE_URL/feature-flags/check \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

echo -e "\n9. Logout..."
curl -s -X POST $BASE_URL/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

echo -e "\nTests completed!"
```

Save as `test-api.sh` and run with `bash test-api.sh` (requires `jq` for JSON formatting).
