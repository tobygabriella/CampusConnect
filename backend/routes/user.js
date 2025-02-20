import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

//Get User Profile (Only the Authenticated User)
router.get("/profile/:username", requireAuth, async (req, res) => {
    const { username } = req.params;
  
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true, role: true, email: true }, // No sensitive data
      });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // If the logged-in user is requesting their own profile, return full data
      if (req.user.userId === user.id) {
        return res.status(200).json(user);
      }
  
      // Otherwise, return only public data
      return res.status(200).json({ username: user.username, role: user.role });
    } catch (error) {
      console.error("Profile Fetch Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  

export default router;
