# Employee Leave Management API

A REST API for managing employees and their leave requests, secured with JWT authentication and two roles (`Employee`, `HR`). Built with Node.js, Express, PostgreSQL, and Prisma ORM.

## Description

This API allows you to create employees, submit leave requests, list and filter leave requests, approve or reject leave requests, and view a summary of approved leaves per employee.

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express.js** — web framework
- **PostgreSQL** — relational database
- **Prisma ORM** — database access and migrations
- **Zod** — request input validation
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT signing and verification
- **dotenv** — environment variable loading

## Features

- Create employees with validated input (name, department, email, password, role)
- Passwords stored as bcrypt hashes, never returned in API responses
- JWT login (`/auth/login`) with two roles: `Employee` and `HR`
- Role-based authorization: Employee sees/creates own leaves; HR manages all
- Duplicate email detection (HTTP 409)
- Create leave requests that always start with the `pending` status
- List and filter leave requests by `employee_id` and/or `status`
- Approve or reject a leave request
- Summary of approved leave requests grouped by `leave_type`
- Centralized JSON error handling

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma            # Prisma schema (models, enums, datasource)
│   └── migrations/              # SQL migration files
├── src/
│   ├── app.js                   # Express app (middleware, routes, error handling)
│   ├── server.js                # Server entry point
│   ├── routes/                  # Route definitions
│   ├── controllers/             # Request handlers (thin)
│   ├── services/                # Business and database logic
│   ├── models/                  # Prisma client singleton, shared error class
│   ├── validators/              # Zod validation schemas
│   └── middleware/              # Error handling, JWT auth, role authorization, business-rule guards
├── .env.example                 # Environment variable template (placeholders only)
└── package.json
```

## Prerequisites

- **Node.js** 18 or newer
- **npm**
- **PostgreSQL** 13 or newer, running locally

## Installation

1. Clone the repository and navigate to the project directory.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file from the template:

   ```bash
   cp .env.example .env
   ```

   Then fill in your real values (see [Environment Variables](#environment-variables)).

## PostgreSQL Database Setup

1. Create the database (default name used in this project: `leave_management`):

   ```bash
   psql -U postgres -c "CREATE DATABASE leave_management;"
   ```

2. Make sure the `DATABASE_URL` in `.env` points to this database.

## Environment Variables

| Variable         | Description                              | Example                                                               |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string             | `postgresql://USER:PASSWORD@localhost:5432/leave_management?schema=public` |
| `PORT`           | Port the API listens on (default `3000`) | `3000`                                                             |
| `JWT_SECRET`     | Secret used to sign JSON Web Tokens      | `a_long_random_secret_of_at_least_32_characters`                 |
| `JWT_EXPIRES_IN` | Token expiration (e.g. `15m`, `30d`)     | `30d`                                                            |

The connection string uses placeholders only. Replace `USER` and `PASSWORD` with your own credentials. Set `JWT_SECRET` to a long, random, secret value and `JWT_EXPIRES_IN` to your desired token lifetime.

## Prisma Setup and Migrations

Apply the existing migrations to your database:

```bash
npm run prisma:migrate   # runs `prisma migrate dev`
```

Or use the Prisma CLI directly:

```bash
npx prisma generate      # generate the Prisma Client
npx prisma migrate dev   # apply migrations and regenerate the client
```

## Starting the Server

Start the server:

```bash
npm start
```

Or run in development mode with auto-reload:

```bash
npm run dev
```

The server starts on `PORT` (default `http://localhost:3000`).

## Health Check

Verify the API is running:

```bash
curl http://localhost:3000/health
```

Response `200`:

```json
{
  "status": "ok",
  "message": "Employee Leave Management API is running"
}
```

## API Documentation

### Base URL

```
http://localhost:3000
```

All request and response bodies are JSON.

### Leave Status Values

A leave request has one of three statuses:

