import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function chargeRemainingBalance(appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: true,
      service: {
        include: { serviceProvider: true }
      },
    },
  });

  if (!appointment) throw new Error("Appointment not found");

  const { client, service } = appointment;
  const customerId = client.stripeCustomerId;
  const deposit = service.depositAmount ?? 0;
  const remainingAmount = service.price - deposit;

  if (!customerId) {
    const error = new Error("Client does not have a Stripe customer ID");
    error.code = "no_stripe_customer";
    throw error;
  }

  if (remainingAmount <= 0) {
    const error = new Error("No remaining balance to charge");
    error.code = "no_remaining_balance";
    throw error;
  }

  const customer = await stripe.customers.retrieve(customerId);
  const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

  if (!defaultPaymentMethod) {
    const error = new Error("No saved payment method found");
    error.code = "missing_payment_method";
    throw error;
  }

  //Use transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(remainingAmount * 100),
      currency: "usd",
      customer: customerId,
      confirm: true,
      off_session: true,
      payment_method: defaultPaymentMethod,
      metadata: { appointmentId, type: "remaining" },
      transfer_data: {
        destination: service.serviceProvider.stripeAccountId,
      },
    });

    await tx.stripePayment.create({
      data: {
        paymentIntentId: intent.id,
        appointmentId,
        type: "remaining",
        status: "succeeded",
        amount: intent.amount,
        currency: intent.currency || "usd",
      },
    });

    await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "paid" },
    });

    return intent.id; // optional
  });
}
