# Store Rating App — Deployment Guide

## Architecture

```
store-rating-app/
├── backend/   → Node.js + Express + PostgreSQL (deploy on Render)
└── frontend/  → React + Vite                  (deploy on Vercel)
```

---

## 1. Push to GitHub (Clean, No Secrets)

```powershell
# Run from the project root:
cd c:\Users\Prathmesh\OneDrive\Desktop\rox\store-rating-app
powershell -ExecutionPolicy Bypass -File push-to-github.ps1
```

This script will:
- Remove `.env` files from **all** git history
- Force-push the clean code to GitHub
- Your actual `.env` files stay safe on your local machine

---

## 2. Deploy Backend → Render (Free)

1. Go to https://render.com → **New Web Service**
2. Connect GitHub repo: `prathamesh-korde/store-rating-app`
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. Set **Environment Variables** (copy from `backend/.env`):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DATABASE_URL` | *(your Neon PostgreSQL URL)* |
| `JWT_SECRET` | *(your secret)* |
| `JWT_EXPIRES_IN` | `7d` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `CLIENT_ORIGIN` | *(your Vercel frontend URL — add after deploying frontend)* |
| `CLOUD_NAME` | *(Cloudinary)* |
| `CLOUD_API_KEY` | *(Cloudinary)* |
| `CLOUD_API_SECRET` | *(Cloudinary)* |
| `GROQ_API_KEY` | *(your Groq key)* |

5. Click **Create Web Service**
6. Note your backend URL: `https://store-rating-backend.onrender.com`

---

## 3. Deploy Frontend → Vercel (Free)

1. Go to https://vercel.com → **New Project**
2. Import `prathamesh-korde/store-rating-app`
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Set **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://store-rating-backend.onrender.com/api/v1` |
| `VITE_MAP_TOKEN` | *(your Mapbox public token)* |
| `VITE_GROQ_API_KEY` | *(your Groq API key)* |

5. Click **Deploy**
6. Note your frontend URL: `https://store-rating-app.vercel.app`

---

## 4. Final Step — Update CORS on Render

After Vercel gives you the frontend URL:
1. Go to Render → your backend service → **Environment**
2. Update `CLIENT_ORIGIN` to your Vercel URL
3. Click **Save Changes** → Render will auto-redeploy

---

## 5. Demo Credentials (after seeding)

Run once after backend is live:
```bash
# From backend/ directory on your local machine:
npm run db:seed
```

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@platform.com` | `Admin@12345` |
| Store Owner | `owner1@stores.com` | `Owner1@pass` |
| Consumer | `alice@example.com` | `Alice@1234` |

---

## 6. Local Development

```powershell
# From project root — starts both servers:
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

Requires:
- `backend/.env` — copy from `backend/.env.example` and fill values
- `frontend/.env` — copy from `frontend/.env.example` and fill values
