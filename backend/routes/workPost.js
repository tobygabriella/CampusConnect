import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import dotenv from "dotenv";
import { uploadMultipleToS3, deleteMultipleFromS3 } from "../utils/s3Uploader.js";
import { NotificationType, Priority } from "../enums/notifications.js";
import { createNotification } from "../utils/notifications.js";

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

// Get posts for home feed with personalized algorithm
router.get("/feed", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        collegeId: true,
        collegesServed: { select: { id: true } }
      }
    });

    const collegeIds = [
      ...(user.collegeId ? [user.collegeId] : []),
      ...user.collegesServed.map(c => c.id)
    ];

    // Get posts the user has interacted with (liked or commented)
    const [userUpvotes, userComments] = await Promise.all([
      // Get posts the user has liked
      prisma.upvote.findMany({
        where: {
          userId,
          workPostId: { not: null }
        },
        include: {
          workPost: {
            include: {
              author: { select: { id: true } },
              service: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit to recent interactions
      }),
      
      // Get posts the user has commented on
      prisma.comment.findMany({
        where: {
          authorId: userId,
          workPostId: { not: null }
        },
        include: {
          workPost: {
            include: {
              author: { select: { id: true } },
              service: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit to recent interactions
      })
    ]);

    // Extract interaction patterns
    const interactionPatterns = {
      authorIds: new Set(),
      serviceIds: new Set()
    };
    
    // Analyze liked posts
    userUpvotes.forEach(upvote => {
      if (upvote.workPost?.author?.id) {
        interactionPatterns.authorIds.add(upvote.workPost.author.id);
      }
      if (upvote.workPost?.service?.id) {
        interactionPatterns.serviceIds.add(upvote.workPost.service.id);
      }
    });
    
    // Analyze commented posts
    userComments.forEach(comment => {
      if (comment.workPost?.author?.id) {
        interactionPatterns.authorIds.add(comment.workPost.author.id);
      }
      if (comment.workPost?.service?.id) {
        interactionPatterns.serviceIds.add(comment.workPost.service.id);
      }
    });

    // Get all relevant posts
    const posts = await prisma.workPost.findMany({
      where: {
        author: {
          OR: [
            { collegeId: { in: collegeIds } },
            { collegesServed: { some: { id: { in: collegeIds } } } }
          ]
        }
      },
      include: {
        author: { select: { id: true, username: true, profilePicture: true } },
        service: true,
        appointment: {
          include: {
            service: true
          }
        },
        _count: {
          select: {
            upvotes: true,
            comments: true,
          },
        },
        upvotes: { select: { userId: true } },
      },
    });

    // Calculate a score for each post
    const now = new Date();
    const scoredPosts = posts.map(post => {
      // Calculate hours since post creation
      const createdAt = new Date(post.createdAt);
      const hoursSinceCreation = Math.max(1, (now - createdAt) / (1000 * 60 * 60));
      
      // Base recency score - decays with time (higher for newer posts)
      const recencyScore = 100 / Math.sqrt(hoursSinceCreation);
      
      // Engagement score
      const upvoteScore = (post._count.upvotes || 0) * 10;
      const commentScore = (post._count.comments || 0) * 15;
      
      // Relevance score based on user's previous interactions
      let interactionScore = 0;
      
      // Boost posts from authors the user has previously interacted with
      if (interactionPatterns.authorIds.has(post.author.id)) {
        interactionScore += 30;
      }
      
      // Boost posts with services the user has previously interacted with
      if (post.service && interactionPatterns.serviceIds.has(post.service.id)) {
        interactionScore += 25;
      }
      
      // Boost posts with services from appointments the user has interacted with
      if (post.appointment?.service && interactionPatterns.serviceIds.has(post.appointment.service.id)) {
        interactionScore += 25;
      }
      
      // Relevance score
      const isAuthorInSameCollege = post.author.collegeId === user.collegeId;
      const relevanceBoost = isAuthorInSameCollege ? 15 : 0;
      
      // Is post by a service provider? They often post more valuable content
      const isServiceProvider = post.service || post.appointment;
      const serviceProviderBoost = isServiceProvider ? 10 : 0;
      
      // User's own posts get a small boost
      const ownPostBoost = post.author.id === userId ? 5 : 0;
      
      // Calculate final score
      const totalScore = recencyScore + upvoteScore + commentScore +
                        interactionScore + relevanceBoost +
                        serviceProviderBoost + ownPostBoost;
      
      return {
        ...post,
        _algorithmScore: totalScore
      };
    });

    // Sort posts by score (highest first)
    scoredPosts.sort((a, b) => b._algorithmScore - a._algorithmScore);
    
    // Remove the score before sending to client
    const finalPosts = scoredPosts.map(({ _algorithmScore, ...post }) => post);
    
    res.json(finalPosts);
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
            },
          },
          upvotes: { select: { userId: true } },
          downvotes: { select: { userId: true } },
          _count: {
            select: {
              upvotes: true,
              downvotes: true,
              comments: true,
            },
          },
        },
      });
  
      if (!post) return res.status(404).json({ message: "Post not found" });
  
      // Add vote flags to each comment
      const commentsWithUserVotes = post.comments.map((comment) => ({
        ...comment,
        isUpvotedByCurrentUser: comment.upvotes.some((u) => u.userId === userId),
        isDownvotedByCurrentUser: comment.downvotes.some((d) => d.userId === userId),
        _count: {
          upvotes: comment.upvotes.length,
          downvotes: comment.downvotes.length,
        },
      }));
  
      // Add vote flag to post itself
      const isUpvotedByCurrentUser = post.upvotes.some((u) => u.userId === userId);
      const isDownvotedByCurrentUser = post.downvotes.some((d) => d.userId === userId);
  
      res.json({
        ...post,
        comments: commentsWithUserVotes,
        isUpvotedByCurrentUser,
        isDownvotedByCurrentUser,
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

        // Fetch post and author
        const post = await prisma.workPost.findUnique({
          where: { id: postId },
          select: {
            authorId: true,
            id: true,
            caption: true,
            author: { select: { username: true, profilePicture: true } }
          }
        });

        if (post && post.authorId !== userId) {
          const liker = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, profilePicture: true },
          });

          await createNotification({
            app: req.app,
            recipientId: post.authorId,
            senderId: userId,
            type: NotificationType.POST_LIKE,
            title: "New Like",
            message: `@${liker.username} liked your work post.`,
            metadata: {
              workPostId: post.id
            },            
            postIds: { workPostId: post.id },
            priority: Priority.LOW,
          });
        }

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

      const post = await prisma.workPost.findUnique({
        where: { id: postId },
        select: {
          authorId: true,
          id: true,
          caption: true,
        }
      });
      
      if (post && post.authorId !== userId) {
        const commenter = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, profilePicture: true },
        });
      
        await createNotification({
          app: req.app,
          recipientId: post.authorId,
          senderId: userId,
          type: NotificationType.POST_COMMENT,
          title: "New Comment",
          message: `@${commenter.username} commented: "${content}"`,
          metadata: {
            workPostId: post.id
          },          
          postIds: { workPostId: post.id },
          priority: Priority.LOW,
        });
      }      
  
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
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          include: {
            author: true,
            workPost: true
          }
        });
        
        if (comment && comment.authorId !== userId) {
          const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, profilePicture: true }
          });
        
          await createNotification({
            app: req.app,
            recipientId: comment.authorId,
            senderId: userId,
            type: NotificationType.COMMENT_UPVOTE,
            title: "Comment Upvoted",
            message: `@${sender.username} upvoted your comment.`,
            metadata: {
              workPostId: comment.workPostId,
              commentId: comment.id
            },
            postIds: { workPostId: comment.workPostId, commentId: comment.id },
            priority: Priority.LOW
          });
        }
        
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
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          include: {
            author: true,
            workPost: true
          }
        });
        
        if (comment && comment.authorId !== userId) {
          const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, profilePicture: true }
          });
        
          await createNotification({
            app: req.app,
            recipientId: comment.authorId,
            senderId: userId,
            type: NotificationType.COMMENT_DOWNVOTE,
            title: "Comment Upvoted",
            message: `@${sender.username} upvoted your comment.`,
            metadata: {
              workPostId: comment.workPostId,
              commentId: comment.id
            },
            postIds: { workPostId: comment.workPostId, commentId: comment.id },
            priority: Priority.LOW
          });
        }
        
        return res.json({ downvoted: true });
      }
    } catch (err) {
      console.error("Toggle comment downvote error:", err);
      res.status(500).json({ message: "Failed to toggle downvote" });
    }
  });
  
export default router;