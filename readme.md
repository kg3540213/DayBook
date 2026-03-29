# 📓 DayBook

A private, secure journaling app built exclusively for **LPU (Lovely Professional University)** students. Write freely — every entry is AES-256 encrypted in your browser before it ever reaches the server.

---

## ✨ Features

- **📝 Daily Journaling** — Create, edit, and delete journal entries with title, date, mood, and rich-text content
- **🎨 Rich Text Editor** — Write with formatting: bold, italic, underline, lists, quotes, and more
- **🏷️ Smart Tags** — Add up to 10 tags per entry (max 30 chars each) for better organization and filtering
- **📌 Pin Entries** — Pin important entries to keep them at the top of your journal
- **✨ Entry Templates** — Use pre-defined templates to jumpstart your writing (available templates show on create)
- **🔐 End-to-End Encryption** — Entries are AES-256 encrypted client-side using your password as the key. The server only stores ciphertext — even the developer cannot read your entries
- **😊 Mood Tracking** — Log your mood (😊 Happy, 😔 Sad, 😡 Angry, 😐 Neutral) with every entry and watch patterns emerge over time
- **🤖 AI Mood Detection** — Powered by Gemini 2.0 Flash — paste your entry and let AI detect your mood automatically
- **📊 Analytics Dashboard** — Visual charts for mood distribution, writing streaks, weekly/monthly activity, and mood patterns
- **📅 Calendar View** — See your entries on an interactive calendar with mood indicators
- **🔍 Advanced Search** — Filter by keyword, mood, date range, tags, or pinned status
- **🖼️ Profile Photo** — Upload a profile picture stored on Cloudinary; displayed on home page and navbar
- **📄 Pagination** — Entries page shows 6 entries per page with Prev/Next navigation
- **💾 Export Entries** — Export all entries as JSON or CSV for backup
- **🎓 LPU-Only Access** — Only `@lpu.in` email addresses can register. Invalid domains are rejected on frontend & backend
- **✉️ OTP Verification** — Email-based 6-digit OTP sent on signup. Unverified accounts cannot log in
- **🔑 JWT Auth** — Secure `httpOnly` cookie-based JWT authentication with 7-day expiry
- **🌙 Dark/Light Theme** — Toggle between dark and light themes with preference persistence

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
│       │   └── userController.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   └── rateLimiter.js
│       ├── models/
│       │   ├── entryModel.js
│       │   └── userModel.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── entryRoutes.js
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
    ├── .env
    ├── public/
    └── src/
        ├── App.jsx
        ├── App.css
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
        │   │   ├── EntryTemplates.jsx
        │   │   ├── ReadMore.jsx
        │   │   ├── RichTextEditor.jsx
        │   │   └── TagInput.jsx
        │   └── navbar/
        │       ├── Navbar.jsx
        │       ├── NavLinks.jsx
        │       ├── NavProfile.jsx
        │       └── SearchBox.jsx
        ├── pages/
        │   ├── About.jsx
        │   ├── Analytics.jsx
        │   ├── CalendarView.jsx
        │   ├── Dashboard.jsx
        │   ├── Entries.jsx
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── NotFound.jsx
        │   └── Signup.jsx
        ├── hooks/
        │   └── useSemanticSearch.js
        ├── redux/
        │   ├── store.js
        │   ├── api/
        │   │   ├── apiSlice.js
        │   │   ├── entriesApiSlice.js
        │   │   └── usersApiSlice.js
        │   └── features/
        │       └── userSlice.js
        └── utils/
            ├── crypto.js
            ├── semanticSearch.js
            ├── sessionPassword.js
            └── crypto.js
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
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/daybook

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Email (Brevo for OTP delivery)
BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_verified_sender@yourdomain.com

