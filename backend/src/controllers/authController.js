// backend/src/controllers/authController.js
//
// Option A: Password-based encryption — no dataKey, no encryptedDataKey.
//
// Auth model:
//   - POST /login        → issues access token (15 min)
//   - POST /logout       → clears auth cookie
//   - PUT  /change-password → clears session key (client-side), issues new token
//
// Everything else (signup, OTP, etc.) is unchanged from the original.

const User      = require("../models/userModel");
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
  const isProduction = process.env.NODE_ENV === "production";
  const base = {
    httpOnly: true,
    secure:   isProduction,
    sameSite: isProduction ? "None" : "Lax",
  };
  res.cookie("token", "", { ...base, expires: new Date(0) });
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

    try {
      generateToken(user._id, res);
    } catch (err) {
      console.error("[verifyOtp] Token issuance failed:", err.message);
      throw err;
    }

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

    try {
      generateToken(user._id, res);
    } catch (err) {
      console.error("[login] Token issuance failed:", err.message);
      return res.status(500).json({ message: "Session initialization failed. Please try again." });
    }

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

// ── LOGOUT ────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    clearAuthCookies(res);
    res.status(200).json({ message: "Logout successfully!" });
  } catch (error) {
    console.error("Logout error:", error);
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

    // Issue a fresh access token after password change so the session continues
    try {
      generateToken(loggedUser._id, res);
    } catch (err) {
      console.error("[changePassword] Token issuance failed:", err.message);
      // Password changed successfully; the user may need to log in again.
    }

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

module.exports = { signup, verifyOtp, resendOtp, login, logout, changePassword };