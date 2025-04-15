import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import { uploadToS3, uploadMultipleToS3, deleteFromS3, deleteMultipleFromS3 } from "../utils/s3Uploader.js";
import dotenv from "dotenv";
import multer from "multer";

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
        college: { select: { id: true, name: true } }, // Include more fields
        collegesServed: { select: { id: true, name: true } },
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

    // Check if this profile is following the authenticated user
    const followsYou = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: authenticatedUserId,
        },
      },
    }) ? true : false;


    let responseData = {
      ...user,
      college: user.college,               // { id, name }
      collegeId: user.college?.id || null, // string for form use
    
      collegesServed: user.collegesServed,                  // array of { id, name }
      collegesServedIds: user.collegesServed.map(c => c.id), // array of string
      followersCount,
      followingCount,
      isFollowing,
      followsYou,
    };

    // Include service provider details if applicable
    if (user.role === "service_provider") {
      const serviceProvider = await prisma.serviceProvider.findUnique({
        where: { userId: user.id },
        include: { services: true,
          profession: true },
      });

      if (serviceProvider) {
        responseData = {
          ...responseData,
          profession: serviceProvider.profession?.name || null,
          services: serviceProvider.services,
          policy: serviceProvider.policy,
          biography: serviceProvider.biography,
          experience: serviceProvider.experience,
          location: serviceProvider.location,
          workImages: serviceProvider.workImages,
          certificationImages: serviceProvider.certifications,
          cancellationWindow: serviceProvider.cancellationWindow?.toString() || "24",
          rescheduleFee: serviceProvider.rescheduleFee?.toString() || "0",
          stripeAccountId: serviceProvider.stripeAccountId,
        };
      }
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", requireAuth, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
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
    // Parse arrays
    const collegesServedArray = parseJsonArray(collegesServed);
    const servicesArray = parseJsonArray(services);
    const removedWorkImagesArray = parseJsonArray(removedWorkImages);
    const removedCertificationsArray = parseJsonArray(removedCertifications);    

    // Upload files
    const [newWorkImages, newCertifications] = await Promise.all([
      req.files['workImages'] ? uploadMultipleToS3(req.files['workImages'], 'work-images') : [],
      req.files['certificationImages'] ? uploadMultipleToS3(req.files['certificationImages'], 'certifications') : []
    ]);

    // Delete removed images from S3
    await deleteMultipleFromS3(removedWorkImagesArray);
    await deleteMultipleFromS3(removedCertificationsArray);

    // Upload profile picture
    let profilePictureUrl;
    if (req.files['profilePicture']) {
      profilePictureUrl = await uploadToS3(req.files['profilePicture'][0], 'profile-pictures');
    }

    // Profession record
    let professionRecord = null;
    if (profession) {
      professionRecord = await prisma.profession.findUnique({ where: { name: profession } });
      if (!professionRecord) {
        professionRecord = await prisma.profession.create({ data: { name: profession } });
      }
    }

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
        collegeId: college || null,
        collegesServed: { set: collegesServedArray.map(id => ({ id })) },
        ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
      },
    });

    const existingProvider = await prisma.serviceProvider.findUnique({ where: { userId } });

    const filteredWorkImages = existingProvider?.workImages?.filter(img => !removedWorkImagesArray.includes(img)) || [];
    const filteredCertifications = existingProvider?.certifications?.filter(img => !removedCertificationsArray.includes(img)) || [];

    const isTryingToBecomeProvider = updatedUser.role === 'student' && profession && biography && experience && location && policy;

    if (isTryingToBecomeProvider) {
      // Create service provider record
      await prisma.serviceProvider.create({
        data: {
          userId,
          professionId: professionRecord?.id,
          biography,
          experience,
          location,
          policy,
          workImages: newWorkImages,
          certifications: newCertifications,
        },
      });

      await prisma.user.update({ where: { id: userId }, data: { role: 'service_provider' } });
    }

    if (updatedUser.role === 'service_provider') {
      await prisma.serviceProvider.upsert({
        where: { userId },
        update: {
          professionId: professionRecord?.id,
          biography,
          experience,
          location,
          policy,
          workImages: [...filteredWorkImages, ...newWorkImages],
          certifications: [...filteredCertifications, ...newCertifications],
        },
        create: {
          userId,
          professionId: professionRecord?.id,
          biography,
          experience,
          location,
          policy,
          workImages: newWorkImages,
          certifications: newCertifications,
        },
      });

      const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
      if (servicesArray.length > 0 && provider) {
        await prisma.service.deleteMany({
          where: {
            serviceProviderId: provider.id,
            id: { notIn: servicesArray.filter(s => s.id).map(s => s.id) }
          }
        });

        await Promise.all(servicesArray.map(async (service) => {
          if (service.id) {
            await prisma.service.update({
              where: { id: service.id },
              data: {
                name: service.name,
                price: parseFloat(service.price),
                depositAmount: parseFloat(service.depositAmount),
                duration: parseInt(service.duration),
              }
            });
          } else {
            await prisma.service.create({
              data: {
                name: service.name,
                price: parseFloat(service.price),
                duration: parseInt(service.duration),
                depositAmount: parseFloat(service.depositAmount),
                serviceProviderId: provider.id,
              }
            });
          }
        }));
      }
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
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