import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware.js";
import { body, validationResult } from "express-validator";
import { NotificationType, Priority } from "../enums/notifications.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();
const prisma = new PrismaClient();

// Helper to recursively fetch replies
async function getRepliesRecursive(commentId) {
  const replies = await prisma.comment.findMany({
    where: { parentId: commentId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
          role: true,
        },
      },
      _count: {
        select: {
          replies: true,
          upvotes: true,
          downvotes: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // For each reply, fetch its nested replies recursively
  for (const reply of replies) {
    reply.replies = await getRepliesRecursive(reply.id);
  }

  return replies;
}

async function getCommentDepth(commentId) {
  let depth = 0;
  let currentId = commentId;

  while (currentId) {
    const comment = await prisma.comment.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!comment || !comment.parentId) break;
    currentId = comment.parentId;
    depth++;
  }

  return depth;
}


// Create a new forum post
router.post(
  "/posts",
  requireAuth,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("content").trim().notEmpty().withMessage("Content is required"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
  ],
   async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          role: true,
          collegeId: true,
          collegesServed: { select: { id: true } }
        }
      });

      if (!user) return res.status(403).json({ message: "User not found" });

      const { title, content, tags, collegeId } = req.body;
  
      const allowedCollegeIds = user.role === 'service_provider'
      ? user.collegesServed.map(c => c.id)
      : user.collegeId ? [user.collegeId] : [];

    if (!allowedCollegeIds.includes(req.body.collegeId)) {
        return res.status(403).json({ 
          message: "You can only post to schools you're associated with" ,
          debug: {
            yourColleges: allowedCollegeIds,
            attemptedCollege: collegeId
          }
        });
      }
          
      const post = await prisma.forumPost.create({
        data: {
          title,
          content,
          authorId: req.user.userId,
          collegeId, 
          tags: tags || [],
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              role: true,
              collegeId: true
            },
          },
        },
      });
  
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

