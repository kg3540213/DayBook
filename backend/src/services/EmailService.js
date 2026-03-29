const nodemailer = require("nodemailer");

// SMTP Configuration
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── OTP verification email ────────────────────────────────────────
const sendOtpEmail = async (toEmail, otp, firstName) => {
  try {
    // Use EMAIL_USER as FROM (verified sender), SMTP_USER is just for auth
    const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER;
    if (!fromEmail) {
      throw new Error("EMAIL_USER or SMTP_USER environment variable not configured");
    }

    const mailOptions = {
      from: `"DayBook" <${fromEmail}>`,
      replyTo: fromEmail,
      to: toEmail,
      subject: "Your DayBook Verification Code",
      text: `Hi ${firstName},\n\nYour DayBook verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't create a DayBook account, you can safely ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
          <h2 style="margin: 0 0 8px; color: #111;">Hi ${firstName} 👋</h2>
          <p style="color: #555; margin: 0 0 24px;">
            Thanks for signing up for <strong>DayBook</strong>. Use the code below to verify your email address.
          </p>

          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #888; letter-spacing: 1px; text-transform: uppercase;">Verification Code</p>
            <p style="margin: 0; font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #6366f1;">${otp}</p>
          </div>

          <p style="color: #888; font-size: 13px; margin: 0;">
            This code expires in <strong>10 minutes</strong>. If you didn't create a DayBook account, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", toEmail);
    return result;
  } catch (error) {
    console.error("Email sending error details:", {
      to: toEmail,
      error: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    throw error;
  }
};

// ── Verify email configuration ────────────────────────────────────
const verifyEmailConfig = async () => {
  try {
    const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER;

    console.log("=== EMAIL CONFIGURATION ===");
    console.log("SMTP_HOST    :", smtpHost);
    console.log("SMTP_USER    :", smtpUser ? "✓ Configured" : "✗ NOT SET");
    console.log("SMTP_PASS    :", smtpPass ? "✓ Configured" : "✗ NOT SET");
    console.log("FROM EMAIL   :", fromEmail ? `✓ ${fromEmail}` : "✗ NOT SET");
    console.log("============================");

    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
      console.warn("⚠️  Email credentials not fully configured. Email sending will fail.");
      console.warn("Required: SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_USER");
      return false;
    }
    await transporter.verify();
    console.log("✓ SMTP Email service verified and ready!");
    return true;
  } catch (error) {
    console.error("❌ Email service verification failed:", error.message);
    return false;
  }
};

module.exports = { sendOtpEmail, verifyEmailConfig };