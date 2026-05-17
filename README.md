# StoreRate — Full-Stack Store Rating Platform

A complete, production-ready web application that allows users to discover, rate, and review stores. Built with **Express.js**, **PostgreSQL**, and **React + Vite**.

---

## 🚀 Live Demo

- **Frontend (Vercel)**: [https://store-rating-app-39o2.vercel.app](https://store-rating-app-39o2.vercel.app)
- **Backend (Render)**: [https://store-rating-app-l9nw.onrender.com/health](https://store-rating-app-l9nw.onrender.com/health)

*(Note: The backend is hosted on Render's free tier. It spins down after 15 minutes of inactivity, so the first request may take up to 50 seconds to wake the server up.)*

---

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Backend     | Node.js + Express.js                  |
| Database    | PostgreSQL (raw `pg` driver)          |
| Frontend    | React 18 + Vite                       |
| Auth        | JWT (Bearer Token in Session Storage) |
| Styling     | Tailwind CSS v3 + Custom CSS          |
| Validation  | Joi (backend) + Zod + React Hook Form |
| HTTP Client | Axios with interceptors               |

---

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v14 or higher (running locally or remote)
- **npm** v9 or higher

---

## Step-by-Step Local Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd store-rating-app
```

### 2. Setup the Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set your DATABASE_URL and JWT_SECRET
npm install
```

### 3. Create the PostgreSQL Database

```bash
# Log into psql and create the database
psql -U postgres -c "CREATE DATABASE store_rating_db;"
```

### 4. Run Database Migrations

```bash
# From the backend directory:
psql $DATABASE_URL -f migrations/001_init.sql

# Or on Windows:
psql "postgresql://postgres:password@localhost:5432/store_rating_db" -f migrations/001_init.sql
```

### 5. Seed Sample Data

```bash
npm run db:seed
```

This will insert all sample users, stores, and ratings and print credentials to console.

### 6. Start the Backend

```bash
npm run dev
# Runs on http://localhost:5000
```

### 7. Setup the Frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Seed Credentials

| Role         | Email                  | Password      |
|--------------|------------------------|---------------|
| Admin        | admin@platform.com     | Admin@12345   |
| Store Owner 1 | owner1@stores.com     | Owner1@pass   |
| Store Owner 2 | owner2@stores.com     | Owner2@pass   |
| Store Owner 3 | owner3@stores.com     | Owner3@pass   |
| Normal User 1 | alice@example.com     | Alice@1234    |
| Normal User 2 | bob@example.com       | Bob@12345     |
| Normal User 3 | carol@example.com     | Carol@123     |
| Normal User 4 | david@example.com     | David@123     |
| Normal User 5 | emma@example.com      | Emma@1234     |

---

## API Route Summary

All routes prefixed with `/api/v1`.

### Auth (`/auth`)
| Method | Path      | Access | Description                  |
|--------|-----------|--------|------------------------------|
| POST   | /register | Public | Normal user self-registration|
| POST   | /login    | Public | All roles; returns JWT       |
| POST   | /logout   | Auth   | Clears httpOnly cookie       |
| PATCH  | /password | Auth   | Change own password          |

### Admin (`/admin`) — admin role only
| Method | Path          | Description                              |
|--------|---------------|------------------------------------------|
| GET    | /dashboard    | Total users, stores, ratings             |
| GET    | /users        | List users (filter + sort + pagination)  |
| POST   | /users        | Create user (any role)                   |
| GET    | /users/:id    | User detail (with avg rating if owner)   |
| GET    | /stores       | List stores (filter + sort + pagination) |
| POST   | /stores       | Create new store                         |

### Stores (`/stores`) — user role only
| Method | Path | Description                                       |
|--------|------|---------------------------------------------------|
| GET    | /    | All stores with avg rating + user's own rating    |

### Ratings (`/ratings`) — user role only
| Method | Path  | Description           |
|--------|-------|-----------------------|
| POST   | /     | Submit rating         |
| PATCH  | /:id  | Update existing rating|

### Owner (`/owner`) — owner role only
| Method | Path       | Description                         |
|--------|------------|-------------------------------------|
| GET    | /dashboard | Avg rating + list of raters         |

---

## Role Access Matrix

| Feature                        | Admin | User | Owner |
|--------------------------------|:-----:|:----:|:-----:|
| Dashboard stats                | ✅    | ❌   | ❌    |
| Add users / stores             | ✅    | ❌   | ❌    |
| View all users list            | ✅    | ❌   | ❌    |
| View all stores list           | ✅    | ✅   | ❌    |
| Rate / edit store ratings      | ❌    | ✅   | ❌    |
| View own store's ratings       | ❌    | ❌   | ✅    |
| Change own password            | ✅    | ✅   | ✅    |

---

## Folder Structure

```
store-rating-app/
├── backend/
│   ├── migrations/         # SQL schema
│   ├── seeds/              # Seed script
│   └── src/
│       ├── config/         # DB pool + env loader
│       ├── middleware/     # Auth, role guard, error handler
│       └── modules/        # auth / users / stores / ratings
└── frontend/
    └── src/
        ├── api/            # Axios API modules
        ├── components/     # Shared UI components
        ├── context/        # Auth context
        ├── hooks/          # Custom hooks
        ├── layouts/        # Role-based page shells
        ├── pages/          # Auth, Admin, User, Owner pages
        └── utils/          # Validators + formatters
```

---

## Validation Rules

| Field    | Rules                                            |
|----------|--------------------------------------------------|
| Name     | 20–60 characters, required                       |
| Email    | Valid RFC email, unique                          |
| Password | 8–16 chars, ≥1 uppercase, ≥1 special char       |
| Address  | Max 400 chars, optional                          |
| Rating   | Integer 1–5                                      |

---

## Security

- Passwords hashed with bcryptjs (12 salt rounds)
- JWT passed via Authorization Header as Bearer token (supports cross-domain deployments)
- Parameterised SQL queries throughout (no string concatenation)
- Helmet.js security headers
- Dynamic CORS restricted to trusted frontend origins
- Rate limiting: 50 login requests per 15 minutes per IP
