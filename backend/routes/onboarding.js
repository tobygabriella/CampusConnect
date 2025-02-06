import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// onboarding
router.post("/complete", async (req, res) => {
  const { username } = req.body;
  const userId = req.user.userId; // Extracted from JWT

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "This username is already taken." });
    }

    // Update user profile
    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    res.json({ message: "Onboarding complete!" });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


