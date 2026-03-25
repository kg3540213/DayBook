# 📓 DayBook

A private, secure journaling app built exclusively for **LPU (Lovely Professional University)** students. Write freely — every entry is AES-256 encrypted in your browser before it ever reaches the server.

---

## ✨ Features

- **📝 Daily Journaling** — Create, edit, and delete journal entries with a title, date, mood, and content
- **🔐 End-to-End Encryption** — Entries are AES-256 encrypted client-side using your password as the key. The server only stores ciphertext — even the developer cannot read your entries
- **😊 Mood Tracking** — Log your mood (Happy, Sad, Angry, Neutral) with every entry and watch patterns emerge over time
- **🤖 AI Mood Detection** — Powered by Gemini 2.0 Flash — paste your entry and let AI detect your mood automatically
- **📊 Analytics Dashboard** — Visual charts for mood trends, writing streaks, weekly and monthly activity
- **🔍 Smart Search** — Search across titles and encrypted content by keyword, mood, or date range
- **🖼️ Profile Photo** — Upload a profile picture stored on Cloudinary; displayed on the home page and navbar
- **📄 Pagination** — Entries page shows 6 entries per page (3 per row) with Prev/Next navigation
- **📖 Shared Journals** — Create shared journals with friends, invite via email, and collaborate on entries
- **👥 Collaborative Entries** — Add entries to shared journals that all participants can view and edit
- **🎓 LPU-Only Access** — Only `@lpu.in` email addresses can register. Invalid domains are rejected instantly on both the frontend and backend
- **✉️ OTP Verification** — Email-based 6-digit OTP sent on signup. Unverified accounts cannot log in
- **🔑 JWT Auth** — Secure `httpOnly` cookie-based JWT authentication with 7-day expiry

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI library |
| React Router v7 | Client-side routing |
| Redux Toolkit + RTK Query | State management & API calls |
| Tailwind CSS v4 + DaisyUI | Styling & component library |
| React Toastify | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Redis | Caching layer |
| JWT + httpOnly Cookies | Authentication |
| Bcrypt | Password & OTP hashing |
| Cloudinary | Profile photo storage |
| Nodemailer | OTP email delivery |
| Gemini AI | AI mood detection |

---

## 📁 Project Structure

```
daybook/
├── package.json
├── readme.md
├── backend/
│   └── src/
│       ├── index.js
│       ├── config/
│       │   ├── cache.js
│       │   ├── cloudinary.js
│       │   ├── database.js
│       │   └── redis.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── entryController.js
│       │   ├── sharedJournalController.js
│       │   └── userController.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   └── rateLimiter.js
│       ├── models/
│       │   ├── entryModel.js
│       │   ├── sharedEntryModel.js
│       │   ├── sharedJournalModel.js
│       │   └── userModel.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── entryRoutes.js
│       │   ├── sharedJournalRoutes.js
│       │   └── userRoutes.js
│       ├── services/
│       │   ├── EmailService.js
│       │   └── geminiService.js
│       └── utils/
│           └── generateToken.js
└── frontend/
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.css
        ├── App.jsx
        ├── main.jsx
        ├── assets/
        ├── components/
        │   ├── Footer.jsx
        │   ├── Layout.jsx
        │   ├── Loader.jsx
        │   ├── ModalLayout.jsx
        │   ├── ThemeController.jsx
        │   ├── auth/
        │   │   ├── Logout.jsx
        │   │   ├── Password.jsx
        │   │   └── Profile.jsx
        │   ├── entry/
        │   │   ├── AddEntry.jsx
        │   │   ├── DeleteEntry.jsx
        │   │   ├── EditEntry.jsx
        │   │   ├── EntryCard.jsx
        │   │   └── ReadMore.jsx
        │   ├── navbar/
        │   │   ├── Navbar.jsx
        │   │   ├── NavLinks.jsx
        │   │   ├── NavProfile.jsx
        │   │   └── SearchBox.jsx
        │   └── shared/
        │       ├── AddSharedEntry.jsx
        │       ├── CreateSharedJournal.jsx
        │       ├── SharedEntryCard.jsx
        │       └── SharedJournalCard.jsx
        ├── pages/
        │   ├── About.jsx
        │   ├── Analytics.jsx
        │   ├── Dashboard.jsx
        │   ├── Entries.jsx
        │   ├── Home.jsx
        │   ├── InviteHandler.jsx
        │   ├── Login.jsx
        │   ├── NotFound.jsx
        │   ├── SharedJournalDetail.jsx
        │   ├── SharedJournals.jsx
        │   └── Signup.jsx
        ├── redux/
        │   ├── store.js
        │   ├── api/
        │   │   ├── apiSlice.js
        │   │   ├── entriesApiSlice.js
        │   │   ├── sharedJournalApiSlice.js
        │   │   └── usersApiSlice.js
        │   └── features/
        │       └── userSlice.js
        └── utils/
            ├── crypto.js
            └── sessionPassword.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- A [Cloudinary](https://cloudinary.com) account (free tier is fine)
- A Gmail account for sending OTP emails (or any SMTP provider)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/daybook.git
cd daybook
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb://localhost:27017/daybook

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Email (OTP delivery)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary (profile photo storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI (mood detection)
GEMINI_API_KEY=your_gemini_api_key
```

