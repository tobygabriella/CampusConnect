import express from "express";
import Stripe from "stripe";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';

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

      const toMinutes = (time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };
    
      const toHHMM = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
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
            if (startMin > sMin) {
              updated.push(`${slotStart} - ${toHHMM(startMin)}`);
            }
            if (endMin < eMin) {
              updated.push(`${toHHMM(endMin)} - ${slotEnd}`);
            }
          } else {
            updated.push(slot);
          }
        }
    
        return updated;
      };    
      
      if (type === "deposit" && (!appointmentId || appointmentId === "undefined")) {
        const toDate = (d, minutes) => {
          const [yyyy, mm, dd] = d.split("-");
          const h = String(Math.floor(minutes / 60)).padStart(2, "0");
          const m = String(minutes % 60).padStart(2, "0");
          return new Date(`${yyyy}-${mm}-${dd}T${h}:${m}:00Z`);
        };

        const startMin = toMinutes(startTime);
        const endMin = startMin + parseInt(duration);
        const startTimeDate = toDate(date, startMin);
        const endTimeDate = toDate(date, endMin);

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

          if (availabilityRecord) {
            const availabilityData = availabilityRecord.availabilityData || {};
            const daySlots = availabilityData[date] || [];

            const bookedStart = startTime;
            const bookedEnd = toHHMM(toMinutes(startTime) + parseInt(duration));
            const updatedSlots = updateAvailability(daySlots, bookedStart, bookedEnd);

            availabilityData[date] = updatedSlots;

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


export default router;
