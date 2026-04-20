// backend/src/controllers/authController.js
//
// Option A: Password-based encryption — no dataKey, no encryptedDataKey.
//
// Auth model:
//   - POST /login        → issues access token (15 min) + refresh token (7 days)
//   - POST /refresh      → silent re-auth: validates refresh token, issues new pair
//   - POST /logout       → clears both cookies + invalidates DB refresh token
//   - PUT  /change-password → clears session key (client-side), issues new tokens
//
// Everything else (signup, OTP, etc.) is unchanged from the original.

const User      = require("../models/userModel");
const RefreshToken = require("../models/refreshTokenModel");
const bcrypt    = require("bcryptjs");
const validator = require("validator");
const jwt       = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail } = require("../services/EmailService");
const crypto    = require("crypto");

// ── OTP helper ────────────────────────────────────────────────────
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// ── cookie clearing helper ────────────────────────────────────────
const clearAuthCookies = (res) => {
  const base = { httpOnly: true, secure: true, sameSite: "None" };
  res.cookie("token",        "", { ...base, expires: new Date(0) });
  res.cookie("refreshToken", "", { ...base, expires: new Date(0), path: "/api/auth" });
};

// ── SIGNUP ────────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email || !req.body.firstName || !req.body.password)
      return res.status(400).json({ message: "Fill all required fields!" });

    email = email.trim().toLowerCase();
    const { firstName, lastName, password } = req.body;

    if (!validator.isEmail(email))
      return res.status(422).json({ message: "Invalid email format!" });

    if (!email.endsWith("@lpu.in"))
      return res.status(422).json({
        message: "Only LPU emails (e.g., avikgh12@lpu.in) are allowed for signup!",
      });

    if (email.length     > 100) return res.status(422).json({ message: "Email cannot exceed 100 characters!" });
    if (firstName.length > 50)  return res.status(422).json({ message: "First name cannot exceed 50 characters!" });
    if (lastName && lastName.length > 50) return res.status(422).json({ message: "Last name cannot exceed 50 characters!" });
    if (password.length  > 100) return res.status(422).json({ message: "Password cannot exceed 100 characters!" });

    if (!validator.isStrongPassword(password, {
      minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1,
    }))
      return res.status(422).json({ message: "Please enter a strong password!" });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified)
        return res.status(422).json({ message: "User already exists!" });

      // Unverified account exists — refresh OTP and password
      const otp     = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      const now     = new Date();

      existingUser.password  = await bcrypt.hash(password, 10);
      existingUser.firstName = firstName;
      existingUser.lastName  = lastName || "";
      existingUser.otpHash   = otpHash;
      existingUser.otpExpiry = new Date(now.getTime() + 10 * 60 * 1000);
      existingUser.otpSentAt = now;
      await existingUser.save();

      try {
        await sendOtpEmail(email, otp, firstName);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        return res.status(500).json({ message: "Failed to send verification email. Please try again." });
      }

      return res.status(200).json({
        message: "A new verification code has been sent to your email.",
        email,
      });
    }

    // Brand-new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp            = generateOtp();
    const otpHash        = await bcrypt.hash(otp, 10);
    const now            = new Date();

    await User.create({
      email, firstName, lastName,
      password: hashedPassword,
      isVerified: false,
      otpHash,
      otpExpiry: new Date(now.getTime() + 10 * 60 * 1000),
      otpSentAt: now,
    });

    try {
      await sendOtpEmail(email, otp, firstName);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      await User.findOneAndDelete({ email });
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    res.status(201).json({
      message: "Account created! Please check your email for the verification code.",
      email,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required!" });

    email = email.trim().toLowerCase();
    otp   = otp.trim();

    if (!/^\d{6}$/.test(otp))
      return res.status(422).json({ message: "OTP must be a 6-digit number!" });

    const user = await User.findOne({ email });

    if (!user)                                     return res.status(404).json({ message: "User not found!" });
    if (user.isVerified)                           return res.status(400).json({ message: "Email is already verified!" });
    if (!user.otpExpiry || new Date() > user.otpExpiry)
      return res.status(400).json({ message: "OTP has expired! Please request a new one." });

    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid OTP! Please try again." });

    user.isVerified = true;
    user.otpHash    = null;
    user.otpExpiry  = null;
    user.otpSentAt  = null;
    await user.save();

    // Issue both tokens (access + refresh)
    await generateToken(user._id, res);

    res.status(200).json({
      message: "Email verified successfully! Welcome to DayBook.",
      data: {
        _id:       user._id,
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── RESEND OTP ────────────────────────────────────────────────────
const resendOtp = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required!" });

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user)         return res.status(404).json({ message: "User not found!" });
    if (user.isVerified) return res.status(400).json({ message: "Email is already verified!" });

    if (user.otpSentAt) {
      const secondsSinceLastSend = (new Date() - new Date(user.otpSentAt)) / 1000;
      if (secondsSinceLastSend < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastSend);
        return res.status(429).json({
          message: `Please wait ${waitSeconds} second${waitSeconds !== 1 ? "s" : ""} before requesting a new code.`,
          waitSeconds,
        });
      }
    }

    const otp     = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const now     = new Date();

    user.otpHash   = otpHash;
    user.otpExpiry = new Date(now.getTime() + 10 * 60 * 1000);
    user.otpSentAt = now;
    await user.save();

    try {
      await sendOtpEmail(email, otp, user.firstName);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    res.status(200).json({ message: "A new verification code has been sent to your email." });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;

    if (!rawEmail || !password)
      return res.status(400).json({ message: "Email and password are required!" });

    const email = rawEmail.trim().toLowerCase();
    const user  = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ message: "Invalid credentials!" });

    if (!user.isVerified)
      return res.status(403).json({
        message: "Email not verified! Please complete OTP verification.",
        email,
        requiresVerification: true,
      });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid credentials!" });

    // Issue both tokens (access + refresh)
    await generateToken(user._id, res);

    res.json({
      message: "User logged in successfully!",
      data: {
        _id:       user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── REFRESH ───────────────────────────────────────────────────────
// Silent token refresh — called automatically by the frontend when the
// access token has expired (API returns 401).
//
// Flow:
//   1. Read raw refresh token from cookie
//   2. Hash it and look it up in DB
//   3. Verify it hasn't expired
//   4. Issue a new access token + refresh token pair (rotation)
//   5. Delete the old DB record (so the old refresh token is dead)
const refresh = async (req, res) => {
  try {
    const rawRefresh = req.cookies?.refreshToken;

    if (!rawRefresh)
      return res.status(401).json({ message: "No refresh token. Please log in again." });

    const tokenHash = generateToken.hashToken(rawRefresh);
    const record    = await RefreshToken.findOne({ tokenHash });

    if (!record)
      return res.status(401).json({ message: "Invalid or expired refresh token. Please log in again." });

    if (new Date() > record.expiresAt) {
      // Token expired — clean up and reject
      await RefreshToken.deleteOne({ _id: record._id });
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token expired. Please log in again." });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      await RefreshToken.deleteOne({ _id: record._id });
      clearAuthCookies(res);
      return res.status(401).json({ message: "User not found. Please log in again." });
    }

    // Delete old refresh token record (rotation — old token is now dead)
    await RefreshToken.deleteOne({ _id: record._id });

    // Issue fresh access token + refresh token pair
    await generateToken(user._id, res);

    res.status(200).json({
      message: "Token refreshed.",
      data: {
        _id:       user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────
// 1. Clear both cookies
// 2. Invalidate the refresh token record in DB so it can't be reused
const logout = async (req, res) => {
  try {
    const rawRefresh = req.cookies?.refreshToken;

    if (rawRefresh) {
      // Invalidate the stored refresh token so even if the cookie is somehow
      // replayed, the server will reject it
      const tokenHash = generateToken.hashToken(rawRefresh);
      await RefreshToken.deleteOne({ tokenHash }).catch((err) =>
        console.warn("[logout] Could not delete refresh token:", err.message)
      );
    }

    // Also clean up any other refresh tokens for this user (belt-and-suspenders)
    if (req.user?._id) {
      await RefreshToken.deleteMany({ userId: req.user._id }).catch(() => {});
    }

    clearAuthCookies(res);
    res.status(200).json({ message: "Logout successfully!" });
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear cookies even if DB cleanup fails
    clearAuthCookies(res);
    res.status(200).json({ message: "Logout successfully!" });
  }
};

// ── CHANGE PASSWORD ───────────────────────────────────────────────
// Option A: password change = key change.
// After changing password we issue fresh tokens so the session continues.
// Old entries encrypted with the old key remain unreadable.
const changePassword = async (req, res) => {
  try {
    const loggedUser = req.user;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Both old and new passwords are required!" });

    const passwordMatch = await bcrypt.compare(oldPassword, loggedUser.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Old password is incorrect!" });

    if (await bcrypt.compare(newPassword, loggedUser.password))
      return res.status(422).json({ message: "New password must differ from the old one!" });

    if (!validator.isStrongPassword(newPassword, {
      minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1,
    }))
      return res.status(422).json({ message: "Please enter a strong password!" });

    loggedUser.password = await bcrypt.hash(newPassword, 10);
    await loggedUser.save();

    // Issue fresh tokens after password change so the current session continues
    await generateToken(loggedUser._id, res);

    // Client is responsible for:
    //   1. Clearing the old session key (clearKeyFromSession)
    //   2. Deriving + storing the new session key (deriveAndStoreKey)
    //   3. Dispatching setEncKey with the new key
    res.status(200).json({
      message: "Password changed successfully! Your encryption key has been updated.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

module.exports = { signup, verifyOtp, resendOtp, login, refresh, logout, changePassword };