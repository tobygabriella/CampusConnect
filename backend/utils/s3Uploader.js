import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a single file to S3
 * @param {Object} file - The file object (should have buffer, originalname, mimetype)
 * @param {string} folder - The S3 folder to upload to
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export const uploadToS3 = async (file, folder) => {
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

/**
 * Uploads multiple files to S3
 * @param {Array} files - Array of file objects
 * @param {string} folder - The S3 folder to upload to
 * @returns {Promise<Array<string>>} Array of public URLs
 */
export const uploadMultipleToS3 = async (files, folder) => {
  if (!files || files.length === 0) return [];
  
  return Promise.all(
    files.map(file => uploadToS3(file, folder))
  ).catch(error => {
    console.error("Error uploading files to S3:", error);
    throw error;
  });
};


/**
 * Deletes a file from S3
 * @param {string} url - The public URL of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (url) => {
  try {
    const key = url.split('.com/')[1];
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw error;
  }
};

/**
 * Deletes multiple files from S3
 * @param {Array<string>} urls - Array of public URLs to delete
 * @returns {Promise<void>}
 */
export const deleteMultipleFromS3 = async (urls) => {
  if (!urls || urls.length === 0) return;
  
  await Promise.all(
    urls.map(url => deleteFromS3(url))
  ).catch(error => {
    console.error("Error deleting files from S3:", error);
    throw error;
  });
};