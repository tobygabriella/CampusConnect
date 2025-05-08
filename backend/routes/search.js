import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Search Route
router.get("/", requireAuth, async (req, res) => {
    try {
      const { query, filter } = req.query;
  
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
  
      let results = [];
  
      // Helper function to add unique results
      const addUniqueResults = (newResults) => {
        newResults.forEach((result) => {
          if (!results.some((r) => r.id === result.id)) {
            results.push(result);
          }
        });
      };
  
      // Search for users
      if (filter === "users" || filter === "all") {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { id: true, username: true, name: true, role: true, profilePicture: true },
        });
        addUniqueResults(users.map((user) => ({ ...user, role: "user" })));
      }
  
      // Search for service providers
      if (filter === "service_providers" || filter === "all") {
        const serviceProviders = await prisma.serviceProvider.findMany({
          where: {
            OR: [
              { profession: { name: { contains: query, mode: "insensitive", },},},
              { biography: { contains: query, mode: "insensitive" } },
              { user: { name: { contains: query, mode: "insensitive" } } },
              { user: { username: { contains: query, mode: "insensitive" } } },
            ],
          },
          include: {
            user: { select: { id: true, username: true, profilePicture: true } },
          },
        });
  
        addUniqueResults(
          serviceProviders.map((sp) => ({
            id: sp.user.id,
            username: sp.user.username,
            name: sp.profession,
            profilePicture: sp.user.profilePicture,
            role: "service_provider",
          }))
        );
      }
  
      // Search for services
      if (filter === "services" || filter === "all") {
        const services = await prisma.service.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { serviceProvider: { profession: { name: { contains: query, mode: "insensitive", },},},},
              { serviceProvider: { user: { name: { contains: query, mode: "insensitive" } } } },
              { serviceProvider: { user: { username: { contains: query, mode: "insensitive" } } } },
            ],
          },
          include: {
            serviceProvider: {
              include: { user: { select: { username: true, profilePicture: true } } },
            },
          },
        });
  
        addUniqueResults(
          services.map((service) => ({
            id: service.id,
            name: service.name,
            username: service.serviceProvider.user.username,
            profilePicture: service.serviceProvider.user.profilePicture,
            role: "service",
          }))
        );
      }
  
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

export default router;
