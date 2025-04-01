import express from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.get("/onboard", requireAuth, async (req, res) => {
    const userId = req.user.userId;
  
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { serviceProvider: true }
      });
  
      if (!user?.serviceProvider) {
        return res.status(403).json({ message: "Not a service provider" });
      }
  
      // Create new Stripe account if not exists
      let accountId = user.serviceProvider.stripeAccountId;
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: user.email,
          capabilities: {
            transfers: { requested: true },
          },
        });
  
        accountId = account.id;
        await prisma.serviceProvider.update({
          where: { id: user.serviceProvider.id },
          data: { stripeAccountId: accountId },
        });
      }
  
      // Generate onboarding link
      const origin = req.headers.origin || "http://localhost:5173";
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/edit-profile`,
        return_url: `${origin}/edit-profile`,
        type: "account_onboarding",
      });
  
      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Stripe onboarding error:", error);
      res.status(500).json({ message: "Failed to create onboarding link" });
    }
  });
  

export default router;
