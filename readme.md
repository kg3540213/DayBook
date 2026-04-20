# 📓 DayBook

A **secure, private journaling platform** exclusively for **LPU (Lovely Professional University)** students. Write freely, express yourself — every entry is **AES-256 encrypted client-side** before it ever reaches the server. Even the developer cannot read your entries.

**Live Demo:** [https://lpudaybook.onrender.com](https://lpudaybook.onrender.com)

---

## ✨ Features

### Core Journaling
- **📝 Daily Journaling** — Create, edit, and delete entries with title, date, mood, and rich-text content
- **🎨 Rich Text Editor** — Format with bold, italic, underline, lists, blockquotes, code blocks, and more
- **🏷️ Smart Tags** — Add up to 10 tags per entry (max 30 chars each) for organization and filtering
- **📌 Pin & Organize** — Pin important entries to keep them at the top

### Public Community Feed
- **🌍 LPU Today Feed** — Share public updates about what's happening at LPU today
  - Create up to 5 posts per day (rate-limited)
  - Posts are visible to all authenticated LPU users
  - **Auto-Expiry**: Posts automatically expire at midnight using MongoDB TTL indexes
  - Sort posts by latest first
  - Delete your own posts anytime
  - Real-time feed updates with 30-second polling

### Security & Privacy
- **🔐 End-to-End Encryption** — Entries are AES-256 encrypted in your browser using your password as the key
- **🎓 LPU-Only Access** — Only `@lpu.in` email addresses can register
- **✉️ OTP Email Verification** — 6-digit OTP verification required on signup
- **🔑 Secure JWT Auth** — `httpOnly` cookie-based JWT tokens (7-day expiry)
- **🛡️ Rate Limiting** — API endpoints protected with rate limiting
- **🔒 Password Encryption** — Bcrypt hashing for passwords and OTPs

### AI & Analytics
- **🤖 AI Mood Detection** — Powered by **Gemini 2.0 Flash** — paste content and let AI detect mood automatically
- **😊 Mood Tracking** — Log mood (😊 Happy, 😔 Sad, 😡 Angry, 😐 Neutral) with every entry
- **📊 Analytics Dashboard** — Visual charts for:
  - Mood distribution and patterns
  - Writing streaks and activity
  - Weekly & monthly statistics
  - Entry count trends

### Search & Discovery
- **📅 Calendar View** — Interactive calendar with mood indicators
- **🔍 Advanced Search** — Filter by keyword, mood, date range, tags, or pinned status
- **✨ Entry Templates** — Pre-defined templates to jumpstart writing

### User Experience
- **🖼️ Profile Management** — Upload profile photo (stored on Cloudinary)
- **📄 Pagination** — Browse entries with 6 per page
- **💾 Export Entries** — Backup entries as JSON or CSV
- **🌙 Dark/Light Theme** — Toggle themes with preference persistence
- **📱 Responsive Design** — Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **React Router v7** | Client-side routing |
| **Redux Toolkit + RTK Query** | State management & API caching |
| **Tailwind CSS v4 + DaisyUI** | Styling & pre-built components |
| **React Toastify** | Toast notifications |
| **Recharts** | Analytics visualizations |
| **React Icons** | Iconography |
| **Crypto-JS** | Client-side AES-256 encryption |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | NoSQL database & ODM |
| **Redis (IoRedis)** | Caching & session storage |
| **JWT + httpOnly Cookies** | Authentication & authorization |
| **Bcryptjs** | Password & OTP hashing |
| **Cloudinary** | Image storage & optimization |
| **Nodemailer** | Email delivery (OTP verification) |
| **Google Gemini API** | AI mood detection |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging |

---

## 📁 Project Structure

```
DayBook/
├── package.json                 # Root dependencies
├── readme.md
├── backend/
│   └── src/
│       ├── index.js             # Express app entry point
│       ├── config/
│       │   ├── database.js       # MongoDB connection
│       │   ├── redis.js          # Redis client setup
│       │   ├── cloudinary.js     # Cloudinary configuration
│       │   └── cache.js          # Caching utilities
│       ├── controllers/
│       │   ├── authController.js # Auth logic (signup, login, OTP)
│       │   ├── entryController.js# Entry CRUD operations
│       │   ├── postController.js # Public feed posts (CRUD + auto-expire)
│       │   └── userController.js # User profile management
│       ├── middleware/
│       │   ├── authMiddleware.js # JWT verification
│       │   └── rateLimiter.js    # API rate limiting
│       ├── models/
│       │   ├── userModel.js      # User schema
│       │   ├── entryModel.js     # Journal entry schema
│       │   └── postModel.js      # Public feed post schema (TTL index)
│       ├── routes/
│       │   ├── authRoutes.js     # Auth endpoints
│       │   ├── entryRoutes.js    # Entry CRUD endpoints
│       │   ├── userRoutes.js     # User endpoints
│       │   └── postRoutes.js     # Public feed endpoints
│       ├── services/
│       │   ├── EmailService.js   # OTP email delivery
│       │   └── geminiService.js  # AI mood detection
│       └── utils/
│           └── generateToken.js  # JWT token generation
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── eslint.config.js
    ├── index.html
    ├── public/
    └── src/
        ├── App.jsx              # Root component with routes
        ├── App.css              # Global styles
        ├── main.jsx             # React entry point
        ├── assets/              # Static assets
        ├── components/
        │   ├── Layout.jsx           # Main layout wrapper
        │   ├── Navbar.jsx           # Navigation bar
        │   ├── Footer.jsx           # Footer
        │   ├── Loader.jsx           # Loading spinner
        │   ├── ThemeController.jsx  # Dark/light mode toggle
        │   ├── ModalLayout.jsx      # Modal wrapper
        │   ├── auth/
        │   │   ├── Login.jsx        # Login form
        │   │   ├── Logout.jsx       # Logout handler
        │   │   ├── Profile.jsx      # User profile page
        │   │   └── Password.jsx     # Password reset
        │   ├── entry/
        │   │   ├── AddEntry.jsx         # Create entry
        │   │   ├── EditEntry.jsx        # Edit entry
        │   │   ├── DeleteEntry.jsx      # Delete confirmation
        │   │   ├── EntryCard.jsx        # Entry preview card
        │   │   ├── EntryTemplates.jsx   # Template selection
        │   │   ├── RichTextEditor.jsx   # WYSIWYG editor
        │   │   ├── TagInput.jsx         # Tag management
        │   │   └── ReadMore.jsx         # Full entry view
        │   ├── post/
        │   │   ├── PostForm.jsx         # Create post form
        │   │   └── PostCard.jsx         # Individual post display
        │   └── navbar/
        │       ├── NavLinks.jsx     # Navigation links
        │       ├── NavProfile.jsx   # Profile dropdown
        │       └── SearchBox.jsx    # Entry search
        ├── pages/
        │   ├── Home.jsx             # Landing page
        │   ├── Login.jsx            # Login page
        │   ├── Signup.jsx           # Registration page
        │   ├── Entries.jsx          # All entries list
        │   ├── Dashboard.jsx        # Analytics dashboard
        │   ├── CalendarView.jsx     # Calendar view
        │   ├── TodayFeed.jsx        # LPU Today Feed page ⭐ NEW
        │   ├── About.jsx            # About page
        │   └── NotFound.jsx         # 404 page
        ├── hooks/
        │   └── useSemanticSearch.js # Custom search hook
        ├── redux/
        │   ├── store.js             # Redux store config
        │   ├── features/
        │   │   └── userSlice.js     # User state
        │   └── api/
        │       ├── apiSlice.js         # Base API configuration
        │       ├── entriesApiSlice.js  # Entry API endpoints
        │       ├── usersApiSlice.js    # User API endpoints
        │       └── postsApiSlice.js    # Post API endpoints ⭐ NEW
        └── utils/
            ├── crypto.js             # AES-256 encryption/decryption
            ├── semanticSearch.js     # Entry search utilities
            └── sessionPassword.js    # Session password management
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** (local or Atlas)
- **Redis** (for caching)
- **Cloudinary** account (for image storage)
- **Google Gemini API** key (for AI mood detection)
- **Email service** (Nodemailer/Resend configured)
- *Optional:* **Docker** & **Docker Compose** for containerized setup

### Quick Start with Docker (Recommended)
```bash
# Clone and setup
git clone https://github.com/kg3540213/DayBook.git
cd DayBook

# Create .env file with your configuration
cp .env.example .env

# Build and run with Docker Compose
docker-compose up -d
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Manual Installation (Without Docker)

### Environment Variables

#### Backend (`.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/daybook

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Email Service
RESEND_API_KEY=your_resend_key
# OR use Nodemailer
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# OTP
OTP_EXPIRY=10m
```

#### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/kg3540213/DayBook.git
cd DayBook
```

**2. Install backend dependencies**
```bash
npm install
```

**3. Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

**4. Set up environment variables**
- Create `.env` in the root directory (backend config)
- Create `frontend/.env` in the frontend directory

**5. Start MongoDB and Redis**
```bash
# MongoDB
mongod

# Redis (in another terminal)
redis-server
```

**6. Run the application**

**Development Mode:**
```bash
# Terminal 1: Backend
npm start
# Runs on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Production Build:**
```bash
npm run build
npm start
```

---

## � Docker Support

The project includes a **Dockerfile** for containerized deployment. The Docker configuration uses a multi-stage build to optimize the final image size.

### Build Docker Image
```bash
docker build -t daybook:latest .
```

### Run with Docker
```bash
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/daybook \
  -e REDIS_URL=redis://your-redis-url \
  -e FRONTEND_URL=https://your-frontend-url \
  -e JWT_SECRET=your_jwt_secret \
  -e GEMINI_API_KEY=your_gemini_key \
  -e RESEND_API_KEY=your_resend_key \
  daybook:latest
```

### Docker Compose (Optional)
Create a `docker-compose.yml` for local development:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/daybook
      - REDIS_URL=redis://redis:6379
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - mongo
      - redis
  mongo:
    image: mongo:7-alpine
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

---

## �📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user with LPU email |
| POST | `/verify-otp` | Verify email OTP |
| POST | `/resend-otp` | Resend verification OTP |
| POST | `/login` | Login with email & password |
| POST | `/logout` | Logout user |
| POST | `/refresh-token` | Refresh JWT token |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |

### User (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update user profile |
| POST | `/upload-photo` | Upload profile photo |
| DELETE | `/photo` | Delete profile photo |
| GET | `/stats` | Get user statistics |

### Entries (`/api/entries`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all entries (with pagination) |
| GET | `/:id` | Get single entry |
| POST | `/` | Create new entry |
| PUT | `/:id` | Update entry |
| DELETE | `/:id` | Delete entry |
| POST | `/:id/pin` | Pin/unpin entry |
| GET | `/search` | Search entries (by keyword, mood, date, tags) |
| GET | `/ai-mood` | Detect mood using Gemini AI |
| GET | `/export` | Export entries as JSON or CSV |

### LPU Today Feed (`/api/posts`) ⭐ NEW
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get today's feed (sorted by latest) |
| POST | `/` | Create new post (max 5 per day) |
| GET | `/my/count` | Get user's post count for today |
| DELETE | `/:postId` | Delete own post |

**Post Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to User
  userName: String,        // User's first name
  content: String,         // Max 300 characters
  createdAt: Date,         // Auto-set
  expiresAt: Date,         // Auto-set to next day 00:00
  // TTL Index: Document auto-deletes at expiresAt time
}
```

---

## 🌍 LPU Today Feed - Feature Details

The **LPU Today Feed** is a unique real-time community feature that allows authenticated LPU students to share what's happening on campus today.

### 🎯 Why This Feature?

- **Community Connection** — Stay connected with what's happening on campus in real-time
- **Ephemeral & Fresh** — Posts disappear at midnight, keeping the feed current and clutter-free
- **Public Sharing** — Unlike encrypted journal entries, this is a safe public space for campus updates
- **Rate-Limited** — Max 5 posts per day prevents spam while encouraging quality contributions

### ⚙️ How It Works

**On the Backend:**
- Posts are stored in MongoDB with a **TTL (Time To Live) index** set to `expiresAt`
- MongoDB automatically deletes posts at midnight (00:00) — no cron jobs needed
- Posts are cached in Redis for fast retrieval
- Daily post count validated using MongoDB date range queries

**On the Frontend:**
- Feed auto-refreshes every 30 seconds (configurable polling)
- Real-time post count updated after create/delete
- Timestamps show relative time ("2h ago")
- Only post owners can delete their own posts

### 📝 Creating a Post

1. Navigate to **"Today Feed"** from the navbar
2. Click **"✨ Create Today's Post"**
3. Write your update (max 300 characters)
4. Click **"Post to Feed"**
5. Post appears immediately in the feed

### 🔗 Usage Examples

```
✅ Good Examples (Encouraged):
- "Fest day at LPU today! 🎉 Excited for the cultural performances!"
- "Free pizza in the food court right now at block J"
- "Study group meeting at library floor 3, join us!"
- "Anyone interested in joining robotics club? Meeting at 3pm"

❌ Avoid:
- Personal information or phone numbers
- Exam papers or confidential academic content
- Harassment or inappropriate content
- Spam or repetitive posts
```

### ⏰ Auto-Expiry Mechanism

```
Timeline:
├─ Post Created: 2pm (Mon, Apr 02)
├─ Post Visible: 2pm - 11:59pm (24 hours)
├─ Midnight: 00:00 (Tue, Apr 03)
└─ Auto-Deleted: Gone from database
```

**Technical Implementation:**
- **MongoDB TTL Index**: `postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`
- **No Manual Cleanup**: MongoDB handles deletion automatically
- **Precise Timing**: Expiry calculated to next day's midnight: `new Date(); tomorrow.setHours(0,0,0,0)`

### 🛡️ Rate Limiting & Constraints

- **Max 5 posts per user per day** — Prevents spam
- **300 characters max** — Keeps posts concise
- **Authentication required** — Only LPU users can post
- **LPU-only visibility** — Only visible to logged-in users
- **Public content** — Not encrypted (unlike journal entries)

### 💡 Best Practices

1. **Be Positive** — Share encouraging and helpful updates
2. **Be Relevant** — Keep posts related to LPU or campus life
3. **Be Concise** — 300 characters = be direct and clear
4. **Engage Respectfully** — Read others' posts and engage thoughtfully
5. **Report Issues** — Use feedback to report inappropriate content

---

### End-to-End Encryption
- **Client-Side Encryption**: All entries are encrypted with **AES-256** using CryptoJS
- **Key Derivation**: Uses your password as the encryption key
- **Server-Side Storage**: Only ciphertext is stored in MongoDB
- **Decryption**: Happens only in your browser after authentication
- **Impact**: Even database administrators cannot read your private entries

### Authentication & Authorization
- **Email Verification**: OTP-based verification for new signups
- **JWT Tokens**: Secure, stateless authentication with httpOnly cookies
- **Password Security**: Bcrypt hashing with salt rounds
- **CORS Protection**: Restricted to LPU domain origins
- **Rate Limiting**: Protects API endpoints from brute force attacks
- **LPU-Only Access**: Domain validation on both frontend and backend

---

## 🎓 Use Cases

- **Personal Journaling** — Daily reflections and thoughts
- **Mood Tracking** — Monitor emotional patterns over time
- **Study Notes** — Organize learning experiences
- **Goal Setting** — Track progress toward personal goals
- **Gratitude Practice** — Daily gratitude entries
- **Mental Health** — Therapeutic journaling with AI insights
- **Memory Keeping** — Preserve important moments and memories

---

## 📦 Deployment

### Docker Deployment (Recommended)

The project includes a **Dockerfile** with multi-stage build optimization. Deploy using Docker for consistency across environments.

**Build the image:**
```bash
docker build -t daybook:latest .
```

**Docker Compose (Local Development):**
```bash
docker-compose up -d
```

Create a `docker-compose.yml` with MongoDB and Redis services for complete local development.

### Deploy to Render

**Backend (Node.js Server):**
1. Push to GitHub
2. Create new Render service → Web Service
3. Select GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables (MongoDB, Redis, JWT, Gemini, etc.)
7. Deploy

**Frontend (Static Site):**
1. Build: `npm run build`
2. Push to GitHub
3. Create Render Static Site
4. Set build command: `cd frontend && npm install && npm run build`
5. Set publish directory: `frontend/dist`
6. Deploy

**Services Used:**
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud
- **Storage**: Cloudinary CDN
- **Hosting**: Render (Backend & Frontend)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

### Code Style
- Use ESLint for code consistency
- Follow the existing folder structure
- Write meaningful commit messages
- Add comments for complex logic

---

## 📝 License

This project is licensed under the **ISC License**. See [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Koushik Ghosh** — Full-stack developer specializing in MERN stack applications

- GitHub: [@kg3540213](https://github.com/kg3540213)
- Email: reach out via GitHub

---

## 🙏 Acknowledgments

- **React** — UI library
- **Tailwind CSS + DaisyUI** — Beautiful styling
- **MongoDB** — Database
- **Google Gemini** — AI mood detection
- **LPU Community** — Inspiration and users

---

## 📞 Support & Feedback

Found a bug or have a feature request? Please open an [issue](https://github.com/kg3540213/DayBook/issues) on GitHub.

For security concerns, please email directly instead of opening a public issue.

---

**🌟 If you find this project helpful, please give it a star!**
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