| Status     | Meaning                                            |
| ---------- | -------------------------------------------------- |
| `pending`  | Leave request submitted, waiting for a decision    |
| `approved` | Leave request approved                             |
| `rejected` | Leave request rejected                             |

New leave requests are always created with the status `pending`. The status of a leave request can be changed only through the status update endpoint, which accepts `approved` or `rejected` (not `pending`).

### Error Response Format

Validation failures return HTTP `400`:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "A valid email is required" }
  ]
}
```

Business/not-found errors return HTTP `404` or `409`:

```json
{
  "error": "An employee with this email already exists"
}
```

Malformed JSON bodies return HTTP `400` with `{ "error": "Invalid JSON payload" }`. Unmatched routes return HTTP `404` with `{ "error": "Route not found" }`.

---

### Roles and Authorization

The API uses two roles: **Employee** and **HR**.

| Endpoint                           | Method | Auth Required | Employee | HR  |
| ---------------------------------- | ------ | ------------- | -------- | --- |
| `POST /employees`                  | POST   | No            | Open     | Open |
| `POST /auth/login`                 | POST   | No            | Open     | Open |
| `POST /leaves`                     | POST   | Yes           | Own only | —   |
| `GET /leaves`                      | GET    | Yes           | Own only | All |
| `PATCH /leaves/:id/status`         | PATCH  | Yes           | —        | HR only |
| `GET /leaves/summary/:employee_id` | GET    | Yes           | Own only | All |

**Key behaviors:**

- **Employee:** May only submit, list, or summarise their own leave requests. The `employee_id` in the request body or query parameter must match the authenticated user's id; otherwise HTTP `403` is returned.
- **HR:** May list any employee's leave requests and approve/reject them. May view any employee's summary.
- **Public:** `POST /employees` and `POST /auth/login` do not require a token.

**401 vs 403:**

| Code | Meaning |
| ---- | ------- |
| `401` | The request is missing a token, the token is invalid, or it has expired. No valid authentication was presented. |
| `403` | A valid token was presented but the authenticated user lacks the required role or is attempting to access another employee's resources. |

**Authenticated requests:** All protected endpoints require a `Bearer` token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/leaves \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### 1. Create Employee

- **Auth:** None (public)
- **Method:** `POST`
- **URL:** `/employees`
- **Purpose:** Create a new employee. The supplied password is hashed (bcrypt) before being stored and is never returned.
- **Request body:**

  | Field        | Type     | Required | Notes               |
  | ------------ | -------- | -------- | ------------------- |
  | `name`       | string   | Yes      | Non-empty           |
  | `department` | string   | Yes      | Non-empty           |
  | `email`      | string   | Yes      | Valid email format; must be unique |
  | `password`   | string   | Yes      | Minimum 8 characters; stored only as a bcrypt hash |
  | `role`       | string   | No       | `Employee` or `HR`; defaults to `Employee` |

- **Example request:**

  ```bash
  curl -X POST http://localhost:3000/employees \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Alice Smith",
      "department": "Engineering",
      "email": "alice.smith@example.com",
      "password": "secret123",
      "role": "Employee"
    }'
  ```

- **Successful response** — HTTP `201`:

  ```json
  {
    "id": 1,
    "name": "Alice Smith",
    "department": "Engineering",
    "email": "alice.smith@example.com",
    "role": "Employee"
  }
  ```

  The password is never included in the response.

- **Error responses:**
  - `400` — missing required fields, invalid email format, or password shorter than 8 characters
  - `409` — an employee with the same email already exists

---

### 2. Login

- **Auth:** None (public)
- **Method:** `POST`
- **URL:** `/auth/login`
- **Purpose:** Authenticate an employee and return a signed JWT containing the employee `id` and `role`.
- **Request body:**

  | Field      | Type     | Required | Notes            |
  | ---------- | -------- | -------- | ---------------- |
  | `email`    | string   | Yes      | Valid email format |
  | `password` | string   | Yes      | Non-empty        |

- **Example request:**

  ```bash
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "alice.smith@example.com",
      "password": "secret123"
    }'
  ```

- **Successful response** — HTTP `200`:

  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "Alice Smith",
      "department": "Engineering",
      "email": "alice.smith@example.com",
      "role": "Employee"
    }
  }
  ```

  The JWT expires after the time configured via `JWT_EXPIRES_IN`. The password is never included in the response.

