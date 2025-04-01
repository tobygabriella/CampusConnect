import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer} from "react-big-calendar";
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
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday as start
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
    const localStart = dayjs.utc(start).local();
    const localEnd = dayjs.utc(end).local();
    return `${localStart.format("h:mm a")} - ${localEnd.format("h:mm a")}`;
  },
};


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
          api.get("/bookings")
        ]);

        const availability = availabilityRes.data.availabilityData || {};
        const appointments = appointmentsRes.data;

        const slots = Object.entries(availability).flatMap(([date, times]) =>
          times.map(range => {
            const [start, end] = range.split(" - ");
            return {
              title: "Available",
              start: new Date(`${date}T${start}`),
              end: new Date(`${date}T${end}`),
              allDay: false,
              type: "availability"
            };
          })
        );

        const appts = appointments.map(appt => ({
          title: appt.service.name,
          start: new Date(appt.startTime), 
          end: new Date(appt.endTime), 
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

  const handleSelectSlot = (slotInfo) => {
    setSelectedDate(slotInfo.start);
    setNewTimeSlot({ start: null, end: null });
    setEditingEvent(null);
    setIsModalVisible(true);
  };

  const handleSelectEvent = (event) => {
    if (event.type === "availability") {
      setSelectedDate(event.start);
      setNewTimeSlot({ start: dayjs(event.start), end: dayjs(event.end) });
      setEditingEvent(event);
      setIsModalVisible(true);
    }
  };

  const handleAddOrUpdateTimeSlot = async () => {
    if (!newTimeSlot.start || !newTimeSlot.end) {
      message.error("Please select both start and end times.");
      return;
    }

    const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");
    const newSlot = `${dayjs(newTimeSlot.start).format("HH:mm")} - ${dayjs(newTimeSlot.end).format("HH:mm")}`;

    try {
      const existingSlots = events.filter(e =>
        dayjs(e.start).format("YYYY-MM-DD") === dateKey &&
        e.type === "availability" &&
        (!editingEvent || e !== editingEvent)
      ).map(e => `${dayjs(e.start).format("HH:mm")} - ${dayjs(e.end).format("HH:mm")}`);

      const updatedSlots = [...existingSlots, newSlot];

      await api.post("/availability/set-availability", {
        availability: { [dateKey]: updatedSlots }
      });

      const updatedEvents = events.filter(e =>
        !(dayjs(e.start).format("YYYY-MM-DD") === dateKey && e.type === "availability")
      );

      setEvents([
        ...updatedEvents,
        ...updatedSlots.map(slot => {
          const [start, end] = slot.split(" - ");
          return {
            title: "Available",
            start: new Date(`${dateKey}T${start}`),
            end: new Date(`${dateKey}T${end}`),
            allDay: false,
            type: "availability"
          };
        })
      ]);

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
    const slotToRemove = `${dayjs(editingEvent.start).format("HH:mm")} - ${dayjs(editingEvent.end).format("HH:mm")}`;

    try {
      const remainingSlots = events.filter(e =>
        dayjs(e.start).format("YYYY-MM-DD") === dateKey &&
        e.type === "availability" &&
        `${dayjs(e.start).format("HH:mm")} - ${dayjs(e.end).format("HH:mm")}` !== slotToRemove
      ).map(e => `${dayjs(e.start).format("HH:mm")} - ${dayjs(e.end).format("HH:mm")}`);

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
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
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
              format="HH:mm"
              value={newTimeSlot.start}
              onChange={(time) => setNewTimeSlot({ ...newTimeSlot, start: time })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-2">End Time</label>
            <TimePicker
              format="HH:mm"
              value={newTimeSlot.end}
              onChange={(time) => setNewTimeSlot({ ...newTimeSlot, end: time })}
              className="w-full"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AvailabilityCalendar;
