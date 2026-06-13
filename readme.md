# 📓 DayBook

DayBook is a privacy-aware journaling platform built with a Node/Express backend and a React + Vite frontend. It combines private journaling, smart search tools, AI-assisted mood support, and a public campus-style feed in one app.

This README is written to explain how the system works step by step, so anyone reading it can understand the full flow of the project without needing to inspect every file.

---

## 1. What this project is

DayBook is designed for two different user experiences:

1. A private journal space for personal reflection, mood tracking, and daily writing.
2. A public campus-style feed for sharing quick updates with other LPU users.

The important idea is that private journal entries are protected in the browser before they ever leave the user device, while public posts are handled separately for community interaction.

---

## 2. How the application works from start to finish

### Step 1 — User opens the app

- The frontend loads through Vite and React Router.
- The user sees the main pages such as Home, Login, Signup, Entries, Calendar, Feed, Dashboard, and About.
- If the user is not logged in, the app redirects them to the login screen for protected areas.

### Step 2 — New account creation and email verification

- A user enters their name, email, and password.
- The signup flow validates the email format and restricts access to LPU email addresses.
- The system checks password strength before creating the account.
- A one-time passcode is generated and sent to the user email.
- The user must enter that code to confirm the account.
- Once the code is verified, the account becomes active and the login session is created.

This part ensures that only real LPU users can create accounts and that email verification is part of the registration flow.

### Step 3 — Login and session creation

- The user logs in with their verified email and password.
- The backend validates the password and issues a secure authentication token.
- The frontend stores the user session and uses it for protected pages.
- For private entries, the app also generates or restores a browser-side encryption key so journal content can be decrypted only in the current session.

### Step 4 — Private journaling begins

When the user opens the journal section:

1. They can create a new entry with a title, mood, date, tags, and rich text content.
2. They can also use predefined templates to speed up writing.
3. They can optionally use voice-to-text input for recording ideas.
4. They can ask the AI service to detect the mood from the entry content.

Before the entry is saved:

- The content is encrypted in the browser using a client-side AES key.
- That key is derived from the user’s session and never sent to the backend in plain form.
- The encrypted text is then sent to the server.

This means the server stores only ciphertext, not the human-readable journal text.

### Step 5 — Reading and editing private entries

When the user opens an existing journal entry:

- The frontend fetches the encrypted entry from the server.
- It uses the session key stored in the browser to decrypt the content.
- If the key is missing, the app shows a warning and asks the user to log in again.

Editing works in the same way:

- The existing content is decrypted in the browser.
- The user changes it in the editor.
- The updated content is encrypted again before it is saved.

This protects personal writing while keeping the experience simple for the user.

### Step 6 — Layout, mood, and tags in the journal view

The journal page is more than a simple list:

- Entries can be pinned to appear at the top.
- Entries can be filtered by mood, date, keyword, and tag.
- The user can search through title, mood, tags, and content.
- Entries are sorted with pinned notes first and most recent entries first.

This design makes the journal feel like a real personal diary system rather than just a plain note list.

### Step 7 — Smart folders for saved searches

The app lets the user save a particular combination of filters as a smart folder.

For example, the user can save:

- a specific keyword,
- a chosen mood,
- a date range,
- one or more tags.

Once saved, the folder can be reopened later to instantly apply the same filter set. This is useful for repeated review patterns such as “happy entries from this month” or “all entries about classes and stress.”

### Step 8 — Calendar view for timeline reflection

The calendar page groups entries by day.

- Clicking a date opens a detailed view of all entries written that day.
- The user can expand each entry and read its decrypted content inside the modal.
- The page also shows monthly stats such as how many entries were written and which mood appeared most often.

This gives the user a visual timeline of their writing habits instead of only a simple list.

---

## 3. Feature-by-feature explanation

### A. Private journal system

The core private feature works like this:

1. The user writes a journal entry in the editor.
2. The entry gets a title, mood, date, and optional tags.
3. The browser encrypts the content before sending it.
4. The backend stores the encrypted data and metadata.
5. Later, the frontend decrypts it only when needed for display or editing.

This is the foundation of DayBook’s privacy model.

### B. AI mood detection

The entry editor includes an AI-based mood suggestion tool.

- The user writes or pastes text into the editor.
- The app sends the text to the AI service for analysis.
- The service returns an emotion label.
- The selected mood in the form is updated automatically.

This makes the journaling experience more reflective and intelligent without forcing the user to manually choose a mood every time.

### C. Search and filtering system

The journal page is designed to help users find old entries quickly.

- Keyword search checks titles, mood labels, tags, and content.
- Mood filters narrow the list to specific emotional states.
- Date filters help users view entries within a chosen period.
- Tag filters allow users to find entries with shared topics or themes.
- Pinned entries can be shown separately.

