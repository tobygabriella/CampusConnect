import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Helpers
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const getDateTime = (dateStr, minutes) => {
    const [yyyy, mm, dd] = dateStr.split("-");
    const h = Math.floor(minutes / 60).toString().padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return new Date(`${yyyy}-${mm}-${dd}T${h}:${m}:00Z`); // Note the 'Z' for UTC
  };

const isTimeSlotAvailable = (availableSlots, start, end) => {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  return availableSlots.some(slot => {
    const [s, e] = slot.split(" - ");
    const sMin = toMinutes(s);
    const eMin = toMinutes(e);
    return startMin >= sMin && endMin <= eMin;
  });
};

const updateAvailability = (availableSlots, bookedStart, bookedEnd) => {
  const startMin = toMinutes(bookedStart);
  const endMin = toMinutes(bookedEnd);
  const updated = [];

  for (let slot of availableSlots) {
    const [slotStart, slotEnd] = slot.split(" - ");
    const sMin = toMinutes(slotStart);
    const eMin = toMinutes(slotEnd);

    if (startMin >= sMin && endMin <= eMin) {
      // Before part
      if (startMin > sMin) {
        updated.push(`${slotStart} - ${toHHMM(startMin)}`);
      }
      // After part
      if (endMin < eMin) {
        updated.push(`${toHHMM(endMin)} - ${slotEnd}`);
      }
    } else {
      updated.push(slot); // Unaffected slot
    }
  }

  return updated;
};

// Route
router.post("/create", requireAuth, async (req, res) => {
  const { providerUsername, serviceId, date, startTime, duration } = req.body;
  const userId = req.user.userId;

  try {
    // Get provider + services
    const serviceProvider = await prisma.user.findUnique({
      where: { username: providerUsername },
      include: {
        serviceProvider: {
          include: { availability: true, services: true },
        },
      },
    });

    if (!serviceProvider || !serviceProvider.serviceProvider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    const service = serviceProvider.serviceProvider.services.find(s => s.id === serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const bufferBefore = service.bufferBefore || 0;
    const bufferAfter = service.bufferAfter || 0;

    // Convert to minutes
    const startMin = toMinutes(startTime);
    const endMin = startMin + duration;
    const adjustedStartMin = startMin - bufferBefore;
    const adjustedEndMin = endMin + bufferAfter;

    // Convert to DateTime
    const startDateTime = getDateTime(date, startMin);
    const endDateTime = getDateTime(date, endMin);
    const adjustedStart = getDateTime(date, adjustedStartMin);
    const adjustedEnd = getDateTime(date, adjustedEndMin);

    // Get availability
    const availabilityData = serviceProvider.serviceProvider.availability?.availabilityData || {};
    const daySlots = availabilityData[date] || [];

    // Slot check
    if (!isTimeSlotAvailable(daySlots, startTime, toHHMM(endMin))) {
      return res.status(400).json({ message: "Time slot not available" });
    }

    // Overlap check
    const overlapping = await prisma.appointment.findMany({
      where: {
        serviceProviderId: serviceProvider.serviceProvider.id,
        startTime: { lte: adjustedEnd },
        endTime: { gte: adjustedStart },
      },
    });

    if (overlapping.length > 0) {
      return res.status(400).json({ message: "Time slot overlaps with an existing booking" });
    }

    // Update availability
    const updatedSlots = updateAvailability(daySlots, startTime, toHHMM(endMin));
    availabilityData[date] = updatedSlots;

    await prisma.availability.update({
      where: { serviceProviderId: serviceProvider.serviceProvider.id },
      data: { availabilityData },
    });

    // Create appointment
    await prisma.appointment.create({
      data: {
        clientId: userId,
        serviceId,
        serviceProviderId: serviceProvider.serviceProvider.id,
        startTime: startDateTime,
        endTime: endDateTime,
      },
    });

    res.status(200).json({ message: "Booking confirmed" });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Failed to book service" });
  }
});

router.get("/", requireAuth, async (req, res) => {
    const userId = req.user.userId;
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { serviceProvider: true },
      });
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Get ALL appointments where user is either client OR provider
      const appointments = await prisma.appointment.findMany({
        where: {
          OR: [
            { clientId: userId }, // Appointments where user is client
            { serviceProvider: { userId: userId } } // Appointments where user is provider
          ]
        },
        include: {
          client: true,
          service: true,
          serviceProvider: { include: { user: true } },
        },
        orderBy: { startTime: "desc" },
      });
  
      res.status(200).json(appointments);
    } catch (error) {
      console.error("Fetch appointments error:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

export default router;