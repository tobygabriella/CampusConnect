import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send verification emails
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationLink = `http://localhost:5001/auth/verify-email/${verificationToken}`;
    await transporter.sendMail({
      from: `"Aro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email",
      text: `Click the link to verify your email: ${verificationLink}`,
      html: `<p>Click the link below to verify your email:</p>
             <a href="${verificationLink}">${verificationLink}</a>`,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
};