All of this is handled in a user-friendly interface, so the user can review past journal history without scrolling endlessly.

### D. Smart folders / saved searches

Smart folders turn filter combinations into reusable views.

- The user applies filters.
- They save the current search setup under a custom name.
- Later, they can reopen that saved folder and restore the same search conditions instantly.

This makes the journal more powerful for long-term use.

### E. Public feed and campus-style posting

DayBook also includes a community feed for public posts.

- The user writes a short public update.
- The post is limited to a fixed number of characters.
- The post is checked against a daily posting limit.
- The feed displays recent posts for the day.
- Other users can like and comment on posts.
- Posts are cached to improve speed and reduce repeated database reads.

The feed is intentionally public and meant for light community sharing, not for private diary content.

### F. Likes, comments, and ownership control

Each public post supports interaction:

- Users can like a post.
- Users can add comments.
- Users can remove their own comments.
- Owners can delete their own posts.

This creates a simple social layer inside the app without making the feed too complex.

### G. Profile and account management

The profile section allows users to manage their identity.

- Users can view their account details.
- They can update their name.
- They can upload a profile photo.
- Photos are handled through an external image service and stored safely for display.

This is part of the app’s overall user profile and identity system.

### H. Analytics and progress tracking

The system calculates writing-related activity to encourage consistency.

- It counts total journal entries.
- It detects writing streaks.
- It identifies the longest writing streak.
- It generates badge-style achievements based on writing habits.

This gives the user feedback on how consistently they are journaling, making the app feel more motivating and personal.

---

## 4. How the backend supports the app

The backend is responsible for the main operational layer:

- It connects to the database and verifies the environment.
- It handles authentication, user sessions, email verification, and account validation.
- It stores private journal entries and public feed posts.
- It manages search, filtering, and smart folder data.
- It uses caching to make feed and entry-related operations faster.
- It protects the app with security middleware such as rate limiting and secure headers.

The backend is also where the app integrates external services for:

- email delivery,
- image storage,
- AI mood analysis.

---

## 5. How the frontend is structured

The frontend is split into clear areas:

- Pages for authentication, journal writing, calendar, analytics, dashboard, and community feed.
- Reusable UI components for forms, cards, modals, navigation, loaders, and profile actions.
- Redux slices for managing user state and app data.
- Utility modules for encryption, session handling, and secure browser-side operations.

This separation keeps the application maintainable and makes it easier to extend with new features later.

---

## 6. Security and privacy model

DayBook takes privacy seriously:

- Private entries are encrypted before they are sent to the server.
- The encryption key stays in the browser session.
- The backend stores ciphertext rather than the raw journal text.
- Passwords and OTP values are hashed before storage.
- The application uses secure cookies, security headers, and rate limiting.
- Public feed posts are separate from private journal data, so the two features are kept logically different.

This structure is what makes DayBook feel safe for personal journaling while still supporting a public social layer.

---

## 7. Project structure at a glance

- backend/ — server logic, database connection, authentication, entry and post handling, utilities, and external service integration.
- frontend/ — user interface, pages, components, Redux integration, and browser-side encryption logic.
- package.json — root project scripts and main dependencies.
- readme.md — project documentation.

---

## 8. Getting started

### Prerequisites

- Node.js v18+
- npm
- MongoDB
- Redis (optional, but recommended for feed and cache support)
- Cloudinary account (optional, for profile photo upload)
- A backend environment file with the required service credentials

### Install dependencies

From the project root:

```bash
npm install
```

Then install frontend dependencies:

```bash
cd frontend
npm install
```

### Run locally

From the root:

```bash
npm start
```

For frontend development:

```bash
cd frontend
npm run dev
```

### Build for production

```bash
npm run build
```

Then start the backend:

```bash
npm start
```

---

## 9. Backend environment variables

Create a .env file in the backend folder with the project credentials:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
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
- FRONTEND_URL should match the local frontend address while developing.
- GEMINI_API_KEY is optional and used for mood analysis support.

---

## 10. Scripts

From the project root:

- npm start — starts the backend server.
- npm run build — installs dependencies and builds the frontend for production.

From the frontend folder:

- npm run dev — starts the Vite development server.
- npm run build — builds the frontend assets.

---

## 11. Summary

DayBook is a full journal + community app with a strong privacy model:

- private entries are encrypted in the browser,
- search and smart folders help with organization,
- calendar and analytics improve long-term journaling habits,
- the public feed adds a social campus-style experience,
- and the backend ties everything together with authentication, caching, and external integrations.

If you understand the flows in this README, you will understand how the project works as a whole.

---

## 12. Contributing

Contributions are welcome. If you find a bug or want to improve a feature, open an issue and submit a focused pull request.