> **Gmail tip:** Use an [App Password](https://myaccount.google.com/apppasswords) instead of your real Gmail password — regular passwords won't work with SMTP.

> **Cloudinary:** Get your credentials from [cloudinary.com](https://cloudinary.com) → Dashboard → API Keys.

Start the backend:

```bash
npm run dev
```

---

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

App runs at **http://localhost:5173**

---

## 🔒 Security Design

### Client-side Encryption
Your login password is hashed with SHA-256 in the browser to produce the AES-256 encryption key. Every entry's content is encrypted before the API request is made. The server stores and returns only ciphertext — the plaintext is never transmitted.

### Zero-Knowledge
Even if the database were compromised, all entry content is unreadable without the user's password. The server has no way to decrypt entries.

### OTP Verification
- 6-digit OTPs are generated with `crypto.randomInt` (cryptographically secure)
- Only the bcrypt hash is stored in MongoDB — the raw OTP is never persisted
- OTPs expire after **10 minutes**
- Resend is rate-limited to **once every 60 seconds**

### LPU-Only Registration
- Frontend: domain is checked on every keystroke after `@` — the submit button is disabled for non-`@lpu.in` emails
- Backend: `authController` returns HTTP **403** before any DB operation if the email domain is wrong
- Login also validates the domain

### Auth Cookies
```
httpOnly: true   → not accessible from JavaScript
secure: true     → HTTPS only in production
sameSite: None   → cross-origin (frontend ↔ backend on different ports)
maxAge: 7 days
```

---

## 📸 Profile Photo Upload

Photos are uploaded as base64 data URIs from the browser to the backend, then stored on Cloudinary.

**Flow:**
1. User picks or drags an image in the Profile modal
2. Browser converts it to a base64 data URI (client-side preview shown instantly)
3. On "Upload Photo", the base64 string is sent to `POST /api/users/me/photo`
4. Backend uploads to Cloudinary with a 400×400 face-crop transformation
5. Cloudinary URL and `public_id` are saved in MongoDB
6. URL is returned to the frontend → Redux state updated → avatar updates everywhere instantly

**Limits:** JPG / PNG / WEBP / GIF · max 5 MB

---

## 📄 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register (LPU email only) — sends OTP |
| POST | `/verify-otp` | Verify OTP and activate account |
| POST | `/resend-otp` | Resend OTP (60 s cooldown) |
| POST | `/login` | Login with email + password |
| POST | `/logout` | Clear auth cookie |
| PUT | `/change-password` | Change password (authenticated) |

### Users — `/api/users`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Fetch profile |
| PUT | `/me` | Update name |
| POST | `/me/photo` | Upload profile photo (base64) |
| DELETE | `/me/photo` | Remove profile photo |

### Entries — `/api/entries`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all entries |
| POST | `/` | Create entry |
| GET | `/:id` | Get single entry |
| PUT | `/:id` | Update entry |
| DELETE | `/:id` | Delete entry |
| GET | `/search` | Search entries (mood, date, keyword) |
| POST | `/analyze` | Analyze entry mood with AI |
| GET | `/export` | Export entries (JSON/CSV) |
| GET | `/analytics/mood` | Get mood analytics |
| GET | `/analytics/weekly` | Get weekly activity |
| GET | `/analytics/monthly` | Get monthly activity |
| GET | `/analytics/streak` | Get writing streak |

### Shared Journals — `/api/shared-journals`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get my shared journals |
| POST | `/` | Create shared journal |
| GET | `/:journalId` | Get shared journal details |
| DELETE | `/:journalId` | Delete shared journal |
| POST | `/:journalId/entries` | Add entry to shared journal |
| PATCH | `/entries/:entryId` | Update shared entry |
| DELETE | `/entries/:entryId` | Delete shared entry |
| GET | `/invite/:token` | Get invite information |
| POST | `/invite/:token/accept` | Accept journal invite |
| POST | `/invite/:token/decline` | Decline journal invite |

## 🤝 Contributing & Contact

Built by **Koushik Ghosh** — LPU Student & Full-Stack Developer.

Have a project idea or want to collaborate? Visit the **About** page in the app to send a message directly.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).