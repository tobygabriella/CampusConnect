import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import onboardingRoutes from "./routes/onboarding.js";
import uploadRoutes from "./routes/upload.js";
import collegeRoutes from "./routes/colleges.js";
import serviceProviderRoutes from "./routes/serviceProvider.js";
import userRoutes from "./routes/user.js";
import availabilityRoutes from "./routes/availability.js";
import searchRoutes from "./routes/search.js"
import bookingRoutes from "./routes/bookings.js"
import paymentsRoutes from "./routes/payments.js";
import connectRoutes from "./routes/connect.js";



dotenv.config();

const app = express();

app.use(
  "/payments/webhook",
  bodyParser.raw({ type: "application/json" }) // RAW body required for Stripe signature check
); 

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "Access-Control-Allow-Credentials",
      "Cookie"
    ]
  })
);
app.options('*', cors());

// Routes
app.use("/auth", authRoutes);
app.use("/onboarding", onboardingRoutes);
app.use("/upload", uploadRoutes);
app.use("/colleges", collegeRoutes);
app.use("/service-provider", serviceProviderRoutes);
app.use("/users", userRoutes);  
app.use("/search", searchRoutes);
app.use("/availability", availabilityRoutes);
app.use("/bookings", bookingRoutes)
app.use("/payments", paymentsRoutes);
app.use("/connect", connectRoutes);
app.use((req, res, next) => {
  next();
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

