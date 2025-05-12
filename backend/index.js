import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import authRoutes from "./routes/auth.js";
import onboardingRoutes from "./routes/onboarding.js";
import collegeRoutes from "./routes/colleges.js";
import serviceProviderRoutes from "./routes/serviceProvider.js";
import userRoutes from "./routes/user.js";
import availabilityRoutes from "./routes/availability.js";
import searchRoutes from "./routes/search.js"
import apppointmentRoutes from "./routes/appointments.js"
import paymentsRoutes from "./routes/payments.js";
import connectRoutes from "./routes/connect.js";
import forumRoutes from "./routes/forum.js";
import workPostRoutes from "./routes/workPost.js"
import notificationRoutes from "./routes/notifications.js";
import "./cronJobs/appointmentReminders.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

//Initialize Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});

//Make Socket.IO available globally in Express
app.set("io", io);

//Handle connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Client joins room using their user ID
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room.`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
app.use("/colleges", collegeRoutes);
app.use("/service-provider", serviceProviderRoutes);
app.use("/users", userRoutes);  
app.use("/search", searchRoutes);
app.use("/availability", availabilityRoutes);
app.use("/appointments", apppointmentRoutes)
app.use("/payments", paymentsRoutes);
app.use("/connect", connectRoutes);
app.use("/forum", forumRoutes);
app.use("/work-posts", workPostRoutes)
app.use("/notifications", notificationRoutes);

app.use((req, res, next) => {
  next();
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));