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
        include: { serviceProvider: true },
      },
    },
  });

  if (!appointment) {
    const error = new Error("Appointment not found");
    error.code = "appointment_not_found";
    throw error;
  }

  const { client, service } = appointment;

  if (!client?.stripeCustomerId) {
    const error = new Error("Client is missing Stripe customer ID");
    error.code = "missing_stripe_customer";
    throw error;
  }

  if (!service?.serviceProvider?.stripeAccountId) {
    const error = new Error("Service provider is missing Stripe account ID");
    error.code = "missing_stripe_account";
    throw error;
  }

  const deposit = service.depositAmount ?? 0;
  const remainingAmount = service.price - deposit;

  if (remainingAmount <= 0) {
    const error = new Error("No remaining balance to charge");
    error.code = "no_remaining_balance";
    throw error;
  }

  // Retrieve the Stripe customer
  let customer;
  try {
    customer = await stripe.customers.retrieve(client.stripeCustomerId);
  } catch (err) {
    const error = new Error("Failed to retrieve Stripe customer");
    error.code = "stripe_customer_retrieval_failed";
    throw error;
  }

  const defaultPaymentMethod = customer?.invoice_settings?.default_payment_method;
  if (!defaultPaymentMethod) {
    const error = new Error("Client does not have a saved payment method");
    error.code = "missing_payment_method";
    throw error;
  }

  // Atomic payment + database update
  return await prisma.$transaction(async (tx) => {
    let intent;
    try {
      intent = await stripe.paymentIntents.create({
        amount: Math.round(remainingAmount * 100),
        currency: "usd",
        customer: client.stripeCustomerId,
        confirm: true,
        off_session: true,
        payment_method: defaultPaymentMethod,
        metadata: { appointmentId, type: "remaining" },
        transfer_data: {
          destination: service.serviceProvider.stripeAccountId,
        },
      });
    } catch (stripeError) {
      const error = new Error(
        stripeError.message || "Stripe payment failed"
      );
      error.code = stripeError.code || "stripe_payment_failed";
      throw error;
    }
  
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
  
    return intent.id;
  });  
}