// Get forum posts
router.get("/posts", requireAuth, async (req, res) => {
  try {
    const { college: collegeId, search , tag , page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Require college parameter
    if (!collegeId) {
      return res.status(400).json({ message: "College parameter is required" });
    }

    // Strict filtering - only posts for the specified college
    const where = { collegeId };

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            has: search,
          },
        },
      ];
    }
    
    const posts = await prisma.forumPost.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            role: true
          }
        },
        college: true,
        _count: {
          select: {
            comments: true,
            upvotes: true,
            downvotes: true
          }
        }
      }
    });

    const total = await prisma.forumPost.count({ where });

    // Get user's colleges for the filter dropdown
    const userWithColleges = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        college: true,
        collegesServed: true
      }
    });

    res.json({
      posts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      userColleges: [
        ...(userWithColleges.college ? [userWithColleges.college] : []),
        ...(userWithColleges.collegesServed || [])
      ],
      availableColleges: await prisma.college.findMany({
        where: { state: "MA" },
        orderBy: { name: "asc" }
      })
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// Get a single post with full details
router.get("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            role: true,
            collegeId: true
          }
        },
        college: true,
        _count: {
          select: {
            comments: true,
            upvotes: true,
            downvotes: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// Create a comment
router.post(
  "/comments",
  requireAuth,
  [
    body("content").trim().notEmpty().withMessage("Content is required"),
    body("postId").trim().notEmpty().withMessage("Post ID is required"),
    body("parentId").optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { content, postId, parentId } = req.body;
      const authorId = req.user.userId;

      // Process mentions
      const mentionRegex = /@(\w+)/g;
      let mentions = [];
      let match;
      while ((match = mentionRegex.exec(content))) {
        const username = match[1];
        const user = await prisma.user.findUnique({ where: { username } });
        if (user) mentions.push(user.id);
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          authorId,
          forumPostId: postId,
          parentId: parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              role: true,
            },
          },
          forumPost: {
            select: {
              id: true,
              title: true,
            },
          },
          parent: {
            select: {
              id: true,
              author: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      if (!parentId) {
        // Case 1: Top-level comment → notify post author
        const post = await prisma.forumPost.findUnique({
          where: { id: postId },
          select: { id: true, authorId: true }
        });
      
        if (post && post.authorId !== authorId) {
          const sender = await prisma.user.findUnique({
            where: { id: authorId },
            select: { username: true, profilePicture: true }
          });
      
          await createNotification({
            app: req.app,
            recipientId: post.authorId,
            senderId: authorId,
            type: NotificationType.POST_COMMENT,
            title: "New Comment",
            message: `@${sender.username} commented on your forum post.`,
            metadata: {
              forumPostId: post.id,
              commentId: comment.id
            },
            postIds: { forumPostId: post.id },
            priority: Priority.LOW
          });
        }
      } else {
        // ✅ Case 2: Reply → notify parent comment author
        const parent = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { authorId: true, forumPostId: true }
        });
      
        if (parent && parent.authorId !== authorId) {
          const sender = await prisma.user.findUnique({
            where: { id: authorId },
            select: { username: true, profilePicture: true }
          });
          const depth = await getCommentDepth(parentId);

          await createNotification({
            app: req.app,
            recipientId: parent.authorId,
            senderId: authorId,
            type: NotificationType.COMMENT_REPLY,
            title: "New Reply",
            message: `@${sender.username} replied to your comment.`,
            metadata: {
              forumPostId: parent.forumPostId,
              commentId: comment.id,
              depth: depth + 1
            },
            postIds: { forumPostId: parent.postId },
            priority: Priority.LOW
          });
        }
      }      

      // Create mentions
      if (mentions.length > 0) {
        await prisma.mention.createMany({
          data: mentions.map((userId) => ({
            userId,
            commentId: comment.id,
          })),
        });
      }

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  }
);

// Get comments for a post
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;

    const topLevelComments = await prisma.comment.findMany({
      where: {
        forumPostId: postId,  
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            role: true,
          },
        },
        _count: {
          select: {
            replies: true,
            upvotes: true,
            downvotes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Populate all nested replies recursively
    for (const comment of topLevelComments) {
      comment.replies = await getRepliesRecursive(comment.id);
    }

    res.json(topLevelComments);
  } catch (error) {
    console.error("Error fetching nested comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Vote on post or comment
router.post("/vote", requireAuth, async (req, res) => {
  try {
    const { type, postId, commentId } = req.body;
    const userId = req.user.userId;

    if ((!postId && !commentId) || (postId && commentId)) {
      return res.status(400).json({ message: "Must specify either postId or commentId" });
    }
    let voteKey;
    let voteTarget;
    let notificationMeta = {};
    
    if (postId) {
      voteKey = "forumPostId";
      voteTarget = postId;
      notificationMeta.forumPostId = postId;
    } else if (commentId) {
      voteKey = "commentId";
      voteTarget = commentId;
      notificationMeta.commentId = commentId;
    }

    // Remove opposite vote
    const oppositeType = type === "upvote" ? "downvote" : "upvote";
    await prisma[oppositeType].deleteMany({
      where: {
        userId,
        [voteKey]: voteTarget,
      },
    });

    // Check if already voted
    const existingVote = await prisma[type].findFirst({
      where: {
        userId,
        [voteKey]: voteTarget,
      },
    });

    if (existingVote) {
      await prisma[type].delete({ where: { id: existingVote.id } });
      return res.json({ action: "removed" });
    }

    // Create vote
    await prisma[type].create({
      data: {
        userId,
        [voteKey]: voteTarget,
      },
    });

    // ✅ Send notification if not voting on your own content
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, profilePicture: true },
    });

    if (postId) {
      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (post && post.authorId !== userId) {
        await createNotification({
          app: req.app,
          recipientId: post.authorId,
          senderId: userId,
          type: type === "upvote" ? NotificationType.POST_LIKE : NotificationType.POST_DOWNVOTE,
          title: type === "upvote" ? "Forum Post Upvoted" : "Forum Post Downvoted",
          message: `@${sender.username} ${type}d your forum post.`,
          metadata: notificationMeta,
          postIds: { forumPostId: postId },
          priority: Priority.LOW,
        });
      }
    }

    if (commentId) {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          authorId: true,
          forumPostId: true,
        },
      });

      if (comment && comment.authorId !== userId) {
        await createNotification({
          app: req.app,
          recipientId: comment.authorId,
          senderId: userId,
          type: type === "upvote" ? NotificationType.COMMENT_UPVOTE : NotificationType.COMMENT_DOWNVOTE,
          title: type === "upvote" ? "Comment Upvoted" : "Comment Downvoted",
          message: `@${sender.username} ${type}d your comment.`,
          metadata: {
            forumPostId: comment.forumPostId,
            commentId: commentId,
          },
          postIds: { forumPostId: comment.forumPostId},
          priority: Priority.LOW,
        });
      }
    }

    res.json({ action: "added" });
  } catch (error) {
    console.error("Error processing vote:", error);
    res.status(500).json({ message: "Failed to process vote" });
  }
});

router.get("/colleges", async (req, res) => {
  try {
    const collegesWithPosts = await prisma.forumPost.findMany({
      distinct: ["collegeId"],
      where: { collegeId: { not: null } },
      include: { college: true },
    });

    const allColleges = await prisma.college.findMany({
      where: { state: "MA" },
      orderBy: { name: "asc" },
    });

    const combinedColleges = [
      ...collegesWithPosts.map(p => p.college),
      ...allColleges,
    ];

    const uniqueColleges = Array.from(new Map(
      combinedColleges.map(c => [c.id, c])
    ).values());

    res.json(uniqueColleges);
  } catch (error) {
    console.error("Error fetching colleges:", error);
    res.status(500).json({ message: "Failed to fetch colleges" });
  }
});

router.get("/comments/:commentId/thread", async (req, res) => {
  try {
    const { commentId } = req.params;

    const rootComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            role: true,
          },
        },
        forumPost: {
          include: {
            author: true,
            _count: {
              select: { upvotes: true, downvotes: true, comments: true }
            }
          }
        },
        _count: {
          select: {
            replies: true,
            upvotes: true,
            downvotes: true,
          },
        },
      },
    });

    if (!rootComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    rootComment.replies = await getRepliesRecursive(commentId);

    res.json(rootComment);
  } catch (error) {
    console.error("Error fetching comment thread:", error);
    res.status(500).json({ message: "Failed to fetch comment thread" });
  }
});

router.get("/tags", async (req, res) => {
  try {
    const allTags = await prisma.forumPost.findMany({
      select: { tags: true },
      where: {
        tags: { isEmpty: false }
      },
    });

    const tagSet = new Set(allTags.flatMap((post) => post.tags));
    const tagArray = Array.from(tagSet);

    res.json(tagArray);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ message: "Failed to fetch tags" });
  }
});

export default router;