# Cloudinary (profile photo storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI (mood detection & semantic search)
GEMINI_API_KEY=your_gemini_api_key
```

> **Brevo setup:** Get your API key from [brevo.com](https://brevo.com) → SMTP & API → API Keys. The EMAIL_USER should be a verified sender email in your Brevo account.

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
VITE_BACKEND_URL=http://localhost:3001
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> **Note:** The `VITE_GEMINI_API_KEY` is exposed in the browser (visible in DevTools) but only risks Gemini quota abuse — your entry plaintext is never compromised since encryption/decryption happens 100% client-side.

Start the frontend:

```bash
npm run dev
```

App runs at **http://localhost:5173**

---

## 📚 Quick Reference

### Common Commands

**Backend**
```bash
npm run dev              # Start dev server with nodemon
npm run start            # Start production server
npm run build            # Build (if applicable)
```

**Frontend**
```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production (dist/)
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
```

### Environment Variables Checklist

**Backend (.env)**
- [ ] `MONGO_URI` — MongoDB connection string
- [ ] `REDIS_URL` — Redis connection string
- [ ] `JWT_SECRET` — Strong random string (32+ chars)
- [ ] `BREVO_API_KEY` — Brevo SMTP API key
- [ ] `EMAIL_USER` — Verified sender email (Brevo)
- [ ] `CLOUDINARY_*` — Cloudinary API credentials
- [ ] `GEMINI_API_KEY` — Google Gemini API key

**Frontend (.env)**
- [ ] `VITE_BACKEND_URL` — Backend URL (e.g., `http://localhost:3001`)
- [ ] `VITE_GEMINI_API_KEY` — Google Gemini API key

### Useful Debugging Tips

**Check for Decryption Issues**
```javascript
// Open browser DevTools Console and run:
console.log(localStorage.getItem('_persist:user')); // See Redux state
```

**Clear All Data**
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then reload the page
```

**Monitor API Calls**
- Open DevTools → Network tab
- Check request/response headers and body
- Look for 401 (auth) or 403 (permission) errors

**Check Server Logs**
- Backend: Look for console output when running `npm run dev`
- Frontend: Check browser DevTools Console tab

---

## � Entry Features & Data Model

### Entry Fields
Each journal entry consists of:
- **Title** — Up to 20 characters
- **Date** — Entry date (separate from creation date)
- **Mood** — One of: 😊 Happy, 😔 Sad, 😡 Angry, 😐 Neutral
- **Content** — Encrypted entry text; supports plain text or HTML (rich formatting)
- **Tags** — Up to 10 free-form tags; max 30 chars each (lowercase, deduplicated)
- **isPinned** — Boolean flag to keep important entries at the top
- **ContentFormat** — `"plain"` for plain text, `"html"` for rich text
- **TemplateUsed** — Track which template (if any) was used to create the entry
- **Timestamps** — `createdAt` and `updatedAt` (server-set)

### Encryption Details
- Content is encrypted with **AES-256** using SHA-256 hash of user's password
- Encryption happens in the browser before any network request
- Server stores only ciphertext; plaintext never transmitted
- On fetch, entries return ciphertext; browser decrypts using user's password from Redux state
- Decryption is seamless — happens automatically when entries are fetched

### Indexing & Performance
Database indexes optimize queries:
| Index | Fields | Purpose |
|-------|--------|---------|
| text | title, content | Full-text search (title weighted 2×) |
| filter | createdBy, date, mood | Fast filtering by user + date + mood |
| tags | createdBy, tags | Fast tag-based queries |
| pinned | createdBy, isPinned, date | Show pinned entries first |

---

---

## 🎨 Frontend Components & Features

### Entry Components
- **RichTextEditor.jsx** — WYSIWYG editor with formatting toolbar (bold, italic, lists, quotes, etc.)
- **TagInput.jsx** — Multi-tag input with auto-complete and duplicate prevention
- **EntryTemplates.jsx** — Pre-built entry templates (gratitude, reflection, goal-setting, etc.)
- **EntryCard.jsx** — Card component showing mood, title, date, tags, and preview
- **ReadMore.jsx** — Expandable entry preview with "Read More" functionality
- **AddEntry.jsx** — Modal for creating new entries with all fields
- **EditEntry.jsx** — Modal for updating existing entries
- **DeleteEntry.jsx** — Confirmation dialog for entry deletion

### Pages
- **Dashboard.jsx** — Home page with user greeting, recent entries, quick stats
- **Entries.jsx** — Main entries list with advanced filtering, pagination, and search
- **Analytics.jsx** — Visual dashboard with mood charts, streaks, trends, and insights
- **CalendarView.jsx** — Interactive calendar showing entries per day with mood indicators
- **Profile.jsx** — User profile management (name, password change, photo upload)

### Navigation & Search
- **Navbar.jsx** — Top navigation with user avatar, theme toggle, and quick actions
- **SearchBox.jsx** — Advanced search modal with Classic and AI tabs
  - **Classic tab:** Keyword + mood + date range + tag filters
  - **AI tab:** Natural language semantic search powered by Gemini (client-side)

### Theme & UI
- **ThemeController.jsx** — Dark/Light theme toggle with localStorage persistence
- **ModalLayout.jsx** — Reusable modal wrapper
- **Loader.jsx** — Loading skeleton/spinner component
- **Footer.jsx** — Footer with links and information

---

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
| GET | `/` | Fetch all entries (high limit for client-side filtering) |
| POST | `/` | Create a new entry with title, mood, content, tags, template |
| GET | `/:id` | Fetch a single entry by ID |
| PATCH | `/:id` | Update entry (title, mood, content, tags) |
| DELETE | `/:id` | Delete entry by ID |
| PATCH | `/:id/pin` | Toggle pin status on entry |
| GET | `/search` | Search entries by text, mood, mood, date range, tags, or pinned |
| GET | `/tags` | Get all unique tags used by the user |
| GET | `/calendar` | Get calendar data (entries grouped by date with mood summary) |
| POST | `/analyze` | AI analyze entry mood (Gemini: "what mood is this?") |
| GET | `/export` | Export all entries as JSON or CSV |
| GET | `/analytics/mood` | Get mood distribution (pie chart data) |
| GET | `/analytics/weekly` | Get weekly entry count (last N weeks) |
| GET | `/analytics/monthly` | Get monthly entry count (last N months) |
| GET | `/analytics/streak` | Get current writing streak and stats |

---

## 🛠️ Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- Verify `MONGO_URI` is correct and your IP is whitelisted in MongoDB Atlas
- If using local MongoDB, ensure it's running: `mongod`

**Redis Connection Error**
- Verify `REDIS_URL` is correct
- For Upstash Redis, use the connection string format: `redis://default:password@host:port`

