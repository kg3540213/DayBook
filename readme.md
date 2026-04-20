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
├── Dockerfile
├── package.json                 # Root dependencies
├── readme.md
├── backend/
│   └── src/
│       ├── index.js             # Express app entry point
│       ├── config/
│       │   ├── cache.js          # Caching utilities
│       │   ├── cloudinary.js     # Cloudinary configuration
│       │   ├── database.js       # MongoDB connection
│       │   └── redis.js          # Redis client setup
│       ├── controllers/
│       │   ├── authController.js # Auth logic (signup, login, OTP)
│       │   ├── entryController.js# Entry CRUD operations
│       │   ├── postController.js # Public feed posts (CRUD + auto-expire)
│       │   └── userController.js # User profile management
│       ├── middleware/
│       │   ├── authMiddleware.js # JWT verification
│       │   └── rateLimiter.js    # API rate limiting
│       ├── models/
│       │   ├── entryModel.js     # Journal entry schema
│       │   ├── postModel.js      # Public feed post schema (TTL index)
│       │   └── userModel.js      # User schema
│       ├── routes/
│       │   ├── authRoutes.js     # Auth endpoints
│       │   ├── entryRoutes.js    # Entry CRUD endpoints
│       │   ├── postRoutes.js     # Public feed endpoints
│       │   └── userRoutes.js     # User endpoints
│       ├── services/
│       │   ├── EmailService.js   # OTP email delivery
│       │   └── geminiService.js  # AI mood detection
│       └── utils/
│           └── generateToken.js  # JWT token generation
└── frontend/
    ├── cryptoTest.js
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.css              # Global styles
        ├── App.jsx              # Root component with routes
        ├── main.jsx             # React entry point
        ├── assets/              # Static assets
        ├── components/
        │   ├── Footer.jsx           # Footer
        │   ├── Layout.jsx           # Main layout wrapper
        │   ├── Loader.jsx           # Loading spinner
        │   ├── ModalLayout.jsx      # Modal wrapper
        │   ├── ThemeController.jsx  # Dark/light mode toggle
        │   ├── auth/
        │   │   ├── Logout.jsx       # Logout handler
        │   │   ├── Password.jsx     # Password reset
        │   │   └── Profile.jsx      # User profile page
        │   ├── entry/
        │   │   ├── AddEntry.jsx         # Create entry
        │   │   ├── DeleteEntry.jsx      # Delete confirmation
        │   │   ├── EditEntry.jsx        # Edit entry
        │   │   ├── EntryCard.jsx        # Entry preview card
        │   │   ├── EntryTemplates.jsx   # Template selection
        │   │   ├── ReadMore.jsx         # Full entry view
        │   │   ├── RichTextEditor.jsx   # WYSIWYG editor
        │   │   └── TagInput.jsx         # Tag management
        │   ├── navbar/
        │   │   ├── Navbar.jsx           # Navigation bar
        │   │   ├── NavLinks.jsx         # Navigation links
        │   │   ├── NavProfile.jsx       # Profile dropdown
        │   │   └── SearchBox.jsx        # Entry search
        │   └── post/
        │       ├── PostCard.jsx         # Individual post display
        │       └── PostForm.jsx         # Create post form
        ├── hooks/
        │   └── useSemanticSearch.js # Custom search hook
        ├── pages/
        │   ├── About.jsx             # About page
        │   ├── Analytics.jsx         # Analytics dashboard
        │   ├── CalendarView.jsx      # Calendar view
        │   ├── Entries.jsx           # All entries list
        │   ├── Home.jsx              # Landing page
        │   ├── Login.jsx             # Login page
        │   ├── NotFound.jsx          # 404 page
        │   ├── Signup.jsx            # Registration page
        │   └── TodayFeed.jsx         # LPU Today Feed page
        ├── redux/
        │   ├── store.js             # Redux store config
        │   ├── api/
        │   │   ├── apiSlice.js         # Base API configuration
        │   │   ├── entriesApiSlice.js  # Entry API endpoints
        │   │   ├── postsApiSlice.js    # Post API endpoints
        │   │   └── usersApiSlice.js    # User API endpoints
        │   └── features/
        │       └── userSlice.js        # User state
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

