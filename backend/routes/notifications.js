import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Get all notifications for logged-in user
router.get("/", requireAuth, async (req, res) => {
    const userId = req.user.userId;
    const unreadOnly = req.query.unread === "true";
  
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly && { isRead: false }),
        },
        orderBy: { createdAt: "desc" },
        include: { sender: true },
      });
  
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });  

// ✅ Mark a notification as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Mark all notifications as read
router.patch("/read-all", requireAuth, async (req, res) => {
  const userId = req.user.userId;

  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Optional: Archive or delete a notification
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.notification.update({
      where: { id },
      data: { isArchived: true },
    });

    res.status(204).end();
  } catch (error) {
    console.error("Error archiving notification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
