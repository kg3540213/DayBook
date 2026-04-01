const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail } = require("../services/EmailService");
const crypto = require("crypto");

const generateOtp = () =>
  crypto.randomInt(100000, 999999).toString();

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
      return res.status(422).json({ message: "Only LPU emails (e.g., avikgh12@lpu.in) are allowed for signup!" });

    if (email.length > 100)
      return res.status(422).json({ message: "Email cannot exceed 100 characters!" });
    if (firstName.length > 50)
      return res.status(422).json({ message: "First name cannot exceed 50 characters!" });
    if (lastName && lastName.length > 50)
      return res.status(422).json({ message: "Last name cannot exceed 50 characters!" });
    if (password.length > 100)
      return res.status(422).json({ message: "Password cannot exceed 100 characters!" });
    if (
      !validator.isStrongPassword(password, {
        minLength: 8, minUppercase: 1, minLowercase: 1,
        minNumbers: 1, minSymbols: 1,
      })
    )
      return res.status(422).json({ message: "Please enter a strong password!" });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified)
        return res.status(422).json({ message: "User already exists!" });

      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      const now = new Date();

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

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const now = new Date();

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

    if (!user)
      return res.status(404).json({ message: "User not found!" });
    if (user.isVerified)
      return res.status(400).json({ message: "Email is already verified!" });
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

    generateToken(user._id, res);

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

    if (!user)
      return res.status(404).json({ message: "User not found!" });
    if (user.isVerified)
      return res.status(400).json({ message: "Email is already verified!" });

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

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const now = new Date();

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

    res.status(200).json({
      message: "A new verification code has been sent to your email.",
    });
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

    const user = await User.findOne({ email });
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

    generateToken(user._id, res);
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
const logout = (req, res) => {
  res.cookie("token", null, { expires: new Date(0) });
  res.status(200).json({ message: "Logout successfully!" });
};

// ── CHANGE PASSWORD ───────────────────────────────────────────────
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
      return res.status(422).json({ message: "New password must differ!" });

    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 8, minUppercase: 1, minLowercase: 1,
        minNumbers: 1, minSymbols: 1,
      })
    )
      return res.status(422).json({ message: "Please enter a strong password!" });

    loggedUser.password = await bcrypt.hash(newPassword, 10);
    await loggedUser.save();

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Something went wrong! Please try again later!" });
  }
};

module.exports = { signup, verifyOtp, resendOtp, login, logout, changePassword };