import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

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

// Set up Multer for local file handling before upload
const storage = multer.memoryStorage(); // Stores file in memory before sending to S3
const upload = multer({ storage });

// Upload Profile Picture Route
router.post("/profile-picture", upload.single("profilePicture"), async (req, res) => {
  const userId = req.user.userId; // Extracted from JWT

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    // Generate a random filename to avoid conflicts
    const fileName = `profile-pictures/${crypto.randomUUID()}-${req.file.originalname}`;

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: "public-read", // Makes the image publicly accessible
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // Get image URL
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Update user's profile picture in database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: imageUrl },
    });

    res.json({ message: "Profile picture uploaded successfully!", imageUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Error uploading profile picture" });
  }
});

export default router;
