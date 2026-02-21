# Postman Collection — Boilerplate NestJS

This folder contains the Postman collection with all API endpoints for the NestJS Boilerplate, organized by module.

---

## How to Import

1. Open **Postman**
2. Click **Import** (top left)
3. Select the file `docs/postman_collection.json`
4. The collection **Boilerplate NestJS** will appear in the sidebar with all 33 requests organized into 6 folders

---

## Collection Variables

After importing, the collection uses three variables that are automatically managed:

| Variable | Default Value | Description |
|---|---|---|
| `baseUrl` | `http://localhost:3000/v1` | API base URL |
| `accessToken` | *(empty)* | JWT access token — filled automatically after login |
| `refreshToken` | *(empty)* | Refresh token — filled automatically after login |

To change `baseUrl` (e.g. for staging), click the collection name → **Variables** tab.

---

## Authentication Flow

1. **Start the application** (`npm run start:dev`)
2. **Run migrations and seeds** (`npm run migration:run && npm run seed`)
3. **Call Login** — use any seed user:

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `Admin@123` | ADMIN |
| `global@example.com` | `Global@123` | GLOBAL |
| `user@example.com` | `User@123` | USER |

4. The `accessToken` and `refreshToken` variables are **saved automatically** by the Login request's test script
5. All authenticated requests use `Bearer {{accessToken}}` in the Authorization header — no manual copying needed

---

## Modules

### Health Check (1 request)
| Method | Name |
|---|---|
| GET | Check Application Health |

### Auth (7 requests)
| Method | Name | Auth |
|---|---|---|
| POST | Login | Public |
| POST | Refresh Token | Public |
| POST | Logout | Required |
| POST | Logout All Devices | Required |
| POST | Request Password Reset | Public |
| POST | Confirm Password Reset | Public |
| POST | Social Login | Public |

### User (8 requests)
| Method | Name | Auth | Role |
|---|---|---|---|
| POST | Create User | Public | — |
| PUT | Update Current User | Required | — |
| PUT | Update User by ID | Required | ADMIN |
| GET | Get Current User | Required | — |
| GET | Get User by ID | Public | — |
| GET | List Users | Public | — |
| DELETE | Delete Current User | Required | — |
| DELETE | Delete User by ID | Required | ADMIN |

### Feature Flags (8 requests)
| Method | Name | Auth | Role |
|---|---|---|---|
| POST | Create Feature Flag | Required | ADMIN |
| POST | Toggle Feature Flag | Required | ADMIN |
| PUT | Update Feature Flag | Required | ADMIN |
| GET | Check Feature Flag by Key | Required | — |
| GET | Check All Feature Flags | Required | — |
| GET | List Feature Flags | Required | ADMIN / GLOBAL |
| GET | Get Feature Flag by ID | Required | ADMIN / GLOBAL |
| DELETE | Delete Feature Flag | Required | ADMIN |

### File Upload (6 requests)
Requires Supabase configured in `.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_BUCKET`).

| Method | Name | Auth |
|---|---|---|
| POST | Upload Single File | Required |
| POST | Upload Multiple Files | Required |
| GET | List User Files | Required |
| GET | Get File by ID | Required |
| GET | Get Signed URL | Required |
| DELETE | Delete File | Required |

### Audit Log (3 requests)
| Method | Name | Auth | Role |
|---|---|---|---|
| GET | List Audit Logs | Required | ADMIN / GLOBAL |
| GET | Get Entity History | Required | ADMIN / GLOBAL |
| GET | Get User Activity | Required | ADMIN / GLOBAL |

---

## Pagination

Endpoints that return lists support the following query parameters:

| Parameter | Default | Description |
|---|---|---|
| `take` | `10` | Number of records per page (max 100) |
| `skip` | `0` | Number of records to skip |
| `search` | — | Text search (name, email) |
| `sort` | `createdAt` | Field to sort by |
| `order` | `DESC` | Sort direction: `ASC` or `DESC` |

---

## Token Renewal

When the access token expires (default: 2 hours), call **Refresh Token** with the stored `refreshToken`. The new `accessToken` is saved automatically.

To revoke all sessions (e.g. after a security incident), call **Logout All Devices**.
