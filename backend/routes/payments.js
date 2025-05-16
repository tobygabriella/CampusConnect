import express from "express";
import Stripe from "stripe";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';
import { NotificationType, Priority } from "../enums/notifications.js";
import { createNotification } from "../utils/notifications.js";
import { sendAppointmentEmail } from "../utils/emailService.js";
import {toMinutes, removeSlotFromAvailability} from "../utils/updateAvailability.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Deposit Payment
router.post("/create-deposit", requireAuth, async (req, res) => {
  const { serviceId, providerUsername, paymentMethodId, appointmentId } = req.body;
  const userId = req.user.userId;

  try {
    const serviceProvider = await prisma.user.findUnique({
      where: { username: providerUsername },
      include: {
        serviceProvider: { include: { services: true } },
      },
    });

    if (!serviceProvider?.serviceProvider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    const stripeAccountId = serviceProvider.serviceProvider.stripeAccountId;
    if (!stripeAccountId) {
      return res.status(400).json({
        message: "This provider has not completed Stripe onboarding and cannot accept bookings.",
      });
    }

    const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);
    if (!stripeAccount.payouts_enabled || !stripeAccount.details_submitted) {
      return res.status(400).json({
        message: "This provider has not completed Stripe setup and cannot accept payments.",
      });
    }

    const service = serviceProvider.serviceProvider.services.find((s) => s.id === serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    // Attach and confirm payment method
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    //  Create payment intent for deposit
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(service.depositAmount * 100),
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      setup_future_usage: "off_session",
      payment_method_types: ['card'],
      metadata: {
        type: "deposit",
        serviceId,
        providerId: serviceProvider.serviceProvider.id,
        clientId: userId,
        date: req.body.date,
        startTime: req.body.startTime,
        duration: req.body.duration,
      },
      
      transfer_data: {
        destination: serviceProvider.serviceProvider.stripeAccountId,
      },
      application_fee_amount: Math.round(service.depositAmount * 0.10), // 10% fee
    });
    

    res.status(200).json({ message: "Deposit paid", paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ message: "Failed to process deposit", error: error.message });
  }
});

// Stripe Webhook
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      const {
        appointmentId,
        type = "unknown",
        serviceId,
        providerId,
        clientId,
        date,
        startTime,
        duration,
      } = intent.metadata || {};       
      
      if (type === "deposit" && (!appointmentId || appointmentId === "undefined")) {
        const toDate = (d, minutes) => {
          return dayjs.utc(`${d}T00:00:00Z`).add(minutes, 'minute').toDate();
        };
              

        const startMin = toMinutes(startTime);
        const endMin = startMin + parseInt(duration);
        const startTimeDate = toDate(date, startMin);
        const endTimeDate = toDate(date, endMin);

        console.log("Start UTC:", startTimeDate.toISOString());
console.log("End UTC:", endTimeDate.toISOString());

        //Check for overlapping appointment
        const overlapping = await prisma.appointment.findFirst({
          where: {
            serviceProviderId: providerId,
            startTime: { lt: endTimeDate },
            endTime: { gt: startTimeDate },
            NOT: {
              status: {
                in: ["cancelled", "no_show_client", "no_show_provider"], 
              },
            },
          },
        });        

        if (overlapping) {
          console.warn("Race condition detected — issuing refund");

          await stripe.refunds.create({
            payment_intent: intent.id,
          });

          await prisma.stripePayment.create({
            data: {
              paymentIntentId: intent.id,
              appointmentId: null,
              type,
              status: "refunded",
              amount: intent.amount,
              currency: intent.currency || "usd",
            },
          });

          await createNotification({
            app: req.app,
            recipientId: clientId,
            senderId: null,
            type: NotificationType.APPOINTMENT_FAILED,
            title: "Booking Failed",
            message: "We couldn’t book your appointment because the time was no longer available. A full refund has been issued.",
            metadata: {},
            postIds: {},
            priority: Priority.HIGH
          });          

          return res.status(200).json({ message: "Payment refunded due to time conflict." });
        }

        // Create appointment + log payment
        await prisma.$transaction(async (tx) => {
          const createdAppointment = await tx.appointment.create({
            data: {
              clientId,
              serviceId,
              serviceProviderId: providerId,
              startTime: startTimeDate,
              endTime: endTimeDate,
              status: "confirmed",
            },
          });

          // Update availability
          const availabilityRecord = await tx.availability.findUnique({
            where: { serviceProviderId: providerId }
          });
          console.log(availabilityRecord)

          if (availabilityRecord) {
            const availabilityData = availabilityRecord.availabilityData || {};      
            removeSlotFromAvailability(availabilityData, date, startTime, duration);
          
            await tx.availability.update({
              where: { serviceProviderId: providerId },
              data: { availabilityData }
            });
          }          

          await tx.stripePayment.create({
            data: {
              paymentIntentId: intent.id,
              appointmentId: createdAppointment.id,
              type,
              status: "succeeded",
              amount: intent.amount,
              currency: intent.currency || "usd",
            },
          });

          const serviceData = await prisma.service.findUnique({
            where: { id: serviceId },
            select: {
              name: true,
              price: true,
              depositAmount: true,
              serviceProvider: {
                select: {
                  location: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          });
                   
          
          const formattedDate = new Date(startTimeDate).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          });
          
          const formattedTime = new Date(startTimeDate).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
          });
          
          const providerName = serviceData.serviceProvider.user.name;
          const providerAddress = serviceData.serviceProvider.location;
          const serviceName = serviceData.name;
          const providerUserId = serviceData.serviceProvider.user.id;

          const client = await prisma.user.findUnique({
            where: { id: clientId },
            select: { name: true, email: true},
          });
          
          // Notify the provider
          await createNotification({
            app: req.app,
            recipientId: providerUserId,
            senderId: clientId,
            type: NotificationType.APPOINTMENT_BOOKED,
            title: "New Appointment",
            message: `You have a new appointment for "${serviceName}" on ${formattedDate} at ${formattedTime} with ${client.name}.`,
            metadata: {
              appointmentId: createdAppointment.id,
            },
            postIds: {},
            priority: Priority.HIGH
          });
          
          // Notify the client
          await createNotification({
            app: req.app,
            recipientId: clientId,
            senderId: providerUserId,
            type: NotificationType.APPOINTMENT_BOOKED,
            title: "Booking Confirmed",
            message: `Your appointment for "${serviceName}" with ${providerName} at ${providerAddress} is confirmed for ${formattedDate} at ${formattedTime}.`,
            metadata: {
              appointmentId: createdAppointment.id,
            },
            postIds: {},
            priority: Priority.HIGH
          });      
          // Format email fields
          const formattedDateStr = startTimeDate.toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric"
          });
          const formattedTimeStr = startTimeDate.toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit"
          });
          const appointmentDuration = (endTimeDate - startTimeDate) / (1000 * 60 * 60); // in hours
          const depositPaid = serviceData.depositAmount || 0;
          const totalPrice = serviceData.price;
          const remainingBalance = totalPrice - depositPaid;

          // Send email to client
          await sendAppointmentEmail({
            to: client.email,
            name: client.name,
            service: serviceName,
            provider: providerName,
            date: formattedDateStr,
            time: formattedTimeStr,
            duration: appointmentDuration,
            location: providerAddress,
            type: "confirmed",
            deposit: depositPaid,
            remaining: remainingBalance,
          });

          // Send email to provider
          await sendAppointmentEmail({
            to: serviceData.serviceProvider.user.email,
            name: providerName,
            service: serviceName,
            provider: client.name,
            date: formattedDateStr,
            time: formattedTimeStr,
            duration: appointmentDuration,
            location: providerAddress,
            type: "confirmed",
            deposit: depositPaid,
            remaining: remainingBalance,
          });

        });        
      }

      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const { appointmentId, type = "unknown" } = intent.metadata || {};

      console.error("Payment failed:", intent.last_payment_error?.message);

      await prisma.stripePayment.create({
        data: {
          paymentIntentId: intent.id,
          appointmentId: appointmentId || null,
          type,
          status: "failed",
          amount: intent.amount,
          currency: intent.currency || "usd",
        },
      });

      break;
    }
  }
  res.status(200).json({ received: true });
});

