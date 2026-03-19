# DayBook 📓

> A secure, full-featured personal journaling application built with the MERN stack. Write freely — your entries are encrypted, your emotions are tracked, and your progress is visualized.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Security Design](#security-design)
- [Frontend Architecture](#frontend-architecture)
- [State Management](#state-management)

---

## Overview

DayBook is a MERN stack journaling app where users can write, organize, and reflect on their daily experiences. Every entry is **encrypted on the client side** before being stored — the server never sees plaintext content. Mood is tracked per entry (manually or via AI), and an analytics dashboard visualizes writing habits over time.

---

## Features

### Authentication
- **Email + Password signup** with 6-digit OTP email verification
- JWT authentication via secure httpOnly cookies
- 60-second OTP resend cooldown with server-side enforcement
- Unverified users blocked from login until OTP is confirmed
- Change password (requires current password confirmation)

### Journal Entries
- Create, read, update, delete entries
- Each entry has a **title**, **date**, **mood**, and **content**
- Content is **AES-encrypted** on the frontend using the user's password as the key — plaintext never leaves the browser
- Entries sorted by date descending

### AI Mood Detection
- Click "AI Analyze Mood" when writing an entry
- Content is sent to **Google Gemini 2.0 Flash**
- Gemini returns one of: `happy`, `sad`, `angry`, `neutral`
- Mood emoji auto-filled in the form (`🙂 😔 😡 😐`)

### Search
- Full-text search across title and content
- Uses MongoDB `$text` index — no collection scans
- Title matches weighted 2× higher than content matches

### Analytics Dashboard
- **Mood distribution** — donut pie chart with percentage breakdown
- **Entries per week** — bar chart with 4w / 8w / 12w range toggle
- **Entries per month** — line chart with 3m / 6m / 12m range toggle
- **Writing streak** — current streak 🔥, longest streak, total active days
- All powered by MongoDB aggregation pipelines

### Profile Management
- Update first name and last name
- Email address cannot be changed (used as unique identifier)

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js + Express | ^4.21 | HTTP server and routing |
| MongoDB + Mongoose | ^8.8 | Database and ODM |
| bcryptjs | ^3.0 | Password and OTP hashing |
| jsonwebtoken | ^9.0 | JWT generation and verification |
| nodemailer | latest | OTP email delivery via Gmail SMTP |
| validator | ^13.12 | Field validation |
| dotenv | ^16.4 | Environment variable loading |
| cookie-parser | ^1.4 | Cookie parsing middleware |
| cors | ^2.8 | Cross-origin request handling |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | ^19.0 | UI library |
| Redux Toolkit + RTK Query | ^2.6 | State management and API calls |
| React Router DOM | ^7.2 | Client-side routing |
| Tailwind CSS v4 + DaisyUI v5 | ^4.0 / ^5.0 | Styling and UI components |
| Recharts | latest | Analytics charts |
| crypto-js | ^4.2 | AES client-side encryption |
| react-toastify | ^11.0 | Toast notifications |
| react-icons | ^5.5 | Icon library |

---

## Project Structure

```
daybook/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js     # signup, verifyOtp, resendOtp, login, logout, changePassword
│   │   │   ├── entryController.js    # CRUD + search + analyzeEntry + analytics
│   │   │   └── userController.js     # viewProfile, updateProfile
│   │   ├── middleware/
│   │   │   └── authMiddleware.js     # JWT verification, attaches req.user
│   │   ├── models/
│   │   │   ├── userModel.js          # User schema with OTP fields
│   │   │   └── entryModel.js         # Entry schema with text + compound indexes
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth/*
│   │   │   ├── entryRoutes.js        # /api/entries/*
│   │   │   └── userRoutes.js         # /api/users/*
│   │   ├── services/
│   │   │   ├── emailService.js       # Nodemailer OTP email sender
│   │   │   └── geminiService.js      # Gemini API call + mood normalization
│   │   ├── utils/
│   │   │   └── generateToken.js      # JWT creation + cookie setting
│   │   └── index.js                  # Express app entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── Logout.jsx        # Logout modal + sessionStorage clear
    │   │   │   ├── Password.jsx      # Change password modal
    │   │   │   └── Profile.jsx       # Edit profile modal
    │   │   ├── entry/
    │   │   │   ├── AddEntry.jsx      # Create entry + AI mood button
    │   │   │   ├── DeleteEntry.jsx   # Delete confirmation modal
    │   │   │   ├── EditEntry.jsx     # Edit entry + decrypt on load + AI mood
    │   │   │   ├── EntryCard.jsx     # Entry display card + decrypt on render
    │   │   │   └── ReadMore.jsx      # Full entry modal
    │   │   ├── navbar/
    │   │   │   ├── Navbar.jsx        # Top navigation bar
    │   │   │   ├── NavLinks.jsx      # Nav link items
    │   │   │   ├── NavProfile.jsx    # User dropdown menu
    │   │   │   └── SearchBox.jsx     # Search input
    │   │   ├── Footer.jsx
    │   │   ├── Layout.jsx            # Root layout + profile rehydration + password restore
    │   │   ├── Loader.jsx
    │   │   ├── ModalLayout.jsx
    │   │   └── ThemeController.jsx   # Light/dark toggle
    │   ├── pages/
    │   │   ├── About.jsx
    │   │   ├── Dashboard.jsx         # Analytics dashboard with Recharts
    │   │   ├── Entries.jsx           # Entry list + search results
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── NotFound.jsx
    │   │   └── Signup.jsx            # Two-step: form → OTP verification
    │   ├── redux/
    │   │   ├── api/
    │   │   │   ├── apiSlice.js       # RTK Query base API
    │   │   │   ├── entriesApiSlice.js
    │   │   │   └── usersApiSlice.js
    │   │   ├── features/
    │   │   │   └── userSlice.js      # data, userPassword, pendingEmail
    │   │   └── store.js
    │   ├── utils/
    │   │   ├── crypto.js             # encryptText / decryptText (AES via crypto-js)
    │   │   └── sessionPassword.js    # localStorage read/write/clear for userPassword
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## Database Models

### User

| Field | Type | Description |
|---|---|---|
| `email` | String (unique, required) | Login identifier |
| `firstName` | String (required) | Display name |
| `lastName` | String | Optional |
| `password` | String (required) | Bcrypt hashed |
| `isVerified` | Boolean (default: false) | Email OTP verified |
| `otpHash` | String | Bcrypt hash of current OTP |
| `otpExpiry` | Date | OTP expires 10 minutes after generation |
| `otpSentAt` | Date | Timestamp of last OTP send (60s cooldown) |

### Entry

| Field | Type | Description |
|---|---|---|
| `createdBy` | ObjectId (ref: User) | Owner |
| `date` | Date (required) | Entry date (set by user) |
| `title` | String | Max 20 characters |
| `mood` | String (enum) | `🙂` `😔` `😡` `😐` |
| `content` | String | AES-encrypted, max 1500 chars (pre-encryption) |
| `createdAt` | Date | Auto (Mongoose timestamps) |
| `updatedAt` | Date | Auto (Mongoose timestamps) |

**MongoDB Indexes:**

```js
// Full-text search — title matches rank 2× higher than content
{ title: "text", content: "text" }  weights: { title: 2, content: 1 }

// Compound index — covers filter queries and date sorts
{ createdBy: 1, date: -1, mood: 1 }
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/signup` | No | Create unverified account, send OTP email |
| POST | `/verify-otp` | No | Verify OTP → issue JWT cookie |
| POST | `/resend-otp` | No | Resend OTP (60s cooldown) |
| POST | `/login` | No | Login → issue JWT cookie |
| POST | `/logout` | No | Clear JWT cookie |
| PUT | `/change-password` | Yes | Change password (requires old password) |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/me` | Yes | Get current user profile |
| PUT | `/me` | Yes | Update first name / last name |

### Entries — `/api/entries`

All entry routes require authentication.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create entry |
| GET | `/` | Get all entries (sorted by date desc) |
| GET | `/:id` | Get single entry |
| PATCH | `/:id` | Update entry |
| DELETE | `/:id` | Delete entry |
| GET | `/search?text=` | Full-text search |
| POST | `/analyze` | AI mood analysis via Gemini |
| GET | `/analytics/mood` | Mood counts (all 4 moods) |
| GET | `/analytics/weekly?weeks=8` | Entry count per ISO week |
| GET | `/analytics/monthly?months=6` | Entry count per calendar month |
| GET | `/analytics/streak` | Current streak, longest streak, total active days |

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/daybook

# Auth
JWT_SECRET=your_strong_jwt_secret_here

# Email — Gmail SMTP
# Requires Gmail 2-Step Verification + App Password
# Generate at: Google Account → Security → 2-Step Verification → App Passwords
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16_char_app_password

# AI — Google Gemini
# Get your key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Gmail account with 2-Step Verification enabled
- Google AI Studio account (for Gemini API key)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/thenileshnishad/daybook.git
cd daybook
```

**2. Install backend dependencies**

```bash
cd backend
npm install
npm install nodemailer   # email OTP sending
```

**3. Install frontend dependencies**

```bash
cd ../frontend
npm install
```

**4. Set up environment variables**

```bash
cd ../backend
cp .env.example .env
# Edit .env with your actual values
```

**5. Start the development servers**

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

**6. Open in browser**

```
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

---

## Security Design

### Client-Side Encryption

Entry content is **encrypted in the browser before being sent to the server**, using AES via `crypto-js`. The encryption key is derived from the user's password using SHA-256.

```
User types content
  → encryptText(content, userPassword)
    → SHA-256(userPassword) → key
    → AES.encrypt(content, key)
    → ciphertext sent to backend + stored in MongoDB

On load
  → AES.decrypt(ciphertext, SHA-256(userPassword))
    → plaintext displayed in UI
```

The server stores and returns ciphertext only. If the database is compromised, entries cannot be read without the user's password.

### Password Persistence

The user's plaintext password is needed at runtime for encryption/decryption. It is:

1. Dispatched to Redux after login/OTP verification (in-memory)
2. Base64-encoded and stored in `localStorage` under `_db_sp`
3. Restored from `localStorage` on every page refresh by `Layout.jsx`
4. Cleared from both Redux and `localStorage` on logout

### OTP Security

- OTPs are **never stored in plaintext** — only bcrypt hashes are stored
- OTPs expire after **10 minutes**
- Resend is rate-limited to **once per 60 seconds**, enforced server-side
- Unverified users cannot log in until OTP is confirmed
- Retrying signup with an existing unverified email regenerates the OTP (no duplicate users)

### JWT

- Issued as `httpOnly`, `secure`, `sameSite: None` cookies
- 7-day expiry
- Verified on every protected route via `authMiddleware`

---

## Frontend Architecture

### Pages and Routes

| Route | Component | Auth Required |
|---|---|---|
| `/` | `Home.jsx` | No |
| `/login` | `Login.jsx` | No (redirects if logged in) |
| `/signup` | `Signup.jsx` | No (redirects if logged in) |
| `/entries` | `Entries.jsx` | Yes |
| `/dashboard` | `Dashboard.jsx` | Yes |
| `/about` | `About.jsx` | No |
| `*` | `NotFound.jsx` | No |

### Signup Flow

```
Step 1 — Form
  User fills firstName, lastName, email, password
  → POST /api/auth/signup
  → Backend creates unverified user, sends OTP email
  → Frontend stores email in Redux (pendingEmail)
  → Shows OTP input screen

Step 2 — OTP Verification
  User enters 6-digit code (individual digit boxes, paste-compatible)
  → POST /api/auth/verify-otp { email, otp }
  → Backend validates hash + expiry → marks isVerified: true → issues JWT
  → Frontend dispatches userInfo + userPassword → saves to localStorage
  → Navigates to home
```

### Entry Encryption Flow

```
Add Entry
  User writes content (plaintext)
  → AI Analyze button (optional): POST /api/entries/analyze → mood auto-filled
  → Save: encryptText(content, userPassword) → POST /api/entries

Display Entry
  Fetch entries from API (ciphertext)
  → decryptText(content, userPassword) → plaintext shown in UI
  → If userPassword is null (refresh): restored from localStorage by Layout.jsx

Edit Entry
  Load: decryptText(storedContent, userPassword) → shown in form
  Save: encryptText(editedContent, userPassword) → PATCH /api/entries/:id
```

---

## State Management

### Redux Store Shape

```js
{
  user: {
    data: null,          // API response: { message, data: { _id, email, firstName, lastName } }
    userPassword: null,  // Plaintext password — used as AES encryption key
    pendingEmail: null,  // Held during signup step 1 → step 2 transition
  },
  apiSlice: { ... }      // RTK Query cache for all API responses
}
```

### RTK Query Hooks

**Users API**

| Hook | Method | Endpoint |
|---|---|---|
| `useSignupMutation` | POST | `/auth/signup` |
| `useVerifyOtpMutation` | POST | `/auth/verify-otp` |
| `useResendOtpMutation` | POST | `/auth/resend-otp` |
| `useLoginMutation` | POST | `/auth/login` |
| `useLogoutMutation` | POST | `/auth/logout` |
| `useProfileQuery` | GET | `/users/me` |
| `useUpdateProfileMutation` | PUT | `/users/me` |
| `useChangePasswordMutation` | PUT | `/auth/change-password` |

**Entries API**

| Hook | Method | Endpoint |
|---|---|---|
| `useAddEntryMutation` | POST | `/entries` |
| `useGetEntriesQuery` | GET | `/entries` |
| `useGetEntryQuery` | GET | `/entries/:id` |
| `useUpdateEntryMutation` | PATCH | `/entries/:id` |
| `useDeleteEntryMutation` | DELETE | `/entries/:id` |
| `useSearchEntryQuery` | GET | `/entries/search` |
| `useAnalyzeMoodMutation` | POST | `/entries/analyze` |
| `useGetMoodAnalyticsQuery` | GET | `/entries/analytics/mood` |
| `useGetEntriesPerWeekQuery` | GET | `/entries/analytics/weekly` |
| `useGetEntriesPerMonthQuery` | GET | `/entries/analytics/monthly` |
| `useGetWritingStreakQuery` | GET | `/entries/analytics/streak` |

---

## Author

**Koushik Ghosh**
GitHub: [@thenileshnishad](https://github.com/thenileshnishad)

---

*Start your journaling journey with DayBook — where your memories are secure, personal, and always accessible.*