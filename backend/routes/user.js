import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

// Configure AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer setup for memory storage (for file uploads)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to upload to S3
const uploadToS3 = async (file, folder) => {
  const fileName = `${folder}/${crypto.randomUUID()}-${file.originalname}`;
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  await s3.send(new PutObjectCommand(uploadParams));
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

// Helper function to delete from S3
const deleteFromS3 = async (url) => {
  try {
    const key = url.split('.com/')[1];
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));
  } catch (error) {
    console.error("Error deleting from S3:", error);
  }
};

// Get user profile
router.get("/profile/:username", requireAuth, async (req, res) => {
  const { username } = req.params;
  const authenticatedUserId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        email: true,
        profilePicture: true,
        college: true,
        collegesServed: true,
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Count followers and following
    const followersCount = await prisma.follow.count({ where: { followingId: user.id } });
    const followingCount = await prisma.follow.count({ where: { followerId: user.id } });

    // Check if authenticated user is following this profile
    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: authenticatedUserId,
          followingId: user.id,
        },
      },
    }) ? true : false;

    let responseData = {
      ...user,
      followersCount,
      followingCount,
      isFollowing,
    };

    // Include service provider details if applicable
    if (user.role === "service_provider") {
      const serviceProvider = await prisma.serviceProvider.findUnique({
        where: { userId: user.id },
        include: { services: true },
      });

      if (serviceProvider) {
        responseData = {
          ...responseData,
          profession: serviceProvider.profession,
          services: serviceProvider.services,
          policy: serviceProvider.policy,
          biography: serviceProvider.biography,
          experience: serviceProvider.experience,
          location: serviceProvider.location,
          workImages: serviceProvider.workImages,
          certificationImages: serviceProvider.certificationImages,
        };
      }
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", requireAuth, upload.fields([
  { name: 'workImages', maxCount: 10 },
  { name: 'certificationImages', maxCount: 10 }
]), async (req, res) => {
  const userId = req.user.userId;
  const {
    name,
    username,
    college,
    collegesServed,
    profession,
    biography,
    experience,
    location,
    policy,
    services,
    removedWorkImages = [],
    removedCertifications = []
  } = req.body;

  try {
    // Parse JSON arrays if they're strings
    const collegesServedArray = Array.isArray(collegesServed) ? 
      collegesServed : 
      (collegesServed ? JSON.parse(collegesServed) : []);
    
    const servicesArray = Array.isArray(services) ? 
      services : 
      (services ? JSON.parse(services) : []);

    // Update basic user info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
        college: college || null,
        collegesServed: collegesServedArray,
      },
    });

    // Handle service provider updates if user is one
    if (updatedUser.role === 'service_provider') {
      const existingProvider = await prisma.serviceProvider.findUnique({
        where: { userId }
      });

      // Handle removed images
      if (removedWorkImages.length > 0) {
        await Promise.all(removedWorkImages.map(url => deleteFromS3(url)));
      }
      if (removedCertifications.length > 0) {
        await Promise.all(removedCertifications.map(url => deleteFromS3(url)));
      }

      // Upload new images
      let newWorkImages = [];
      let newCertifications = [];

      if (req.files['workImages']) {
        newWorkImages = await Promise.all(
          req.files['workImages'].map(file => uploadToS3(file, 'work-images'))
        );
      }

      if (req.files['certificationImages']) {
        newCertifications = await Promise.all(
          req.files['certificationImages'].map(file => uploadToS3(file, 'certifications'))
        );
      }

      // Filter out removed images from existing ones
      const filteredWorkImages = existingProvider?.workImages?.filter(
        img => !removedWorkImages.includes(img)
      ) || [];

      const filteredCertifications = existingProvider?.certificationImages?.filter(
        img => !removedCertifications.includes(img)
      ) || [];

      // Update service provider record
      await prisma.serviceProvider.upsert({
        where: { userId },
        update: {
          profession,
          biography,
          experience,
          location,
          policy,
          workImages: [...filteredWorkImages, ...newWorkImages],
          certificationImages: [...filteredCertifications, ...newCertifications],
        },
        create: {
          userId,
          profession,
          biography,
          experience,
          location,
          policy,
          workImages: newWorkImages,
          certificationImages: newCertifications,
        },
      });

      // Handle services updates if provider exists
      if (existingProvider && servicesArray.length > 0) {
        // Delete services not in the updated list
        await prisma.service.deleteMany({
          where: {
            serviceProviderId: existingProvider.id,
            id: { notIn: servicesArray.filter(s => s.id).map(s => s.id) }
          }
        });

        // Update or create services
        for (const service of servicesArray) {
          if (service.id) {
            await prisma.service.update({
              where: { id: service.id },
              data: {
                name: service.name,
                price: parseFloat(service.price),
                duration: parseInt(service.duration),
              }
            });
          } else {
            await prisma.service.create({
              data: {
                name: service.name,
                price: parseFloat(service.price),
                duration: parseInt(service.duration),
                serviceProviderId: existingProvider.id,
              }
            });
          }
        }
      }
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Get service provider details for editing
router.get("/service-provider/details", requireAuth, async (req, res) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: req.user.userId },
      include: { services: true }
    });

    if (!provider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    res.json({
      ...provider,
      services: provider.services.map(s => ({
        ...s,
        price: s.price.toString(),
        duration: s.duration.toString()
      }))
    });
  } catch (error) {
    console.error("Details fetch error:", error);
    res.status(500).json({ message: "Failed to fetch details" });
  }
});

// Follow a user
router.post("/follow/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.userId;

  try {
    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    await prisma.follow.create({
      data: { followerId, followingId: userId },
    });

    res.json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ message: "Failed to follow user" });
  }
});

// Unfollow a user
router.post("/unfollow/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.userId;

  try {
    // Check if follow relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (!existingFollow) {
      return res.status(400).json({ message: "Not following this user" });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
});

// Check username availability
router.get("/check-username/:username", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
    });
    
    if (user) {
      return res.status(400).json({ available: false, message: "Username already taken" });
    }
    res.json({ available: true });
  } catch (error) {
    console.error("Username check error:", error);
    res.status(500).json({ message: "Error checking username availability" });
  }
});


export default router;