router.post("/create-onboarding-link", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  try {
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (!serviceProvider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    let accountId = serviceProvider.stripeAccountId;

    // If no Stripe Connect account, create one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: req.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await prisma.serviceProvider.update({
        where: { userId },
        data: { stripeAccountId: accountId },
      });
    }

    // Create an onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/profile/${user.username}`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Failed to create onboarding link", error: error.message });
  }
});

router.get("/check-onboarding-status", requireAuth, async (req, res) => {
  const userId = req.user.userId;

  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (!provider?.stripeAccountId) {
      return res.status(400).json({ message: "No Stripe account ID found" });
    }

    const account = await stripe.accounts.retrieve(provider.stripeAccountId);

    res.status(200).json({
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    });

  } catch (error) {
    console.error("Stripe onboarding check failed:", error);
    res.status(500).json({ message: "Failed to check onboarding status", error: error.message });
  }
});

// Retry Remaining Balance
router.post("/retry-remaining", requireAuth, async (req, res) => {
  const { appointmentId, paymentMethodId } = req.body;
  const userId = req.user.userId;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: {
          include: { serviceProvider: true },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.clientId !== userId) {
      return res.status(403).json({ message: "You are not authorized to retry payment for this appointment." });
    }

    const { client, service } = appointment;
    const remainingAmount = service.price - service.depositAmount;

    if (!client.stripeCustomerId) {
      return res.status(400).json({ message: "You do not have a Stripe customer account." });
    }

    // Attach and set new default payment method
    await stripe.paymentMethods.attach(paymentMethodId, { customer: client.stripeCustomerId });
    await stripe.customers.update(client.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create payment intent for remaining balance
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(remainingAmount * 100),
      currency: "usd",
      customer: client.stripeCustomerId,
      confirm: true,
      off_session: false,
      payment_method: paymentMethodId,
      metadata: {
        appointmentId,
        type: "remaining",
      },
      transfer_data: {
        destination: service.serviceProvider.stripeAccountId,
      },
    });

    await prisma.stripePayment.create({
      data: {
        paymentIntentId: intent.id,
        appointmentId,
        type: "remaining",
        status: "succeeded",
        amount: intent.amount,
        currency: intent.currency || "usd",
      },
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "paid" },
    });

    res.status(200).json({ message: "Remaining payment successful" });
  } catch (err) {
    console.error("Retry remaining payment failed:", err);
    res.status(500).json({ message: err.message || "Payment retry failed" });
  }
});

export default router;
