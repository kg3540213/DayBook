const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const sendOtpEmail = async (toEmail, otp, firstName) => {
  const mailOptions = {
    from: `"DayBook" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your DayBook Verification Code",
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

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };