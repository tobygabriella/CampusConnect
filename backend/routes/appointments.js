import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import { chargeRemainingBalance } from "../services/paymentServices.js";
import { NotificationType, Priority } from "../enums/notifications.js";
import { createNotification } from "../utils/notifications.js";
import { sendAppointmentEmail } from "../utils/emailService.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import {toMinutes, toDateUTC, restoreSlotToAvailability, removeSlotFromAvailability} from "../utils/updateAvailability.js";


dayjs.extend(utc);

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getDateTime = (dateStr, minutes) => {
  if (!dateStr || isNaN(minutes)) {
    console.error("❌ Invalid input to getDateTime:", { dateStr, minutes });
    return new Date("invalid");
  }

  const [yyyy, mm, dd] = dateStr.split("-");
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");

  const utcString = `${yyyy}-${mm}-${dd}T${h}:${m}:00Z`;
  return new Date(utcString);
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
        include: {
          client: true,
          serviceProvider: {
            include: { user: true },
          },
          service: true,
        },
      });
      
  
      if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  
      let updateData = {};
  
      if (appointment.clientId === userId) {
        if (!appointment.providerConfirmed) {
          return res.status(400).json({
            message: "You cannot confirm until the provider confirms first.",
          });
        }
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

          const serviceName = appointment.service.name;
          const formattedDate = new Date(appointment.startTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          const formattedTime = new Date(appointment.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

          // Notify client
          await createNotification({
            app: req.app,
            recipientId: appointment.clientId,
            senderId: appointment.serviceProvider.userId,
            type: NotificationType.APPOINTMENT_COMPLETED,
            title: "Appointment Completed",
            message: `You and ${appointment.serviceProvider.user.name} confirmed that your "${serviceName}" appointment on ${formattedDate} at ${formattedTime} was completed.`,
            metadata: { appointmentId: id },
            postIds: {},
            priority: Priority.HIGH
          });

          // Notify provider
          await createNotification({
            app: req.app,
            recipientId: appointment.serviceProvider.userId,
            senderId: appointment.clientId,
            type: NotificationType.APPOINTMENT_COMPLETED,
            title: "Appointment Completed",
            message: `You and your client confirmed that the "${serviceName}" appointment on ${formattedDate} at ${formattedTime} was completed. You've been paid in full.`,
            metadata: { appointmentId: id },
            postIds: {},
            priority: Priority.HIGH
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
      return res.status(500).json({
        message: error.message || "Failed to confirm appointment",
        code: error.code || "unknown_error"
      });
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

      const serviceName = appointment.service.name;
      const formattedDate = new Date(appointment.startTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const formattedTime = new Date(appointment.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      const isClientNoShow = noShow === "client";
      const reporter = await prisma.user.findUnique({ where: { id: userId } });
      const otherPartyId = isClientNoShow ? appointment.clientId : appointment.serviceProvider.userId;

      // Notify the reported party
      await createNotification({
        app: req.app,
        recipientId: otherPartyId,
        senderId: userId,
        type: NotificationType.APPOINTMENT_NO_SHOW,
        title: "No-Show Reported",
        message: `You were reported as a no-show for your appointment "${serviceName}" on ${formattedDate} at ${formattedTime} by ${reporter.name}.`,
        metadata: { appointmentId: id },
        postIds: {},
        priority: Priority.HIGH
      });

      // Confirm report to reporter
      await createNotification({
        app: req.app,
        recipientId: userId,
        senderId: otherPartyId,
        type: NotificationType.APPOINTMENT_NO_SHOW,
        title: "No-Show Logged",
        message: `You reported ${isClientNoShow ? "your client" : "your provider"} as a no-show for "${serviceName}" on ${formattedDate} at ${formattedTime}.`,
        metadata: { appointmentId: id },
        postIds: {},
        priority: Priority.HIGH
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
        client: true, 
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

    await prisma.$transaction(async (tx) => {
    // Update availability (with cross-midnight support)
    const availability = appointment.serviceProvider.availability?.availabilityData || {};
    restoreSlotToAvailability(availability, appointment.startTime, appointment.endTime);

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

    const serviceName = appointment.service.name;
    const formattedDate = appointment.startTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const formattedTime = appointment.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const refundMsg = isEligibleForRefund ? " A full refund has been issued." : "";

    const otherPartyId = userId === appointment.clientId ? appointment.serviceProvider.userId : appointment.clientId;

    // Notify user who performed the cancellation
    await createNotification({
      app: req.app,
      recipientId: userId,
      senderId: otherPartyId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      title: "Cancellation Confirmed",
      message: `You cancelled your appointment for "${serviceName}" on ${formattedDate} at ${formattedTime}.${refundMsg}`,
      metadata: { appointmentId: id },
      postIds: {},
      priority: Priority.HIGH
    });

    // Notify the other party
    await createNotification({
      app: req.app,
      recipientId: otherPartyId,
      senderId: userId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      title: "Appointment Cancelled",
      message: `Your appointment for "${serviceName}" on ${formattedDate} at ${formattedTime} has been cancelled by the other party.${refundMsg}`,
      metadata: { appointmentId: id },
      postIds: {},
      priority: Priority.HIGH
    });

    // Format email
    const emailInfo = {
      name: userId === appointment.clientId ? appointment.serviceProvider.user.name : appointment.client.name,
      service: serviceName,
      provider: userId === appointment.clientId ? appointment.serviceProvider.user.name : appointment.client.name,
      date: formattedDate,
      time: formattedTime,
      duration: appointment.service.duration / 60,
      location: appointment.serviceProvider.location,
      type: "cancelled",
    };

    // Email both users
    await sendAppointmentEmail({ ...emailInfo, to: appointment.client.email });
    await sendAppointmentEmail({ ...emailInfo, to: appointment.serviceProvider.user.email });

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
        client: true, 
        serviceProvider: {
          include: { availability: true, user: true  }
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

    const startMin = toMinutes(newStartTime);
    const endMin = startMin + duration;
    
    // Create date objects in local timezone first
    const newStartDateTime = toDateUTC(newDate, startMin);
    const newEndDateTime = toDateUTC(newDate, endMin);
    
    const newDateKey = newDate;

    const hoursUntil = (new Date(appointment.startTime) - new Date()) / (1000 * 60 * 60);
    const isFreeReschedule = hoursUntil >= cancellationWindow;

    await prisma.$transaction(async (tx) => {
      // Restore old availability
      const availability = appointment.serviceProvider.availability?.availabilityData || {};
      restoreSlotToAvailability(availability, appointment.startTime, appointment.endTime);
      
      // Remove rescheduled time from availability across both days
      removeSlotFromAvailability(availability, newDateKey, newStartTime, duration);

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

    const formattedDate = newStartDateTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const formattedTime = newStartDateTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const serviceName = appointment.service.name;
    const providerName = appointment.serviceProvider.user.name;
    const providerAddress = appointment.serviceProvider.location;

    // Notify provider
    await createNotification({
      app: req.app,
      recipientId: appointment.serviceProvider.userId,
      senderId: userId,
      type: NotificationType.APPOINTMENT_RESCHEDULED,
      title: "Appointment Rescheduled",
      message: `Your client has rescheduled their appointment for "${serviceName}" to ${formattedDate} at ${formattedTime}.`,
      metadata: { appointmentId: id },
      postIds: {},
      priority: Priority.HIGH
    });

    // Notify client
    await createNotification({
      app: req.app,
      recipientId: userId,
      senderId: appointment.serviceProvider.userId,
      type: NotificationType.APPOINTMENT_RESCHEDULED,
      title: "Reschedule Confirmed",
      message: `Your appointment for "${serviceName}" with ${providerName} at ${providerAddress} has been successfully rescheduled to ${formattedDate} at ${formattedTime}.`,
      metadata: { appointmentId: id },
      postIds: {},
      priority: Priority.HIGH
    });

    const emailInfo = {
      name: appointment.client.name,
      service: serviceName,
      provider: providerName,
      date: formattedDate,
      time: formattedTime,
      duration: appointment.service.duration / 60,
      location: providerAddress,
      type: "rescheduled",
    };
    
    // Email both parties
    await sendAppointmentEmail({ ...emailInfo, to: appointment.client.email });
    await sendAppointmentEmail({
      ...emailInfo,
      name: providerName,
      provider: appointment.client.name,
      to: appointment.serviceProvider.user.email,
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