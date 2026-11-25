# CampusHire – Deployment Guide (Phase 5)

## Overview
This guide walks you through deploying the **CampusHire** backend on **Render** and the frontend on **Vercel**, configuring the required environment variables, and verifying that the live system works correctly.

---

## 1️⃣ Prerequisites
- GitHub repository containing the project.
- **Node ≥ 20** (Render provides its own runtime; Vercel uses the version from `package.json`).
- A free **MongoDB Atlas** cluster (M0 tier).
- A Gmail account (optional – for real email delivery; development uses Ethereal).

---

## 2️⃣ MongoDB Atlas Setup
1. Create a free cluster in the Atlas UI.
2. **Network Access** – add IP `0.0.0.0/0` (Render free tier has no static IPs).
3. **Database Access** – create a database user (e.g., `campushire_user`).
4. Copy the connection string, e.g.:
   ```
   mongodb+srv://campushire_user:<password>@cluster0.xxx.mongodb.net/campus_hire?retryWrites=true&w=majority
   ```
5. Store this URI as `MONGODB_URI` in the backend environment.

---

## 3️⃣ Backend – Render
1. **Create a new Web Service** on Render.
2. **Repository** – select the GitHub repo.
3. **Root Directory** – `server`.
4. **Build Command** – `npm install` (the backend has no build step).
5. **Start Command** – `npm start`.
6. **Health Check Path** – `/api/health`.
7. **Environment Variables** (add each, `sync: false` – no secret values are hard‑coded in `render.yaml`):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_URL`   *(no trailing slash, e.g. `https://campushire-frontend.vercel.app`)*
   - `OFFICER_EMAIL`
   - `OFFICER_PASSWORD`
   - `OFFICER_NAME` (optional)
8. **Deploy** – Render will install dependencies and start the service.
9. **Seeding the database** – because the free tier provides no shell, run the seed script **locally**:
   ```bash
   # Ensure MONGODB_URI points to the Atlas cluster
   export MONGODB_URI="your-atlas-uri"
   npm run seed   # normal run – preserves existing collections
   # If you want to wipe everything first:
   npm run seed -- --reset
   ```
   The script prints the database name it is connected to and a credentials table.
10. **Update `CLIENT_URL`** (if it changed) – edit the Render env var, then trigger a redeploy.

---

## 4️⃣ Frontend – Vercel
1. In the Vercel dashboard, click **New Project** → import the same GitHub repo.
2. **Root Directory** – `client`.
3. **Framework Preset** – `React` (Vite).
4. **Build Command** – `npm install && npm run build`.
5. **Output Directory** – `dist`.
6. **Environment Variables** – only:
   - `VITE_API_BASE_URL` – set to the Render service URL plus `/api`, e.g. `https://campushire-backend.onrender.com/api`.
   > **Note:** `CLIENT_URL` is *not* needed on Vercel because CORS is enforced solely by the backend.
7. Deploy – Vercel will build and serve the SPA. The `client/vercel.json` file ensures any deep‑link URL rewrites to `/index.html`.

---

## 5️⃣ Deployment Order & Final Configuration
1. **Deploy Render first** (backend). Verify the health endpoint works.
2. **Deploy Vercel** (frontend).
3. **Set `CLIENT_URL`** on Render **without a trailing slash** (e.g. `https://campushire-frontend.vercel.app`).
4. **Redeploy Render** to pick up the updated `CLIENT_URL` (click *Manual Deploy*).

---

## 6️⃣ Verification Checklist
- [ ] **Health Check** – `GET https://<render‑service>.onrender.com/api/health` returns `200` with `server: Running`.
- [ ] **Register & Login** – Officer, recruiter, and student accounts (from the seed script) can log in.
- [ ] **Resume Upload** – Student can upload a PDF; it is stored in GridFS and previewable with authentication.
- [ ] **Job Browsing** – Student sees only `status=open` jobs with future deadlines.
- [ ] **Application Flow** – Student applies, officer/recruiter see eligibility snapshot, status updates work.
- [ ] **Officer Deactivation** – Deactivating a recruiter immediately invalidates their JWT (redirect to login).
- [ ] **403 on Officer Status Patch** – Officer receives `403` when trying to PATCH `/api/applications/:id/status`.
- [ ] **Uptime Monitoring** – Add an **UptimeRobot** monitor for `https://<render‑service>.onrender.com/api/health` (5‑minute checks) to keep the free tier instance warm during demos.

---

## 7️⃣ Notes on Render Free‑Tier Cold Starts
Render’s free tier spins down after periods of inactivity. The first request after a sleep incurs a noticeable latency. To mitigate this during a live demo:
- Keep the UptimeRobot monitor (or any external ping service) hitting `/api/health` every 5 minutes.
- Optionally, run a small script locally that curls the health endpoint a minute before the demo.

---

**All steps are zero‑cost (free tier services only).** When you’re ready, let me know if any part needs tweaking before you push to production.

