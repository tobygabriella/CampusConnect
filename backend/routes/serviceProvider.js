import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import crypto from "crypto";
import { requireAuth } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/details", requireAuth, upload.fields([
  { name: "workImages" },
  { name: "certificationImages" }
]), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { profession, services, policy, biography, experience, location } = req.body;

    let workImageUrls = [], certificationImageUrls = [];

    // Upload work images to S3
    if (req.files["workImages"]) {
      workImageUrls = await Promise.all(req.files["workImages"].map(async (file) => {
        const fileName = `work-images/${crypto.randomUUID()}-${file.originalname}`;
        await s3.send(new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        }));
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      }));
    }

    // Upload certification images to S3
    if (req.files["certificationImages"]) {
      certificationImageUrls = await Promise.all(req.files["certificationImages"].map(async (file) => {
        const fileName = `certifications/${crypto.randomUUID()}-${file.originalname}`;
        await s3.send(new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        }));
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      }));
    }

    // Check if user already has a service provider profile
    const existingServiceProvider = await prisma.serviceProvider.findUnique({
      where: { userId },
    });

    const parsedServices = JSON.parse(services);

    if (existingServiceProvider) {
      // Delete existing services
      await prisma.service.deleteMany({
        where: { serviceProviderId: existingServiceProvider.id }
      });

      // Update service provider and create new services
      await prisma.$transaction([
        prisma.serviceProvider.update({
          where: { userId },
          data: {
            profession,
            policy,
            biography,
            experience,
            location,
            workImages: workImageUrls.length ? workImageUrls : existingServiceProvider.workImages,
            certificationImages: certificationImageUrls.length ? certificationImageUrls : existingServiceProvider.certificationImages,
          },
        }),
        ...parsedServices.map(service => 
          prisma.service.create({
            data: {
              name: service.name,
              price: parseFloat(service.price),
              duration: parseInt(service.duration),
              serviceProviderId: existingServiceProvider.id
            }
          })
        )
      ]);

      return res.status(200).json({ message: "Service provider details updated successfully!" });
    } else {
      // Create new service provider with services
      await prisma.serviceProvider.create({
        data: {
          userId,
          profession,
          policy,
          biography,
          experience,
          location,
          workImages: workImageUrls,
          certifications: certificationImageUrls,
          services: {
            create: parsedServices.map(service => ({
              name: service.name,
              price: parseFloat(service.price),
              duration: parseInt(service.duration)
            }))
          }
        },
      });

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

export default router;
