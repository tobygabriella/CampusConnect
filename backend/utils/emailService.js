import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generateAppointmentEmail, generateVerificationEmail } from "./emailTemplate.js";
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
    const { subject, html } = generateVerificationEmail(verificationToken);
    await transporter.sendMail({
      from: `"Aro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
};

export const sendAppointmentEmail = async ({
  to,
  name,
  service,
  provider,
  date,
  time,
  duration,
  location,
  type,
}) => {
  const { subject, html } = generateAppointmentEmail({
    name,
    service,
    provider,
    date,
    time,
    duration,
    location,
    type,
  });

  try {
    await transporter.sendMail({
      from: `"Aro Appointments" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Appointment email error:", error);
  }
};
