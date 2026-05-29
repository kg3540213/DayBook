# 📓 DayBook

A secure, privacy-first journaling platform built for students. Client-side AES encryption keeps entries private before they are sent to the server.

Live demo: https://lpudaybook.onrender.com (may be intermittently available)

---

## ✨ Summary

DayBook provides private journal entries, a public campus feed, AI-assisted mood detection, analytics, and profile management. The project is split into a Node/Express backend and a React + Vite frontend.

---

## 🚧 Quick Start

Prerequisites:
- Node.js v18+
- npm
- MongoDB (local or Atlas)
- Redis (optional for caching/session)
- Cloudinary account (optional for avatars)

Install & run locally:

```bash
# from project root
npm install

# start backend (root script)
npm start

# in another terminal, start frontend
cd frontend
npm install
npm run dev
```

Build for production (root):

```bash
npm run build
npm start
```

---

## 🏗 Repository Layout

- `backend/` — Express app (entry: `backend/src/index.js`) with controllers, models, routes, and services.
- `frontend/` — React + Vite app (entry: `frontend/src/main.jsx`) with components, pages, and utilities.
- `readme.md` — this file

Key folders (frontend): `src/components/`, `src/pages/`, `src/redux/`, `src/utils/`.
Key folders (backend): `src/controllers/`, `src/models/`, `src/routes/`, `src/config/`, `src/services/`.

---

## ⚙️ Environment (Backend)

Create a `.env` file in `backend/` with the values below (example):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/daybook
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_SERVICE_API_KEY=your_email_service_api_key
EMAIL_SERVICE_SENDER=sender@example.com
GEMINI_API_KEY=your_google_gemini_api_key
```

Notes:
- `GEMINI_API_KEY` is used for AI mood detection (optional).
- `FRONTEND_URL` should point to the running frontend during development.

---

## 🔌 Major API Endpoints (overview)

- `POST /api/auth/signup` — register (OTP verification)
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `GET /api/users/profile` — profile
- `GET /api/entries` `POST /api/entries` `PUT /api/entries/:id` `DELETE /api/entries/:id` — CRUD entries
- `GET /api/posts` `POST /api/posts` — public feed posts

Refer to the route files in `backend/src/routes/` for the full list.

---

## 🔐 Security & Privacy

- Client-side AES encryption for journal entries (`frontend/src/utils/crypto.js`).
- Passwords and OTPs hashed with bcrypt.
- JWTs issued by the backend and stored in `httpOnly` cookies.
- Rate limiting middleware protects public endpoints.
- Registration restricted to `@lpu.in` emails.

---

## 🧪 Development Notes

- The backend serves the compiled frontend from `frontend/dist` in production.
- `frontend/src/utils/sessionPassword.js` manages client-side session passwords used for encryption.
- `backend/src/services/geminiService.js` handles integration with Google Gemini for mood suggestions.

---

## 🛠 Scripts (root / frontend)

- Root `npm start` — starts the backend (and in production serves built frontend)
- `npm run build` — builds the frontend into `frontend/dist` (root orchestrates frontend build)
- Frontend `npm run dev` — starts Vite dev server (from `frontend/`)

Check the `package.json` files at project root and `frontend/package.json` for exact script names.

---

## 🤝 Contributing

Contributions welcome. Open issues for feature requests or bugs, and send pull requests for fixes. Please keep changes focused and include tests when possible.

---

If you'd like, I can also:
- add a minimal `README` badge set (build, license)
- create a short `CONTRIBUTING.md` with branch and PR conventions
- update `package.json` `scripts` for a smoother dev experience