- **Error responses:**
  - `400` — invalid email format or missing password
  - `401` — no employee exists with the given email, or the password is incorrect

---

### 3. Create Leave Request

- **Auth:** Required — Employee role only; `employee_id` must match the authenticated user
- **Method:** `POST`
- **URL:** `/leaves`
- **Purpose:** Create a new leave request. The request is stored with status `pending`; the client cannot set or override `status`.
- **Request body:**

  | Field         | Type   | Required | Notes                                        |
  | ------------- | ------ | -------- | -------------------------------------------- |
  | `employee_id` | number | Yes      | Positive integer; must reference an existing employee |
  | `leave_type`  | string | Yes      | Non-empty                                    |
  | `from_date`   | string | Yes      | Valid date in `YYYY-MM-DD` format            |
  | `to_date`     | string | Yes      | Valid date in `YYYY-MM-DD` format; must not be before `from_date` |

- **Example request:**

  ```bash
  curl -X POST http://localhost:3000/leaves \
    -H "Authorization: Bearer <your_jwt_token>" \
    -H "Content-Type: application/json" \
    -d '{
      "employee_id": 1,
      "leave_type": "casual",
      "from_date": "2026-09-10",
      "to_date": "2026-09-12"
    }'
  ```

- **Successful response** — HTTP `201`:

  ```json
  {
    "id": 1,
    "employee_id": 1,
    "leave_type": "casual",
    "from_date": "2026-09-10",
    "to_date": "2026-09-12",
    "status": "pending"
  }
  ```

- **Error responses:**
  - `400` — invalid `employee_id`, empty `leave_type`, invalid dates, `from_date` after `to_date`, or extra fields such as `status`
  - `401` — missing, invalid, or expired token
  - `403` — HR role, or Employee submitting a leave request for a different employee
  - `404` — the referenced employee does not exist

---

### 4. List Leave Requests

- **Auth:** Required — Employee sees own only; HR sees all
- **Method:** `GET`
- **URL:** `/leaves`
- **Purpose:** List leave requests, optionally filtered by employee and/or status.
- **Query parameters (all optional):**

  | Parameter     | Type   | Notes                                            |
  | ------------- | ------ | ------------------------------------------------ |
  | `employee_id` | number | Positive integer; filters by employee            |
  | `status`      | string | One of: `pending`, `approved`, `rejected` |

  With no filters, all leave requests are returned. With both filters, both are applied.

- **Example requests:**

  ```bash
  # All leave requests (HR sees all; Employee sees only their own)
  curl -H "Authorization: Bearer <your_jwt_token>" \
       http://localhost:3000/leaves

  # Filter by employee (Employee must use their own id)
  curl -H "Authorization: Bearer <your_jwt_token>" \
       "http://localhost:3000/leaves?employee_id=1"

  # Filter by status (HR only, or Employee sees own + status)
  curl -H "Authorization: Bearer <your_jwt_token>" \
       "http://localhost:3000/leaves?status=pending"

  # Filter by employee and status
  curl -H "Authorization: Bearer <your_jwt_token>" \
       "http://localhost:3000/leaves?employee_id=1&status=approved"
  ```

- **Successful response** — HTTP `200`:

  ```json
  {
    "count": 2,
    "leaves": [
      {
        "id": 1,
        "employee_id": 1,
        "leave_type": "casual",
        "from_date": "2026-09-10",
        "to_date": "2026-09-12",
        "status": "approved"
      },
      {
        "id": 2,
        "employee_id": 1,
        "leave_type": "sick",
        "from_date": "2026-08-01",
        "to_date": "2026-08-02",
        "status": "pending"
      }
    ]
  }
  ```