**Gemini API Error**
- Verify `GEMINI_API_KEY` is correct and the API is enabled in Google Cloud Console
- Check API rate limits if errors occur

**Email/OTP Not Sending**
- Verify `BREVO_API_KEY` is correct
- Ensure `EMAIL_USER` is a verified sender in your Brevo account
- Check spam folder for test OTP emails

### Frontend Issues

**"VITE_GEMINI_API_KEY is not configured"**
- Create `.env` in `frontend/` folder with `VITE_GEMINI_API_KEY=...`
- Restart dev server: `npm run dev`

**Entries Show as Empty/Encrypted**
- Ensure you're logged in with correct password
- If you skipped/forgot password, log out and log back in
- Check browser console for decryption errors

**Uploads Not Working**
- Verify Cloudinary credentials in backend `.env`
- Ensure image is <5MB and in supported format (JPG/PNG/WEBP/GIF)

**Search/Analytics Not Loading**
- Check network tab in DevTools for API errors
- Verify user has entries created (can't search/analyze empty journal)
- Clear localStorage and try again: `localStorage.clear()`

### Build Issues

**"Chunk size warning" on build**
- This is a performance warning, not an error
- App still works, but consider code-splitting large components for production
- Ignore for development

**Port Already in Use**
- Backend: Change `PORT` in `.env` to an available port
- Frontend: Change Vite port in `vite.config.js`

---

## 🤝 Contributing & Contact

Built by **Koushik Ghosh** — LPU Student & Full-Stack Developer.

Have a project idea or want to collaborate? Visit the **About** page in the app to send a message directly.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).