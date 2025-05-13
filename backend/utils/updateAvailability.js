// utils/availability.js

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

export const toDateUTC = (dateStr, minutes) => {
  return dayjs.utc(`${dateStr}T00:00:00Z`).add(minutes, "minute").toDate();
};

export const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  
export const toHHMM = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };
  
export function updateAvailability(slots, bookedStart, bookedEnd) {
    console.log("   · updateAvailability IN:", slots, bookedStart, bookedEnd);
    const bS = toMinutes(bookedStart);
    const bE = toMinutes(bookedEnd);
  
    return slots.reduce((acc, slot) => {
      let [slotStart, slotEnd] = slot.split(" - ");
      let s = toMinutes(slotStart);
      let e = toMinutes(slotEnd);
  
      // If end ≤ start, assume it wraps past midnight
      if (e <= s) e += 24 * 60;
  
      // No overlap?
      if (bE <= s || bS >= e) {
        acc.push(slot);
      } else {
        // Carve out before the booking
        if (bS > s) {
          acc.push(`${toHHMM(s)} - ${toHHMM(bS % (24 * 60))}`);
        }
        // Carve out after the booking
        if (bE < e) {
          acc.push(`${toHHMM(bE % (24 * 60))} - ${toHHMM(e % (24 * 60))}`);
        }
      }
      console.log("   · updateAvailability OUT:", acc);
      return acc;
    }, []);
  }

  export const restoreSlotToAvailability = (availability, startTime, endTime) => {
    const dateKey = startTime.toISOString().split("T")[0];
    const start = startTime.toISOString().split("T")[1].slice(0, 5);
    const end = endTime.toISOString().split("T")[1].slice(0, 5);
  
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
  
    if (endMin > startMin) {
      // Same-day slot
      const currentDaySlots = availability[dateKey] || [];
      currentDaySlots.push(`${start} - ${end}`);
      availability[dateKey] = currentDaySlots.sort();
    } else {
      // Cross-midnight slot
      const currentDaySlots = availability[dateKey] || [];
      currentDaySlots.push(`${start} - 24:00`);
      availability[dateKey] = currentDaySlots.sort();
  
      const nextDateKey = dayjs.utc(dateKey).add(1, "day").format("YYYY-MM-DD");
      const nextDaySlots = availability[nextDateKey] || [];
      nextDaySlots.push(`00:00 - ${end}`);
      availability[nextDateKey] = nextDaySlots.sort();
    }
  
    return availability;
  };

  export const removeSlotFromAvailability = (availability, date, startTime, duration) => {
    const startMin = toMinutes(startTime);
    const endMin = startMin + parseInt(duration);
    const endTime = toHHMM(endMin % (24 * 60));
    const nextDate = dayjs.utc(date).add(1, "day").format("YYYY-MM-DD");
  
    // Remove from current day
    const currentDaySlots = availability[date] || [];
    const updatedCurrentDaySlots = updateAvailability(currentDaySlots, startTime, "24:00");
    availability[date] = updatedCurrentDaySlots;
  
    // If crosses midnight
    if (endMin >= 1440) {
      const nextDaySlots = availability[nextDate] || [];
      const updatedNextDaySlots = updateAvailability(nextDaySlots, "00:00", endTime);
      availability[nextDate] = updatedNextDaySlots;
    }
  };
  
  