- **Error responses:**
  - `400` — invalid `employee_id` (not a positive integer) or invalid `status` (not `pending`/`approved`/`rejected`); unsupported query parameters are also rejected
  - `401` — missing, invalid, or expired token
  - `403` — Employee providing an `employee_id` other than their own

---

### 5. Update Leave Status

- **Auth:** Required — HR role only
- **Method:** `PATCH`
- **URL:** `/leaves/:id/status`
- **Purpose:** Approve or reject an existing leave request.
- **Path parameter:**

  | Parameter | Type   | Notes                       |
  | --------- | ------ | --------------------------- |
  | `id`      | number | Positive integer; the leave request ID |

- **Request body:**

  | Field    | Type   | Required | Notes                                  |
  | -------- | ------ | -------- | -------------------------------------- |
  | `status` | string | Yes      | Exactly `approved` or `rejected`; `pending` is not allowed |

- **Example requests:**

  ```bash
  # Approve
  curl -X PATCH http://localhost:3000/leaves/1/status \
    -H "Authorization: Bearer <your_hr_jwt_token>" \
    -H "Content-Type: application/json" \
    -d '{"status": "approved"}'

  # Reject
  curl -X PATCH http://localhost:3000/leaves/1/status \
    -H "Authorization: Bearer <your_hr_jwt_token>" \
    -H "Content-Type: application/json" \
    -d '{"status": "rejected"}'
  ```

- **Successful response** — HTTP `200`:

  ```json
  {
    "id": 1,
    "employee_id": 1,
    "leave_type": "casual",
    "from_date": "2026-09-10",
    "to_date": "2026-09-12",
    "status": "approved"
  }
  ```

- **Error responses:**
  - `400` — invalid `id`, missing/invalid `status`, or `status` set to `pending`
  - `401` — missing, invalid, or expired token
  - `403` — Employee role (only HR may update status)
  - `404` — no leave request exists with the given `id`

---

### 6. Get Leave Summary

- **Auth:** Required — Employee sees own summary only; HR sees any
- **Method:** `GET`
- **URL:** `/leaves/summary/:employee_id`
- **Purpose:** Summarize the approved leave requests for an employee, grouped by `leave_type`. Pending and rejected requests are excluded. Employees with no approved leaves return an empty summary with `total: 0`.
- **Path parameter:**

  | Parameter     | Type   | Notes                       |
  | ------------- | ------ | --------------------------- |
  | `employee_id` | number | Positive integer; the employee ID |

- **Example request:**

  ```bash
  curl -H "Authorization: Bearer <your_jwt_token>" \
       http://localhost:3000/leaves/summary/1
  ```

- **Successful response** — HTTP `200`:

  ```json
  {
    "employee_id": 1,
    "summary": {
      "casual": 3,
      "sick": 2
    },
    "total": 5
  }
  ```

- **Error responses:**
  - `400` — invalid `employee_id` (not a positive integer)
  - `401` — missing, invalid, or expired token
  - `403` — Employee requesting another employee's summary
  - `404` — no employee exists with the given `employee_id`

---

## Expected HTTP Status Codes

| Status | Meaning                                          |
| ------ | ------------------------------------------------ |
| `200`  | Success (list, status update, summary, login)    |
| `201`  | Resource created (employee, leave request)       |
| `400`  | Invalid input (validation failure, malformed JSON) |
| `401`  | Unauthenticated (invalid or expired token, bad credentials) |
| `403`  | Forbidden (insufficient role)                    |
| `404`  | Resource not found (employee or leave request)   |
| `409`  | Conflict (duplicate employee email)              |
| `500`  | Internal server error                            |