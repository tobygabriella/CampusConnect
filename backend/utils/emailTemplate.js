export const generateAppointmentEmail = ({ name, service, provider, date, time, duration, location, type, deposit, remaining,}) => {
    const actionText = {
      confirmed: "confirmed",
      reminder: "scheduled",
      rescheduled: "rescheduled",
      cancelled: "cancelled",
      no_show: "marked as a no-show",
      completed: "completed",
    };
  
    const typeLabel = {
      confirmed: "Appointment Confirmation",
      reminder: "Appointment Reminder",
      rescheduled: "Appointment Rescheduled",
      cancelled: "Appointment Cancelled",
      no_show: "No-Show Notification",
      completed: "Appointment Completed",
    };
  
    const action = actionText[type] || "scheduled";
    const heading = typeLabel[type] || "Appointment Notification";
  
    return {
      subject: `${heading}: ${service} with ${provider}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #ddd;">
          <h2 style="text-align:center;">${heading}</h2>
          <p style="text-align:center;">for <strong>${name}</strong></p>
          <hr style="margin: 20px 0;">
          <p><strong>What:</strong> ${service} (${provider})</p>
          <p><strong>When:</strong> ${date} ${time} (${duration} hour${duration > 1 ? "s" : ""})</p>
          <p><strong>Where:</strong> ${location}</p>
          ${
            deposit !== undefined && remaining !== undefined
              ? `<p><strong>Price:</strong><br>
                 Deposit Paid: $${deposit.toFixed(2)}<br>
                 Remaining Balance Due: $${remaining.toFixed(2)}</p>`
              : ""
          }
          <hr style="margin: 20px 0;">
          <p>This is to notify you that your appointment has been <strong>${action}</strong>.</p>
  
          ${
            type === "completed"
              ? `<p>Both parties have confirmed this appointment occurred. You've been charged the remaining balance (if applicable).</p>`
              : type === "cancelled"
              ? `<p>If this was a mistake, please rebook or contact your provider.</p>`
              : type === "rescheduled"
              ? `<p>The appointment time has been updated. Please check your dashboard for details.</p>`
              : type === "no_show"
              ? `<p>You were marked as a no-show for this appointment. If you believe this is incorrect, please reach out.</p>`
              : `<p>To cancel or reschedule, visit your <strong>Aro dashboard</strong>.</p>`
          }
  
          ${
            type === "completed"
              ? `<p>Please don't forget to <strong>leave feedback</strong> if you'd like.</p>`
              : `<p>After the session, please confirm whether the appointment occurred in the "Awaiting Confirmation" tab.</p>`
          }
  
          <div style="margin-top: 30px;">
            <a href="http://localhost:5173/appointments" 
              style="background-color: #e68ac1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Appointment
            </a>
          </div>
        </div>
      `,
    };
  };
  