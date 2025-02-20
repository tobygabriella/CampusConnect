import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/emailService.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokenService.js"; 
import { requireAuth } from "../middleware/authMiddleware.js"; 
import { setAuthCookies } from "../utils/cookieService.js";

const router = express.Router();
const prisma = new PrismaClient();


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
        const newAccessToken = generateAccessToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: newRefreshToken },
        });

        done(null, { user, accessToken: newAccessToken, refreshToken: newRefreshToken });
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
  async (req, res) => {
    const { accessToken, refreshToken, user } = req.user;
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Ensure both tokens exist before setting cookies
    if (accessToken && refreshToken) {
      setAuthCookies(res, accessToken, refreshToken);
    } else {
      console.error('Missing tokens in Google callback');
    }

    // Check if user has completed onboarding
    if (!user.username) {
      res.redirect("http://localhost:5173/onboarding");
    } else if (user.role === "student") {
      res.redirect("http://localhost:5173/profile");
    } else if (user.role === "service_provider") {
      res.redirect("http://localhost:5173/service-provider-info");
    }
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
    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);

    // Set the token in an HTTP-only cookie
    setAuthCookies(res, accessToken, refreshToken);

    // Redirect to onboarding
    res.json({ message: "Signup successful. Please complete your profile.", onboarding: true });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
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

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ 
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Login Server Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//log out
router.post("/logout", requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }, // Clear refresh token from DB
    });
  }

  res.cookie("authToken", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0 });
  res.cookie("refreshToken", "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0 });

  res.json({ message: "Logged out successfully" });
});

//email verification
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

router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user.id);
    res.cookie("authToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({ message: "Token refreshed", accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

router.get("/verify-token", async (req, res) => {
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.status(401).json({ 
      message: "No token found",
      isExpired: true 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ 
        message: "User not found",
        isExpired: true 
      });
    }

    res.status(200).json({ message: "Valid token", user });
  } catch (error) {
    // Don't try to refresh if the token is invalid
    return res.status(401).json({ 
      message: "Invalid or expired token",
      isExpired: true 
    });
  }
});



export default router;
