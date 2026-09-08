# Employee Leave Management API

A REST API for managing employees and leave requests with JWT authentication and role-based authorization.

Built using **Node.js**, **Express.js**, **PostgreSQL**, **Prisma ORM**, and **Zod**.

---

## Features

- Employee registration and login
- JWT-based authentication
- Employee and HR roles
- Role-based access control
- Secure password hashing with bcrypt
- Create and manage leave requests
- HR approval/rejection of leaves
- Filter leaves by employee and status
- Approved leave summary
- Input validation using Zod
- Centralized error handling
- PostgreSQL database with Prisma ORM

---

## Tech Stack

| Technology | Purpose                   |
| ---------- | ------------------------- |
| Node.js    | Runtime                   |
| Express.js | REST API                  |
| PostgreSQL | Database                  |
| Prisma     | ORM & migrations          |
| Zod        | Input validation          |
| JWT        | Authentication            |
| bcryptjs   | Password hashing          |
| dotenv     | Environment configuration |

---

## Project Structure

```
employee-leave-api/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── validators/
│   ├── middleware/
│   ├── models/
│   ├── app.js
│   └── server.js
│
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL 13+

### Installation

1. **Clone the repository and navigate to the project directory:**

   ```bash
   git clone <repository-url>
   cd employee-leave-api
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create the environment file:**

   ```bash
   cp .env.example .env
   ```

4. **Configure the environment variables:**

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/leave_management?schema=public"
   PORT=3000
   JWT_SECRET="your_long_random_secret"
   JWT_EXPIRES_IN="30d"
   ```

5. **Create the database:**

   ```bash
   psql -U postgres -c "CREATE DATABASE leave_management;"
   ```

6. **Run Prisma migrations:**

   ```bash
   npm run prisma:migrate
   ```

7. **Start the development server:**

   ```bash
   npm run dev
   ```

The API will be available at:

```
http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint                       | Access        | Description                 |
| ------ | ------------------------------ | ------------- | --------------------------- |
| POST   | `/employees`                   | Public        | Register employee           |
| POST   | `/auth/login`                  | Public        | Login and receive JWT       |
| POST   | `/leaves`                      | Employee      | Create leave request        |
| GET    | `/leaves`                      | Employee / HR | View leave requests         |
| PATCH  | `/leaves/:id/status`           | HR            | Approve or reject leave     |
| GET    | `/leaves/summary/:employee_id` | Employee / HR | View approved leave summary |
| GET    | `/health`                      | Public        | Health check                |

---

## Authentication

Protected endpoints require a JWT Bearer token:

```
Authorization: Bearer <JWT_TOKEN>
```

### Roles

| Role     | Permissions                                 |
| -------- | ------------------------------------------- |
| Employee | Create and view own leave requests          |
| HR       | View all leaves and approve/reject requests |

> Employees cannot access another employee's leave data.

---

## API Examples

### Login

```http
POST /auth/login
```

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

### Create Leave

```http
POST /leaves
Authorization: Bearer <JWT_TOKEN>
```

```json
{
  "employee_id": 1,
  "leave_type": "casual",
  "from_date": "2026-09-10",
  "to_date": "2026-09-12"
}
```

> New leave requests are created with the `pending` status.
> Only HR can change the status to `approved` or `rejected`.

---

## Leave Status

| Status   | Description          |
| -------- | -------------------- |
| pending  | Awaiting HR decision |
| approved | Leave approved       |
| rejected | Leave rejected       |

---

## HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Validation error      |
| 401  | Authentication failed |
| 403  | Access denied         |
| 404  | Resource not found    |
| 409  | Duplicate resource    |
| 500  | Server error          |

---

## Health Check

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "ok",
  "message": "Employee Leave Management API is running"
}
```
