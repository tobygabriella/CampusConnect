// cronJobs/appointmentReminders.js
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { createNotification } from "../utils/notifications.js";
import { NotificationType, Priority } from "../enums/notifications.js";

const prisma = new PrismaClient();

const sendReminders = async () => {
  const now = new Date();

  const targets = [
    {
      label: "24hr",
      windowStart: new Date(now.getTime() + 23.5 * 60 * 60 * 1000),
      windowEnd: new Date(now.getTime() + 24.5 * 60 * 60 * 1000),
      field: "reminder24hrSent",
      type: NotificationType.APPOINTMENT_REMINDER_24HR,
      title: "Appointment Tomorrow",
      messageTemplate: (appt, otherParty) =>
        `Reminder: Your appointment for "${appt.service.name}" with ${otherParty.name} is scheduled for tomorrow at ${apptTime(appt)} at ${apptLocation(appt)}.`,
    },
    {
      label: "1hr",
      windowStart: new Date(now.getTime() + 59 * 60 * 1000),
      windowEnd: new Date(now.getTime() + 61 * 60 * 1000),
      field: "reminder1hrSent",
      type: NotificationType.APPOINTMENT_REMINDER_1HR,
      title: "Appointment in 1 Hour",
      messageTemplate: (appt, otherParty) =>
        `Reminder: Your appointment for "${appt.service.name}" with ${otherParty.name} is in 1 hour at ${apptLocation(appt)}.`,
    },
    {
      label: "postConfirm",
      windowStart: new Date(now.getTime() - 10 * 60 * 1000), // 10 mins ago
      windowEnd: new Date(now.getTime() + 10 * 60 * 1000),  // 10 mins in future
      field: "confirmationPromptSent",
      type: NotificationType.APPOINTMENT_CONFIRMED,
      title: "Confirm Appointment",
      messageTemplate: (appt, _) =>
        `Please confirm if your appointment for "${appt.service.name}" that ended at ${apptTime(appt)} took place.`,
      postService: true,
    },
  ];

  for (const rule of targets) {
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: rule.postService ? undefined : { gte: rule.windowStart, lte: rule.windowEnd },
        endTime: rule.postService ? { gte: rule.windowStart, lte: rule.windowEnd } : undefined,
        status: "confirmed",
        [rule.field]: false,
      },
      include: {
        service: true,
        client: true,
        serviceProvider: { include: { user: true } },
      },
    });

    for (const appt of appointments) {
      const provider = appt.serviceProvider.user;
      const client = appt.client;

      if (rule.postService) {
        // Prompt both to confirm
        await Promise.all([
          createNotification({
            app: null,
            recipientId: client.id,
            senderId: provider.id,
            type: rule.type,
            title: rule.title,
            message: rule.messageTemplate(appt),
            metadata: { appointmentId: appt.id },
            postIds: {},
            priority: Priority.HIGH,
          }),
          createNotification({
            app: null,
            recipientId: provider.id,
            senderId: client.id,
            type: rule.type,
            title: rule.title,
            message: rule.messageTemplate(appt),
            metadata: { appointmentId: appt.id },
            postIds: {},
            priority: Priority.HIGH,
          }),
        ]);
      } else {
        // Send reminders
        await Promise.all([
          createNotification({
            app: null,
            recipientId: client.id,
            senderId: provider.id,
            type: rule.type,
            title: rule.title,
            message: rule.messageTemplate(appt, provider),
            metadata: { appointmentId: appt.id },
            postIds: {},
            priority: Priority.HIGH,
          }),
          createNotification({
            app: null,
            recipientId: provider.id,
            senderId: client.id,
            type: rule.type,
            title: rule.title,
            message: rule.messageTemplate(appt, client),
            metadata: { appointmentId: appt.id },
            postIds: {},
            priority: Priority.HIGH,
          }),
        ]);
      }

      // Mark reminder as sent
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { [rule.field]: true },
      });
    }
  }
};

const apptTime = (appt) =>
  new Date(appt.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const apptLocation = (appt) => appt.serviceProvider?.location || "their listed location";

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("[Cron] Running appointment reminders...");
  await sendReminders();
});

export default sendReminders;
