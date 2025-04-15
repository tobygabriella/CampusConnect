import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import { chargeRemainingBalance } from "../services/paymentServices.js";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


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
  
  // Create in local timezone first
  const localDate = new Date(`${yyyy}-${mm}-${dd}T${h}:${m}:00`);
  
  // Convert to UTC
  return new Date(localDate.toISOString());
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

  router.post('/validate-booking', requireAuth, async (req, res) => {
    const { serviceId, date, startTime, duration } = req.body;
  
    try {
      //Validate service exists
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { serviceProvider: true }
      });
  
      if (!service) return res.status(404).json({ error: "Service not found" });
  
      const providerId = service.serviceProvider.id;
      const bufferBefore = service.bufferBefore || 0;
      const bufferAfter = service.bufferAfter || 0;
  
      // Convert times
      const startMin = toMinutes(startTime);
      const endMin = startMin + parseInt(duration);
      const adjustedStart = getDateTime(date, startMin - bufferBefore);
      const adjustedEnd = getDateTime(date, endMin + bufferAfter);
  
      //Check for overlapping appointments
      const overlapping = await prisma.appointment.findFirst({
        where: {
          serviceProviderId: providerId,
          startTime: { lt: adjustedEnd },
          endTime: { gt: adjustedStart },
        },
      });
  
      if (overlapping) {
        return res.status(409).json({ error: "This time slot was just booked. Please pick another." });
      }
  
      //Slot is available!
      res.status(200).json({ available: true });
    } catch (err) {
      console.error("validate-booking error:", err);
      res.status(500).json({ error: "Error validating booking" });
    }
  });

  // POST /appointments/:id/confirm
  router.post("/:id/confirm", requireAuth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
  
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { client: true, serviceProvider: true },
      });
  
      if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  
      let updateData = {};
  
      if (appointment.clientId === userId) {
        updateData.clientConfirmed = true;
        updateData.clientConfirmedAt = new Date();
      } else if (appointment.serviceProvider.userId === userId) {
        updateData.providerConfirmed = true;
        updateData.providerConfirmedAt = new Date();
      } else {
        return res.status(403).json({ message: "Not authorized to confirm this appointment" });
      }
  
      const updated = await prisma.appointment.update({
        where: { id },
        data: updateData,
      });

      if (updated.clientConfirmed && updated.providerConfirmed) {
        try {
          await chargeRemainingBalance(updated.id);
      
          await prisma.appointment.update({
            where: { id },
            data: { status: "completed" },
          });
        } catch (error) {
          console.error("Charge remaining error:", error);
      
          // Revert confirmation
          await prisma.appointment.update({
            where: { id },
            data: {
              ...(req.user.userId === appointment.clientId
                ? { clientConfirmed: false, clientConfirmedAt: null }
                : { providerConfirmed: false, providerConfirmedAt: null }
              ),
            },
          });
      
          throw new Error("Payment failed - your confirmation has been reverted");
        }
      }      
  
      res.status(200).json({ message: "Confirmation saved" });
    } catch (error) {
      console.error("Confirmation error:", error);
      res.status(500).json({ message: "Failed to confirm appointment" });
    }
  });  

  router.patch("/:id/add-note", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
  
    try {
      await prisma.appointment.update({
        where: { id },
        data: { notes: note },
      });
  
      res.status(200).json({ message: "Note saved" });
    } catch (error) {
      console.error("Add note error:", error);
      res.status(500).json({ message: "Failed to save note" });
    }
  });

  router.patch("/:id/report-no-show", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { noShow } = req.body; // expected: 'client' or 'provider'
    const userId = req.user.userId;
  
    if (!["client", "provider"].includes(noShow)) {
      return res.status(400).json({ message: "Invalid no-show value" });
    }
  
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { client: true, serviceProvider: true },
      });
  
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
  
      // Authorization check
      if (
        appointment.clientId !== userId &&
        appointment.serviceProvider.userId !== userId
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }
  
      let status = noShow === "client" ? "no_show_client" : "no_show_provider";
  
      await prisma.appointment.update({
        where: { id },
        data: { status },
      });
  
      res.status(200).json({ message: `Marked as ${status}` });
    } catch (error) {
      console.error("Report no-show error:", error);
      res.status(500).json({ message: "Failed to report no-show" });
    }
  });

  // Cancel appointment
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        serviceProvider: {
          include: {
            user: true,
            availability: true
          }
        },
        service: true,
        stripePayments: { where: { type: "deposit" } },
      },
    });

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.clientId !== userId && appointment.serviceProvider.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to cancel this appointment" });
    }    

    const cancellationWindow = appointment.serviceProvider.cancellationWindow || 48;
    const hoursUntil = (new Date(appointment.startTime) - new Date()) / (1000 * 60 * 60);
    const isProviderCancelling = appointment.serviceProvider.userId === userId;
    const isEligibleForRefund = isProviderCancelling || (hoursUntil >= cancellationWindow);

    const dateKey = appointment.startTime.toISOString().split("T")[0];
    const start = appointment.startTime.toISOString().split("T")[1].slice(0, 5);
    const end = appointment.endTime.toISOString().split("T")[1].slice(0, 5);
    const slotToRestore = `${start} - ${end}`;

    await prisma.$transaction(async (tx) => {
      // Update availability
      const availability = appointment.serviceProvider.availability?.availabilityData || {};
      const slots = availability[dateKey] || [];
      slots.push(slotToRestore);
      availability[dateKey] = slots.sort();

      await tx.availability.update({
        where: { serviceProviderId: appointment.serviceProvider.id },
        data: { availabilityData: availability },
      });

      // Update appointment
      await tx.appointment.update({
        where: { id },
        data: { status: "cancelled" },
      });

      if (isEligibleForRefund && appointment.stripePayments.length > 0) {
        const payment = appointment.stripePayments[0];
        await stripe.refunds.create({ payment_intent: payment.paymentIntentId });
        await tx.stripePayment.update({
          where: { paymentIntentId: payment.paymentIntentId },
          data: { status: "refunded" },
        });
      }
    });

    res.status(200).json({ message: isEligibleForRefund ? "Appointment cancelled and refunded" : "Appointment cancelled. No refund." });
  } catch (err) {
    console.error("Cancel appointment error:", err);
    res.status(500).json({ message: "Failed to cancel appointment" });
  }
});

