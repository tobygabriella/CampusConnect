import { PrismaClient } from "@prisma/client";
import { NotificationType, Priority } from "../enums/notifications.js";

const prisma = new PrismaClient();

/**
 * General-purpose in-app notification 
 * @param {NotificationOptions} options
 * @returns {Promise<import('@prisma/client').Notification>}
 */
export async function createNotification({
    app,
    recipientId,
    senderId,
    type,
    title,
    message,
    metadata = {},
    postIds = {},
    priority = Priority.LOW,
  }) {
    try {
      if (!recipientId || !senderId || !type || !title || !message) {
        throw new Error("Missing required notification fields");
      }
  
      const notification = await prisma.notification.create({
        data: {
          userId: recipientId,
          senderId,
          type,
          title,
          message,
          metadata,
          forumPostId: postIds.forumPostId || undefined,
          workPostId: postIds.workPostId || undefined,
          commentId: postIds.commentId || undefined,
          priority,
          isRead: false
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilePicture: true
            }
          }
        }
      });
  
      const io = app.get("io");
      if (io) {
        io.to(recipientId).emit("notification:new", notification);
      }
  
      return notification;
    } catch (error) {
      console.error("🔴 Error creating general notification:", error);
      throw error;
    }
  }
  