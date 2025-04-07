import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware.js";
import { body, validationResult } from "express-validator";

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
          postId,
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
          post: {
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
        postId,
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

    // Validate input
    if ((!postId && !commentId) || (postId && commentId)) {
      return res.status(400).json({ message: "Must specify either postId or commentId" });
    }

    // Remove opposite vote first
    const oppositeType = type === 'upvote' ? 'downvote' : 'upvote';
    await prisma[oppositeType].deleteMany({
      where: {
        userId,
        [postId ? 'postId' : 'commentId']: postId || commentId
      }
    });

    // Check for existing vote
    const existingVote = await prisma[type].findFirst({
      where: {
        userId,
        [postId ? 'postId' : 'commentId']: postId || commentId
      }
    });

    if (existingVote) {
      await prisma[type].delete({ where: { id: existingVote.id } });
      return res.json({ action: "removed" });
    }

    // Create new vote
    await prisma[type].create({
      data: {
        userId,
        [postId ? 'postId' : 'commentId']: postId || commentId
      }
    });

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
        post: {
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