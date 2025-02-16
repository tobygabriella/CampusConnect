import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();
router.use(requireAuth);
// onboarding
router.post("/complete", async (req, res) => {
    const { username, role, college, collegesServed } = req.body;
    const userId = req.user.userId; // Extracted from JWT
  
    if (!username || !role) {
      return res.status(400).json({ message: "Username and role are required." });
    }
  
    if (role === "student" && !college) {
      return res.status(400).json({ message: "College selection is required for students." });
    }
  
    if (role === "service_provider" && (!collegesServed || collegesServed.length === 0)) {
      return res.status(400).json({ message: "At least one college must be selected for service providers." });
    }
  
    try {
      // Convert username to lowercase before saving
      const formattedUsername = username.toLowerCase();
  
      // Check if username is already taken
      const existingUser = await prisma.user.findFirst({ where: { username: formattedUsername } });
      if (existingUser) {
        return res.status(400).json({ message: "This username is already taken." });
      }
  
      // Update user profile with college selection
      await prisma.user.update({
        where: { id: userId },
        data: {
          username: formattedUsername,
          role,
          college: role === "student" ? college : null,
          collegesServed: role === "service_provider" ? collegesServed : [],
        },
      });
  
      res.json({ message: "Onboarding complete!", role, college, collegesServed });
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  

router.get("/check-username/:username", async (req, res) => {
    const { username } = req.params;
  
    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }
  
    try {
      // Convert to lowercase to enforce case-insensitivity
      const existingUser = await prisma.user.findFirst({
        where: { username: username.toLowerCase() },
      });
  
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken." });
      }
  
      res.json({ available: true, message: "Username is available." });
    } catch (error) {
      console.error("Username Check Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
export default router;