// Reschedule appointment
router.patch("/:id/reschedule", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { newDate, newStartTime } = req.body;
  const userId = req.user.userId;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        serviceProvider: {
          include: { availability: true }
        },
        service: true,
        stripePayments: { where: { type: "deposit" } },
      },
    });

    if (!appointment || appointment.clientId !== userId){
       return res.status(403).json({ message: "Unauthorized or appointment not found" });
    }
    const duration = (new Date(appointment.endTime) - new Date(appointment.startTime)) / (1000 * 60);
    const rescheduleFee = appointment.serviceProvider.rescheduleFee || 0;
    const cancellationWindow = appointment.serviceProvider.cancellationWindow || 48;

    const oldDateKey = appointment.startTime.toISOString().split("T")[0];
    const oldStart = appointment.startTime.toISOString().split("T")[1].slice(0, 5);
    const oldEnd = appointment.endTime.toISOString().split("T")[1].slice(0, 5);
    const oldSlot = `${oldStart} - ${oldEnd}`;

    const startMin = toMinutes(newStartTime);
    const endMin = startMin + duration;
    // Create date objects in local timezone first
    const localStartDateTime = getDateTime(newDate, startMin);
    const localEndDateTime = getDateTime(newDate, endMin);
    
    // Convert to UTC
    const newStartDateTime = new Date(localStartDateTime.toISOString());
    const newEndDateTime = new Date(localEndDateTime.toISOString());
    const newDateKey = newDate;
    const newSlot = `${toHHMM(startMin)} - ${toHHMM(endMin)}`;

    const hoursUntil = (new Date(appointment.startTime) - new Date()) / (1000 * 60 * 60);
    const isFreeReschedule = hoursUntil >= cancellationWindow;

    await prisma.$transaction(async (tx) => {
      // Restore old availability
      const availability = appointment.serviceProvider.availability?.availabilityData || {};
      const oldSlots = availability[oldDateKey] || [];
      oldSlots.push(oldSlot);
      availability[oldDateKey] = oldSlots.sort();

      // Remove new time from availability
      const newSlots = availability[newDateKey] || [];
      const updatedNewSlots = newSlots.filter(slot => slot !== newSlot);
      availability[newDateKey] = updatedNewSlots;

      await tx.availability.update({
        where: { serviceProviderId: appointment.serviceProvider.id },
        data: { availabilityData: availability },
      });

      // Update appointment times
      await tx.appointment.update({
        where: { id },
        data: { startTime: newStartDateTime, endTime: newEndDateTime },
      });

      // Charge reschedule fee
      if (!isFreeReschedule && rescheduleFee > 0) {
        const paymentIntentId = appointment.stripePayments[0]?.paymentIntentId;
        const customerId = appointment.stripePayments[0]?.customerId;

        try {
          await stripe.paymentIntents.create({
            amount: Math.round(rescheduleFee * 100),
            currency: "usd",
            customer: customerId,
            payment_method: appointment.stripePayments[0]?.paymentMethodId,
            confirm: true,
            off_session: true,
            metadata: {
              type: "reschedule",
              appointmentId: id,
            }
          });
        } catch (err) {
          if (
            err?.code === "authentication_required" ||
            err?.code === "card_declined" ||
            err?.raw?.code === "payment_intent_unexpected_state"
          ) {
            throw {
              status: 402,
              message: "We couldn't charge your card. Please re-enter your payment info.",
              requiresAction: true,
            };
          }       
          // Re-throw other Stripe-related errors
          throw err;
        }
        
      }
    });

    res.status(200).json({ message: "Appointment rescheduled successfully" });
  } catch (err) {
    console.error("Reschedule error:", err);
    if (err?.status === 402 && err?.requiresAction) {
      return res.status(402).json({
        message: err.message,
        requiresAction: true,
      });
    }
    
    console.error("Reschedule error:", err);
    res.status(500).json({ message: "Failed to reschedule appointment" });    
  }
});

// GET /appointments/:id
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        serviceProvider: {
          include: { user: true },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Fetch appointment error:", error);
    res.status(500).json({ message: "Failed to fetch appointment" });
  }
});


export default router;