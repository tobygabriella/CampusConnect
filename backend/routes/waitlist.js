import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Add user to waitlist
router.post("/", async (req, res) => {
  const { name, email, role, school, city, state } = req.body;

  try {
    const existing = await prisma.waitlist.findUnique({ where: { email } });

    if (existing) {
      return res.status(400).json({ message: "Email already on waitlist." });
    }

    const waitlistEntry = await prisma.waitlist.create({
      data: { name, email, role, school, city, state },
    });

    res.status(201).json({ message: "Added to waitlist", waitlistEntry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
