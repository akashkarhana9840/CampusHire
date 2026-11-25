# CampusHire

CampusHire is a full‑stack web application that provides a placement and internship management portal for colleges and companies. 

- **Client** – React + Vite, Tailwind CSS, role‑based dashboards for **students**, **recruiters**, and **placement officers**.
- **Server** – Node.js/Express API with JWT authentication, MongoDB, rate‑limiting, CORS configuration, and CRUD endpoints for users, jobs, applications, notices, etc.
- **Features**
  - Secure login with role‑based routing.
  - Officer dashboard for approving recruiters and managing users.
  - Recruiter interface to post jobs and view applicants.
  - Student portal to browse jobs, apply, and track applications.

## Getting Started

```bash
# Clone the repo (once it is pushed)
# npm install both client and server
cd client && npm install && npm run dev   # client on http://localhost:5173
cd ../server && npm install && npm run dev # server on http://localhost:5004
```

## Environment Variables

Create a `.env` file in the `server` folder:
```
MONGODB_URI=mongodb://localhost:27017/campushire
JWT_SECRET=your-very-secret-jwt-key
CLIENT_URL=http://localhost:5173
PORT=5004
OFFICER_EMAIL=officer@example.com
OFFICER_PASSWORD=OfficerPass123!
```

## License

MIT License – feel free to fork, modify, and contribute!