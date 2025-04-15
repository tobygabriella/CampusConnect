import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "@/utils/axiosInstance";
import { Modal, TimePicker, Button, message } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import enUS from "date-fns/locale/en-US";

dayjs.extend(utc);
dayjs.extend(timezone);
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), 
  getDay,
  locales: { "en-US": enUS },
});

const formats = {
  monthHeaderFormat: (date) => format(date, "MMMM yyyy"),
  dayHeaderFormat: (date) => format(date, "EEEE, MMM d"),
  dayRangeHeaderFormat: ({ start, end }) => `${format(start, 'MMMM d')} - ${format(end, 'MMMM d, yyyy')}`,
  dayFormat: (date) => format(date, "EEEE d"),
  weekdayFormat: (date) => format(date, "EEEE"),
  dateFormat: "d",
  timeGutterFormat: "h:mm a",
  eventTimeRangeFormat: ({ start, end }) => {
    const localStart = dayjs(start).tz(userTimezone);
    const localEnd = dayjs(end).tz(userTimezone);
    return `${localStart.format("h:mm a")} - ${localEnd.format("h:mm a")}`;
  },
};

const userTimezone = dayjs.tz.guess();

const AvailabilityCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTimeSlot, setNewTimeSlot] = useState({ start: null, end: null });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [availabilityRes, appointmentsRes] = await Promise.all([
          api.get("/availability/get-availability"),
          api.get("/appointments")
        ]);

        const availability = availabilityRes.data.availabilityData || {};
        const appointments = appointmentsRes.data;

        const slots = Object.entries(availability).flatMap(([date, times]) =>
          times.map(range => {
            const [start, end] = range.split(" - ");
            // Parse as UTC and convert to local time
            const localStart = dayjs.utc(`${date}T${start}`).local().toDate();
            const localEnd = dayjs.utc(`${date}T${end}`).local().toDate();
            return {
              title: "Available",
              start: localStart,
              end: localEnd,
              allDay: false,
              type: "availability"
            };
          })
        );

        const appts = appointments
        .filter(appt => appt.status !== "cancelled") // Exclude cancelled
        .map(appt => ({
          title: appt.service.name,
          start: dayjs.utc(appt.startTime).local().toDate(),
          end: dayjs.utc(appt.endTime).local().toDate(),
          allDay: false,
          type: "appointment",
          client: appt.client.name
        }));      

        setEvents([...slots, ...appts]);
      } catch (err) {
        console.error("Error loading calendar data", err);
      }
    };

    loadEvents();
  }, []);

  const handleAddOrUpdateTimeSlot = async () => {
    if (!newTimeSlot.start || !newTimeSlot.end) {
      message.error("Please select both start and end times.");
      return;
    }
  
    const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");
  
    // Convert local times to UTC strings for backend storage
    const startUtc = dayjs(newTimeSlot.start).utc().format("HH:mm");
    const endUtc = dayjs(newTimeSlot.end).utc().format("HH:mm");
    const newSlot = `${startUtc} - ${endUtc}`;
  
    try {
      // Get all existing slots for this date (except the one being edited if applicable)
      const existingSlots = events
        .filter(e => 
          dayjs(e.start).isSame(selectedDate, 'day') && 
          e.type === "availability" &&
          (!editingEvent || e !== editingEvent)
        )
        .map(e => {
          const start = dayjs(e.start).utc().format("HH:mm");
          const end = dayjs(e.end).utc().format("HH:mm");
          return `${start} - ${end}`;
        });
  
      // Combine existing slots with the new one
      const updatedSlots = [...existingSlots, newSlot];
  
      // Get all availability data from the backend first
      const availabilityRes = await api.get("/availability/get-availability");
      const currentAvailability = availabilityRes.data.availabilityData || {};
  
      // Create the updated availability object
      const updatedAvailability = {
        ...currentAvailability,
        [dateKey]: updatedSlots
      };
  
      // Send the complete updated availability to the backend
      await api.post("/availability/set-availability", {
        availability: updatedAvailability
      });
  
      // Refresh the events
      const loadEvents = async () => {
        const [availabilityRes, appointmentsRes] = await Promise.all([
          api.get("/availability/get-availability"),
          api.get("/appointments")
        ]);
  
        const availability = availabilityRes.data.availabilityData || {};
        const appointments = appointmentsRes.data;
  
        const slots = Object.entries(availability).flatMap(([date, times]) =>
          times.map(range => {
            const [start, end] = range.split(" - ");
            const localStart = dayjs.utc(`${date}T${start}`).local().toDate();
            const localEnd = dayjs.utc(`${date}T${end}`).local().toDate();
            return {
              title: "Available",
              start: localStart,
              end: localEnd,
              allDay: false,
              type: "availability"
            };
          })
        );

        const appts = appointments
        .filter(appt => appt.status !== "cancelled") // Exclude cancelled
        .map(appt => ({
          title: appt.service.name,
          start: dayjs.utc(appt.startTime).local().toDate(),
          end: dayjs.utc(appt.endTime).local().toDate(),
          allDay: false,
          type: "appointment",
          client: appt.client.name
        }));
      
  
        setEvents([...slots, ...appts]);
      };
  
      await loadEvents();
      message.success("Availability saved!");
      setIsModalVisible(false);
    } catch (err) {
      console.error("Error saving availability", err);
      message.error("Error saving availability.");
    }
  };

  const handleDeleteTimeSlot = async () => {
    if (!editingEvent) return;

    const dateKey = dayjs(editingEvent.start).format("YYYY-MM-DD");
    const slotToRemove = `${dayjs(editingEvent.start).utc().format("HH:mm")} - ${dayjs(editingEvent.end).utc().format("HH:mm")}`;

    try {
      const remainingSlots = events.filter(e =>
        dayjs(e.start).isSame(editingEvent.start, 'day') &&
        e.type === "availability" &&
        `${dayjs(e.start).utc().format("HH:mm")} - ${dayjs(e.end).utc().format("HH:mm")}` !== slotToRemove
      ).map(e => `${dayjs(e.start).utc().format("HH:mm")} - ${dayjs(e.end).utc().format("HH:mm")}`);

      await api.post("/availability/set-availability", {
        availability: { [dateKey]: remainingSlots }
      });

      setEvents(prev => prev.filter(e => e !== editingEvent));
      setIsModalVisible(false);
      message.success("Time slot deleted.");
    } catch (err) {
      console.error("Error deleting slot", err);
      message.error("Failed to delete time slot.");
    }
  };

  // Helper function to convert dayjs object to local time Date object
  const toLocalDate = (dayjsObj) => {
    return dayjsObj ? dayjsObj.toDate() : null;
  };

  return (
    <div className="p-6 bg-white rounded shadow max-w-7xl mx-auto">
      <Calendar
        localizer={localizer}
        culture="en-US"
        events={events}
        selectable
        views={["month", "week", "day", "agenda"]}
        defaultView="week"
        startAccessor="start"
        endAccessor="end"
        style={{ height: "80vh" }}
        onSelectSlot={(slotInfo) => {
          setSelectedDate(slotInfo.start);
          setNewTimeSlot({ start: null, end: null });
          setEditingEvent(null);
          setIsModalVisible(true);
        }}
        onSelectEvent={(event) => {
          if (event.type === "availability") {
            setSelectedDate(event.start);
            setNewTimeSlot({ 
              start: dayjs(event.start), 
              end: dayjs(event.end) 
            });            
            setEditingEvent(event);
            setIsModalVisible(true);
          }
        }}
        formats={formats}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.type === "appointment" ? "#fde68a" : "#c7d2fe",
            color: "#1e3a8a",
            borderRadius: "6px",
            border: "none",
            cursor: event.type === "availability" ? "pointer" : "default"
          }
        })}
        tooltipAccessor={(event) =>
          event.type === "appointment"
            ? `${event.title} with ${event.client}`
            : "Click to edit availability"
        }
      />

      <Modal
        title={`Edit Availability for ${selectedDate ? dayjs(selectedDate).format("MMMM D, YYYY") : ''}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          editingEvent && <Button key="delete" danger onClick={handleDeleteTimeSlot}>Delete</Button>,
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>Cancel</Button>,
          <Button key="save" type="primary" onClick={handleAddOrUpdateTimeSlot}>Save</Button>
        ]}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2">Start Time</label>
            <TimePicker
              format="h:mm a"
              value={newTimeSlot.start}
              onChange={(time) => setNewTimeSlot({ ...newTimeSlot, start: time })}
              className="w-full"
              use12Hours
              showNow={false}
            />
          </div>
          <div>
            <label className="block mb-2">End Time</label>
            <TimePicker
              format="h:mm a"
              value={newTimeSlot.end}
              onChange={(time) => setNewTimeSlot({ ...newTimeSlot, end: time })}
              className="w-full"
              use12Hours
              showNow={false}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AvailabilityCalendar;