import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import dotenv from "dotenv";
import { uploadToS3, uploadMultipleToS3, deleteMultipleFromS3 } from "../utils/s3Uploader.js";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const parseJsonArray = (input) => {
  if (!input || input === "undefined") return [];
  if (Array.isArray(input)) return input;
  try {
    return JSON.parse(input);
  } catch {
    return [];
  }
};

// Create a new work post
router.post("/", requireAuth, upload.array("images", 10), async (req, res) => {
  const userId = req.user.userId;
  const { caption, tags, serviceId, appointmentId } = req.body;

  try {
    const tagArray = parseJsonArray(tags);
    const imageUrls = req.files.length > 0 ? await uploadMultipleToS3(req.files, "work-posts") : [];

    const post = await prisma.workPost.create({
      data: {
        caption,
        tags: tagArray,
        images: imageUrls,
        authorId: userId,
        serviceId: serviceId || null,
        appointmentId: appointmentId || null,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Create WorkPost Error:", error);
    res.status(500).json({ message: "Failed to create post", error: error.message });
  }
});

// Get posts for home feed (only user's college or colleges they service)
router.get("/feed", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        collegeId: true,
        collegesServed: { select: { id: true } }
      }
    });

    const collegeIds = [
      ...(user.collegeId ? [user.collegeId] : []),
      ...user.collegesServed.map(c => c.id)
    ];

    const posts = await prisma.workPost.findMany({
      where: {
        author: {
          OR: [
            { collegeId: { in: collegeIds } },
            { collegesServed: { some: { id: { in: collegeIds } } } }
          ]
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, profilePicture: true } },
        service: true,
        appointment: true,
        _count: {
            select: {
              upvotes: true,
              comments: true,
            },
          },
          upvotes: { select: { userId: true } },
      },
    });
    res.json(posts);
  } catch (error) {
    console.error("Fetch Feed WorkPosts Error:", error);
    res.status(500).json({ message: "Failed to fetch feed work posts" });
  }
});

// Get posts created by the authenticated user (for profile)
router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  try {
    const posts = await prisma.workPost.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        service: true,
        appointment: true,
      },
    });
    res.json(posts);
  } catch (error) {
    console.error("Fetch My WorkPosts Error:", error);
    res.status(500).json({ message: "Failed to fetch your work posts" });
  }
});

// Get posts by any user (for public profile)
router.get("/user/:username", async (req, res) => {
    const { username } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
      });
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const posts = await prisma.workPost.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          images: true,
          caption: true
        }
      });
  
      res.json(posts);
    } catch (error) {
      console.error("Fetch User WorkPosts Error:", error);
      res.status(500).json({ message: "Failed to fetch user's work posts" });
    }
  });
  

// Get a single post by ID (detailed view)
router.get("/:id", requireAuth, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;
  
    try {
      const post = await prisma.workPost.findUnique({
        where: { id: postId },
        include: {
          author: { select: { id: true, username: true, profilePicture: true } },
          service: true,
          appointment: true,
          comments: {
            include: {
              author: { select: { id: true, username: true, profilePicture: true } },
              upvotes: { select: { userId: true } },
              downvotes: { select: { userId: true } },
            }
          },
          upvotes: true,
          downvotes: true,
        }
      });
  
      if (!post) return res.status(404).json({ message: "Post not found" });
  
      // Add flags to comments
      const commentsWithUserVotes = post.comments.map((comment) => ({
        ...comment,
        isUpvotedByCurrentUser: comment.upvotes.some((u) => u.userId === userId),
        isDownvotedByCurrentUser: comment.downvotes.some((d) => d.userId === userId),
        _count: {
          upvotes: comment.upvotes.length,
          downvotes: comment.downvotes.length,
        },
      }));
  
      res.json({
        ...post,
        comments: commentsWithUserVotes,
      });
    } catch (error) {
      console.error("Fetch WorkPost Detail Error:", error);
      res.status(500).json({ message: "Failed to fetch work post" });
    }
  });
  

// Delete a post
router.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.id;

  try {
    const post = await prisma.workPost.findUnique({ where: { id: postId } });

    if (!post || post.authorId !== userId) {
      return res.status(403).json({ message: "Unauthorized or post not found" });
    }

    await deleteMultipleFromS3(post.images);
    await prisma.workPost.delete({ where: { id: postId } });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete WorkPost Error:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
});

// Toggle upvote on a work post
router.post("/:id/upvote", requireAuth, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;
  
    try {
        const existing = await prisma.upvote.findFirst({
            where: {
              userId,
              forumPostId: null,
              workPostId: postId,
              commentId: null,
            },
          });                  
  
      if (existing) {
        await prisma.upvote.delete({
          where: { id: existing.id },
        });
        return res.json({ liked: false });
      } else {
        await prisma.upvote.create({
          data: { userId, workPostId: postId },
        });
        return res.json({ liked: true });
      }
    } catch (err) {
      console.error("Toggle upvote error:", err);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });
  
  // Add a comment to a work post
router.post("/:id/comments", requireAuth, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;
    const { content } = req.body;
  
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }
  
    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: userId,
          workPostId: postId
        },
        include: {
          author: { select: { id: true, username: true, profilePicture: true } },
          upvotes: true,
          downvotes: true,
        }
      });
  
      res.status(201).json(comment);
    } catch (error) {
      console.error("Create WorkPost Comment Error:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Toggle upvote on a comment
  router.post("/comments/:id/upvote", requireAuth, async (req, res) => {
    const commentId = req.params.id;
    const userId = req.user.userId;
  
    try {
      // Remove existing downvote
      await prisma.downvote.deleteMany({
        where: { userId, commentId }
      });
  
      // Toggle upvote
      const existing = await prisma.upvote.findFirst({
        where: {
          userId,
          commentId,
          forumPostId: null,
          workPostId: null,
        },
      });
  
      if (existing) {
        await prisma.upvote.delete({ where: { id: existing.id } });
        return res.json({ liked: false });
      } else {
        await prisma.upvote.create({ data: { userId, commentId } });
        return res.json({ liked: true });
      }
    } catch (err) {
      console.error("Toggle comment upvote error:", err);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });  
  
  router.post("/comments/:id/downvote", requireAuth, async (req, res) => {
    const commentId = req.params.id;
    const userId = req.user.userId;
  
    try {
      // Remove existing upvote if present
      await prisma.upvote.deleteMany({
        where: { userId, commentId, forumPostId: null, workPostId: null }
      });
  
      // Check if user has already downvoted
      const existingDownvote = await prisma.downvote.findFirst({
        where: { userId, commentId },
      });
  
      if (existingDownvote) {
        await prisma.downvote.delete({ where: { id: existingDownvote.id } });
        return res.json({ downvoted: false });
      } else {
        await prisma.downvote.create({ data: { userId, commentId } });
        return res.json({ downvoted: true });
      }
    } catch (err) {
      console.error("Toggle comment downvote error:", err);
      res.status(500).json({ message: "Failed to toggle downvote" });
    }
  });
  
export default router;