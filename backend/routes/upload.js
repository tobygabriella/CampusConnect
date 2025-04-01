import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer configuration (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Helper function for S3 uploads
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

//Profile Picture Upload
router.post("/profile-picture", upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = await uploadToS3(req.file, 'profile-pictures');
    res.json({ 
      success: true,
      imageUrl,
      message: "Profile picture uploaded successfully"
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to upload profile picture"
    });
  }
});

// General File Upload (for multiple purposes)
router.post("/files", upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadResults = await Promise.all(
      req.files.map(file => uploadToS3(file, 'general-uploads'))
    );

    res.json({
      success: true,
      files: uploadResults,
      message: `${req.files.length} file(s) uploaded successfully`
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload files"
    });
  }
});

// Delete File from S3
router.delete("/file", async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ message: "File URL is required" });
    }

    const key = fileUrl.split('.com/')[1];
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));

    res.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("File deletion error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete file"
    });
  }
});

export default router;
