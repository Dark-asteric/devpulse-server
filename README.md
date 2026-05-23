# DevPulse API

> A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

---

## Features

- JWT access & refresh token authentication
- Role-based access control — `contributor` and `maintainer`
- Create, read, update, and delete bug reports and feature requests
- Filter issues by `type` and `status`, sort by `newest` or `oldest`
- Reporter details embedded in responses without SQL JOINs
- System metrics dashboard for maintainers
- Strict TypeScript — no `any` types
- Raw SQL with `pg` pool — no ORM, no query builder

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24.x LTS |
| Language | TypeScript 6.x |
| Framework | Express.js |
| Database | PostgreSQL (NeonDB / Supabase / ElephantSQL) |
| DB Driver | `pg` — native driver, raw SQL only |
| Auth | `jsonwebtoken` + `bcrypt` |
| Deployment | Vercel / Render / Railway |

---

## Setup

### Prerequisites

- Node.js 24.x or higher
- A PostgreSQL database (NeonDB recommended)

### 1. Clone the repository

```bash
git clone https://github.com/Dark-asteric/devpulse-server.git
cd devpulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Open `.env` and fill in your values:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/devpulse

JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
```

### 4. Start the server

```bash
# Development — hot reload
npm run dev

# Production build
npm run build
npm start
```

> The database schema (tables) is created automatically on first startup. No manual migration needed.

---

## API Endpoints

### Base URL

```
https://devpulse-api.vercel.app
```

### Authorization Header

All protected routes require:

```
Authorization: <access_token>
```

---

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Login and receive access + refresh tokens |
| `POST` | `/api/auth/refresh` | Public | Get a new access token using refresh token |

#### POST `/api/auth/signup`

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john.doe@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

**Response `201`**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "role": "contributor",
    "created_at": "2026-01-20T09:00:00Z",
    "updated_at": "2026-01-20T09:00:00Z"
  }
}
```

---

#### POST `/api/auth/login`

**Request Body**
```json
{
  "email": "john.doe@devpulse.com",
  "password": "securePassword123"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@devpulse.com",
      "role": "contributor"
    }
  }
}
```

---

#### POST `/api/auth/refresh`

**Request Body**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Access token refreshed.",
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

---

### Issues

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/issues` | Public | Get all issues with optional filters |
| `GET` | `/api/issues/:id` | Public | Get a single issue by ID |
| `POST` | `/api/issues` | Authenticated | Create a new issue |
| `PATCH` | `/api/issues/:id` | Authenticated | Update an issue |
| `DELETE` | `/api/issues/:id` | Maintainer only | Delete an issue |

#### GET `/api/issues`

**Query Parameters**

| Param | Values | Default |
|---|---|---|
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | — |
| `status` | `open`, `in_progress`, `resolved` | — |

**Examples**
```
GET /api/issues
GET /api/issues?sort=oldest
GET /api/issues?type=bug
GET /api/issues?status=open
GET /api/issues?type=bug&status=open&sort=oldest
```

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "title": "Database connection timeout under load",
      "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
      "type": "bug",
      "status": "open",
      "reporter": {
        "id": 1,
        "name": "John Doe",
        "role": "contributor"
      },
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T14:45:00Z"
    }
  ]
}
```

---

#### POST `/api/issues`

**Headers**
```
Authorization: <access_token>
```

**Request Body**
```json
{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
  "type": "bug"
}
```

**Response `201`**
```json
{
  "success": true,
  "message": "Issue created successfully.",
  "data": {
    "id": 45,
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug",
    "status": "open",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T10:30:00Z"
  }
}
```

---

#### PATCH `/api/issues/:id`

**Access Rules**
- **Maintainer** — can update any issue regardless of status
- **Contributor** — can only update their own issues and only if status is `open`

**Headers**
```
Authorization: <access_token>
```

**Request Body** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description with reproduction steps...",
  "type": "bug"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Issue updated successfully.",
  "data": {
    "id": 45,
    "title": "Updated title",
    "description": "Updated description with reproduction steps...",
    "type": "bug",
    "status": "open",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T14:45:00Z"
  }
}
```

---

#### DELETE `/api/issues/:id`

**Headers**
```
Authorization: <access_token>
```

**Response `200`**
```json
{
  "success": true,
  "message": "Issue deleted successfully."
}
```

---

## HTTP Status Codes

| Code | Reason | Usage |
|---|---|---|
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST |
| `400` | Bad Request | Validation errors, invalid input |
| `401` | Unauthorized | Missing, expired, or invalid token |
| `403` | Forbidden | Valid token but insufficient role |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Editing a non-open issue as contributor |
| `500` | Internal Server Error | Unexpected server error |

---

## Database Schema

### `users`

| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | Primary key, auto-increment |
| `name` | `VARCHAR(255)` | NOT NULL |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE |
| `password` | `TEXT` | NOT NULL — bcrypt hash, never returned |
| `role` | `VARCHAR(20)` | `contributor` or `maintainer`, default `contributor` |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |
| `updated_at` | `TIMESTAMPTZ` | Auto-set on insert, refreshed on update |

### `issues`

| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | Primary key, auto-increment |
| `title` | `VARCHAR(150)` | NOT NULL, max 150 characters |
| `description` | `TEXT` | NOT NULL, min 20 characters |
| `type` | `VARCHAR(50)` | `bug` or `feature_request` |
| `status` | `VARCHAR(20)` | `open`, `in_progress`, or `resolved` — default `open` |
| `reporter_id` | `INTEGER` | NOT NULL — references users.id, validated in app logic |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |
| `updated_at` | `TIMESTAMPTZ` | Auto-set on insert, refreshed on update |

---

## Project Structure

```
src/
├── config/
│   ├── index.ts
├──  db/
|   ├── index.ts
├── modules/
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   └── authorize.ts
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.controller.ts
│   │   │   └──login.service.ts
│   │   ├── signup/
│   │   │   ├── signup.controller.ts
│   │   │   ├── signup.interface.ts
│   │   │   └── signup.service.ts
│   ├── issues/
│   │   ├── issues.controller.ts
│   │   ├── issues.interface.ts
│   │   └── issues.service.ts
│   ├── router/
│   │   ├── auth.router.ts
│   │   └── issues.router.ts
│   ├── utils/
│   │   ├── errorHandler.ts
│   │   ├── query.ts
│   │   └── esponse.ts
└── types/
    └── express.d.ts
```

---

## Security Notes

- Passwords are hashed with `bcrypt` at 10 salt rounds — never stored or returned in plaintext
- Access tokens expire in `15m` — short-lived by design
- Refresh tokens expire in `7d` — stored client-side, used only to issue new access tokens
- `JWT_SECRET` and `JWT_REFRESH_SECRET` are intentionally different secrets
- Role verification happens in middleware before any privileged operation
- `reporter_id` is always extracted from the JWT — never from the request body
