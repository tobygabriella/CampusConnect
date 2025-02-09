import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/emailService.js";

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

//google auth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        if(!profile.id)
        {
          return done(new Error("Google profile ID is missing"), null);
        }
        // Check if user already exists with oauthId
        let user = await prisma.user.findUnique({ where: { oauthId: profile.id } });

        if (!user) {
          //Check if user already exists with the same email (signed up with email/password before)
          user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });

          if (user) {
            //If email exists, update it to link Google OAuth
            user = await prisma.user.update({
              where: { email: profile.emails[0].value },
              data: { oauthProvider: "google", oauthId: profile.id, isVerified: true },
            });
          } else {
            //If no user exists, create a new Google user
            user = await prisma.user.create({
              data: {
                email: profile.emails[0].value,
                name: profile.displayName || "Google User",
                oauthProvider: "google",
                oauthId: profile.id,
                isVerified: true,
              },
            });
          }
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "15m" });
        done(null, { user, token });
      } catch (error) {
        console.error("Google OAuth Error:", error);
        done(error, null);
      }
    }
  )
);


//google log in
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const { token } = req.user;
    res.cookie("authToken", token, { httpOnly: true, secure: true });
    res.redirect("http://localhost:5173/onboarding");
  }
);

//email signup
router.post("/signup", async (req, res) => {
  const { email, password,name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "A verified user with this email already exists. Please log in." });
      } else {
        return res.status(400).json({ message: "A user with this email already exists but is not verified. Please check your email for verification." });
      }
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isVerified: false, // Not verified yet
        verificationToken,
      },
    });

    await sendVerificationEmail(email, verificationToken);

    // Generate JWT Token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "15m" });

    // Set the token in an HTTP-only cookie
    res.cookie("authToken", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

    // Redirect to onboarding
    res.json({ message: "Signup successful. Please complete your profile.", onboarding: true });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// email verification
router.get("/verify/:token", async (req, res) => {
  try {
    const { email } = jwt.verify(req.params.token, JWT_SECRET);
    await prisma.user.update({ where: { email }, data: { isVerified: true } });
    res.redirect("http://localhost:5173/login");
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email or password is required." });
  }

  try {

    // Find user by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
    });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

     // Check if user is verified
     if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    

    // Ensure onboarding is complete
    if (!user.username) {
      return res.status(403).json({ message: "Complete onboarding first.", onboarding: true });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "15m" });
    res.cookie("authToken", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.json({ message: "Login successful"});
  } catch (error) {
    console.error("Login Server Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//log out
router.post("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.json({ message: "Logged out successfully" });
});

//verify token
router.get("/verify-token", (req, res) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: "Valid token", userId: decoded.userId });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Find the user with this verification token
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    // Mark the user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null }, // Clear token
    });

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Email Verification Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
