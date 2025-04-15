import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { uploadToS3, deleteFromS3 } from "../utils/s3Uploader.js";
import dotenv from "dotenv";
import crypto from "crypto";
import { requireAuth } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/details", requireAuth, upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "workImages" },
  { name: "certificationImages" }
]), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { profession, services, policy, biography, experience, location, cancellationWindow, rescheduleFee } = req.body;

    // Validate inputs
    if (!cancellationWindow || parseInt(cancellationWindow) > 72) {
      return res.status(400).json({ message: "Cancellation window must be between 1 and 72 hours." });
    }

    // Check if profession exists or create it
    let professionRecord = await prisma.profession.findUnique({
      where: { name: profession }
    });

    if (!professionRecord) {
      professionRecord = await prisma.profession.create({
        data: { name: profession }
      });
    }

    const [profilePictureUrl, workImageUrls, certificationImageUrls] = await Promise.all([
      req.files["profilePicture"] ? uploadToS3(req.files["profilePicture"][0], 'profile-pictures') : null,
      req.files["workImages"] ? uploadMultipleToS3(req.files["workImages"], 'work-images') : [],
      req.files["certificationImages"] ? uploadMultipleToS3(req.files["certificationImages"], 'certifications') : []
    ]);
    const parsedServices = JSON.parse(services);

    // Check if user already has a service provider profile
    const existingServiceProvider = await prisma.serviceProvider.findUnique({
      where: { userId },
      include: { profession: true }
    });

    if (existingServiceProvider) {
      // Delete existing services
      await prisma.service.deleteMany({
        where: { serviceProviderId: existingServiceProvider.id }
      });

      // Update service provider and create new services
      await prisma.$transaction([
        profilePictureUrl ? prisma.user.update({
          where: { id: userId },
          data: { profilePicture: profilePictureUrl }
        }) : Promise.resolve(),
        
        prisma.serviceProvider.update({
          where: { userId },
          data: {
            professionId: professionRecord.id,
            policy,
            cancellationWindow: parseInt(cancellationWindow),
            rescheduleFee: parseFloat(rescheduleFee),
            biography,
            experience,
            location,
            workImages: workImageUrls.length ? workImageUrls : existingServiceProvider.workImages,
            certifications: certificationImageUrls.length ? certificationImageUrls : existingServiceProvider.certifications,
          },
        }),
        ...parsedServices.map(service => 
          prisma.service.create({
            data: {
              name: service.name,
              price: parseFloat(service.price),
              duration: parseInt(service.duration),
              depositAmount: parseFloat(service.depositAmount),
              serviceProviderId: existingServiceProvider.id,
            }
          })
        )
      ]);

      return res.status(200).json({ message: "Service provider details updated successfully!" });
    } else {
      await prisma.$transaction([
        // Update user's profile picture if provided
        profilePictureUrl ? prisma.user.update({
          where: { id: userId },
          data: { profilePicture: profilePictureUrl }
        }) : Promise.resolve(),
        
        // Create service provider
        prisma.serviceProvider.create({
          data: {
            userId,
            professionId: professionRecord.id,
            policy,
            cancellationWindow: parseInt(cancellationWindow),
            rescheduleFee: parseFloat(rescheduleFee || 0),
            biography,
            experience,
            location,
            workImages: workImageUrls,
            certifications: certificationImageUrls,
            services: {
              create: parsedServices.map(service => ({
                name: service.name,
                price: parseFloat(service.price),
                duration: parseInt(service.duration),
                depositAmount: parseFloat(service.depositAmount)
              }))
            }
          }
        })
      ]);   

      res.status(201).json({ message: "Service provider details saved successfully!" });
    }
  } catch (error) {
    console.error("Error saving service provider details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/details", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId },
      include: {
        services: true // Include the related services
      }
    });

    if (!serviceProvider) {
      return res.status(404).json({ message: "Service provider details not found" });
    }

    res.status(200).json(serviceProvider);
  } catch (error) {
    console.error("Error fetching service provider details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/professions", async (req, res) => {
  try {
    const professions = await prisma.profession.findMany({
      orderBy: { name: "asc" },
    });
    res.json(professions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch professions" });
  }
});

router.post("/professions", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });

  try {
    const profession = await prisma.profession.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    res.status(201).json(profession);
  } catch (error) {
    res.status(500).json({ message: "Failed to create profession" });
  }
});

export default router;
