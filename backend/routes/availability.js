import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// Save availability
router.post("/set-availability", requireAuth, async (req, res) => {
    const { availability } = req.body;
    const userId = req.user.userId;
  
    // Validate input
    if (!availability || typeof availability !== "object") {
      return res.status(400).json({ message: "Invalid availability data" });
    }
  
    try {
      // Check if the user is a service provider
      const serviceProvider = await prisma.serviceProvider.findUnique({
        where: { userId },
      });
  
      if (!serviceProvider) {
        return res.status(403).json({ message: "You are not a service provider" });
      }
  
      // Upsert availability data
      const updatedAvailability = await prisma.availability.upsert({
        where: { serviceProviderId: serviceProvider.id },
        update: { availabilityData: availability },
        create: {
          serviceProviderId: serviceProvider.id,
          availabilityData: availability,
        },
      });
  
      res.status(200).json({ message: "Availability updated", updatedAvailability });
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

// Get availability
router.get("/get-availability", requireAuth, async (req, res) => {
  const userId = req.user.userId;

  try {
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId },
      include: { availability: true },
    });

    if (!serviceProvider) {
      return res.status(403).json({ message: "You are not a service provider" });
    }

    // Return an empty object if no availability is set
    if (!serviceProvider.availability) {
      return res.status(200).json({ availabilityData: {} }); // Return empty object
    }
    res.status(200).json(serviceProvider.availability);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

  // Get availability for a specific provider
  router.get("/get-availability/:username", async (req, res) => {
    const { username } = req.params;
  
    try {
      // Find the service provider by username
      const serviceProvider = await prisma.user.findUnique({
        where: { username },
        include: { serviceProvider: { include: { availability: true } } },
      });
  
      if (!serviceProvider || !serviceProvider.serviceProvider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
  
      // Check if availability is set
      if (!serviceProvider.serviceProvider.availability) {
        return res.status(200).json({ availabilityData: {} }); // Return empty object
      }
  
      // Return availability data
      res.status(200).json({ availabilityData: serviceProvider.serviceProvider.availability.availabilityData });
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

export default router;
