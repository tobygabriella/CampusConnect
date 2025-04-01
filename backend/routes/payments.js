import express from "express";
import Stripe from "stripe";
import { requireAuth } from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

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
      metadata: {
        appointmentId,
        type: "deposit",
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

// Charge Remaining Balance
router.post("/charge-remaining", requireAuth, async (req, res) => {
  const { appointmentId } = req.body;
  const userId = req.user.userId;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
      },
    });

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const { service, client } = appointment;

    const customerId = client.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({ message: "Client does not have a Stripe customer ID" });
    }

    const deposit = service.depositAmount ?? 0;
    const remainingAmount = service.price - deposit;

    if (remainingAmount <= 0) {
      return res.status(400).json({ message: "No remaining balance to charge" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(remainingAmount * 100),
      currency: "usd",
      customer: customerId,
      confirm: true,
      off_session: true,
      metadata: {
        appointmentId,
        type: "remaining",
      },
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "paid" },
    });

    res.status(200).json({ message: "Remaining balance charged", paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error("Charge remaining error:", error);

    if (error.code === "authentication_required" || error.code === "card_declined") {
      return res.status(402).json({
        message: "Payment failed: " + error.message,
        stripeErrorCode: error.code,
      });
    }

    res.status(500).json({ message: "Failed to charge remaining balance" });
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
        duration
      } = intent.metadata || {};

      // 1. Save Stripe payment log
      const existing = await prisma.stripePayment.findUnique({
        where: { paymentIntentId: intent.id },
      });

      if (!existing) {
        await prisma.stripePayment.create({
          data: {
            paymentIntentId: intent.id,
            appointmentId: appointmentId || null,
            type,
            status: "succeeded",
            amount: intent.amount,
            currency: intent.currency || "usd",
          },
        });
      }

      // 2. If it's a deposit, create the appointment now
      if (type === "deposit" && !appointmentId) {
        const toMinutes = (time) => {
          const [h, m] = time.split(":").map(Number);
          return h * 60 + m;
        };

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

        // Check if appointment already exists
        const exists = await prisma.appointment.findFirst({
          where: {
            serviceProviderId: providerId,
            startTime: startTimeDate,
            clientId,
          },
        });

        if (!exists) {
          const created = await prisma.appointment.create({
            data: {
              clientId,
              serviceId,
              serviceProviderId: providerId,
              startTime: startTimeDate,
              endTime: endTimeDate,
              status: "confirmed",
            },
          });

          //update StripePayment with this appointmentId
          await prisma.stripePayment.update({
            where: { paymentIntentId: intent.id },
            data: { appointmentId: created.id },
          });
        }
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

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
