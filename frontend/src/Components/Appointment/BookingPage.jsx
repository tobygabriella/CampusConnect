import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance";
import { Button, DatePicker, Select } from "antd";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

const BookingPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedService = searchParams.get("service");
  const [originalDate, setOriginalDate] = useState(null);
  const [originalStartTime, setOriginalStartTime] = useState(null);
  const appointmentId = searchParams.get("appointmentId");
  const rescheduleMode = searchParams.get("mode") === "reschedule";
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState({});
  const [selectedService, setSelectedService] = useState(preSelectedService || null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [duration, setDuration] = useState(0);
  const [providerIsReadyToBook, setProviderIsReadyToBook] = useState(true);
  const [rescheduleFee, setRescheduleFee] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/users/profile/${username}`);
        setServices(response.data.services || []);
        setRescheduleFee(response.data.serviceProvider?.rescheduleFee || 0);

        if (!response.data.stripeAccountId) {
          toast.error("This provider has not completed payment setup and cannot receive bookings yet.");
          setProviderIsReadyToBook(false);
          return; // stop further execution
        }

        const availabilityResponse = await api.get(`/availability/get-availability/${username}`);
        const data = availabilityResponse.data.availabilityData || {};
        if (Object.keys(data).length === 0) {
          toast.info("This service provider has not set their availability yet.");
        }
        setAvailability(data);
        if (rescheduleMode && appointmentId) {
          const apptRes = await api.get(`/appointments/${appointmentId}`);
          const appt = apptRes.data;
          const start = dayjs(appt.startTime);
          const end = dayjs(appt.endTime);
  
          setSelectedService(appt.service.id);
          setSelectedDate(start);
          setSelectedTimeSlot(`${start.format("HH:mm")} - ${end.format("HH:mm")}`);
          setOriginalDate(start.format("YYYY-MM-DD"));
          setOriginalStartTime(start.format("HH:mm"));
        }
      } catch (error) {
        console.error("Error fetching booking info:", error);
        toast.error("Error loading booking details.");
      }
    };
    fetchData();
  }, [username]);

  useEffect(() => {
    if (selectedService) {
      const service = services.find((s) => s.id === selectedService);
      setDuration(service ? service.duration : 0);
    }
  }, [selectedService, services]);

  const isAvailabilityEmpty = Object.keys(availability).length === 0;

  const disabledDate = (current) => {
    if (current && current < dayjs().startOf("day")) return true;
    const key = current.format("YYYY-MM-DD");
    return !availability[key] || availability[key].length === 0;
  };

  const generateAvailableSlots = () => {
    if (!selectedDate || duration === 0) return [];
  
    const key = selectedDate.format("YYYY-MM-DD");
    const rawSlots = availability[key] || [];
  
    const validSlots = [];
  
    for (let block of rawSlots) {
      const [startStr, endStr] = block.split(" - ");
  
      // Parse as UTC from DB
      const startUTC = dayjs.utc(`${key}T${startStr}`);
      const endUTC = dayjs.utc(`${key}T${endStr}`);
  
      // Handle cross-midnight by extending end time
      const adjustedEndUTC = endUTC.isBefore(startUTC)
        ? endUTC.add(1, "day")
        : endUTC;
  
      // Convert to local timezone
      let start = startUTC.local();
      const end = adjustedEndUTC.local();
  
      while (start.add(duration, "minute").isSameOrBefore(end)) {
        const slotStart = start.format("HH:mm");
        const slotEnd = start.add(duration, "minute").format("HH:mm");
        validSlots.push(`${slotStart} - ${slotEnd}`);
        start = start.add(15, "minute");
      }
    }
  
    return validSlots;
  };
  

  const handleBookNow = () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      toast.error("Please select a service, date, and time.");
      return;
    }
  
    const [slotStartLocal] = selectedTimeSlot.split(" - ");
    const date = selectedDate.format("YYYY-MM-DD");
  
    // Convert local time to UTC
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startUtc = dayjs.tz(`${date}T${slotStartLocal}`, "YYYY-MM-DDTHH:mm", localTz)
      .utc()
      .format("HH:mm");    
  
    navigate(
      `/checkout?provider=${username}&service=${selectedService}&date=${date}&start=${startUtc}&duration=${duration}`
    );
  };  
  const handleRescheduleNow = async () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      toast.error("Please select a new service, date, and time.");
      return;
    }
  
    const [slotStartLocal] = selectedTimeSlot.split(" - ");
    const date = selectedDate.format("YYYY-MM-DD");
  
    if (date === originalDate && slotStartLocal === originalStartTime) {
      toast.error("Please choose a new date or time to reschedule.");
      return;
    }
  
    // Create a dayjs object in local timezone
    const localDateTime = dayjs(`${date}T${slotStartLocal}`);
    
    // Convert to UTC and format for backend
    const utcDateTime = localDateTime.utc();
    const utcDate = utcDateTime.format("YYYY-MM-DD");
    const utcTime = utcDateTime.format("HH:mm");
  
    try {
      const service = services.find((s) => s.id === selectedService);
      const rescheduleFee = service?.rescheduleFee || 0;
  
      if (rescheduleFee > 0) {
        // Try charging on backend
        await api.patch(`/appointments/${appointmentId}/reschedule`, {
          newDate: utcDate,
          newStartTime: utcTime,
        });
  
        toast.success("Appointment rescheduled successfully");
        navigate("/appointments");
      } else {
        // No charge → normal flow
        await api.patch(`/appointments/${appointmentId}/reschedule`, {
          newDate: utcDate,
          newStartTime: utcTime,
        });
  
        toast.success("Appointment rescheduled successfully");
        navigate("/appointments");
      }
    } catch (err) {
      console.error("Reschedule error:", err);
  
      // Stripe auto-charge failed, fallback to manual payment
      if (err?.response?.status === 402 && err?.response?.data?.requiresAction) {
        toast.error("We couldn't charge your card. Please re-enter your payment info.");
        navigate(
          `/checkout?reschedule=true&appointmentId=${appointmentId}&newDate=${utcDate}&newStartTime=${utcTime}`
        );
        return;
      }
  
      toast.error(
        err?.response?.data?.message || "Failed to reschedule appointment"
      );
    }
  };
  
  
  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-[#f3e8ff] to-white p-6">
      <h2 className="text-2xl font-bold text-[#062970] mb-4">
        {rescheduleMode ? "Reschedule Appointment" : "Book a Service"}
      </h2>

      <div className="flex justify-center items-center gap-8 mb-8 w-full max-w-2xl">
        {["Personal Details", "Payment"].map((step, i) => (
          <div
            key={step}
            className={`flex flex-col items-center text-sm font-semibold ${i === 0 ? "text-[#062970]" : "text-gray-400"}`}
          >
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${i === 0 ? "bg-[#062970] text-white border-[#062970]" : "border-gray-400"}`}>
              {i + 1}
            </div>
            <span className="mt-2">{step}</span>
          </div>
        ))}
      </div>

      <div className="w-80 mb-6">
        <label className="text-sm font-semibold text-[#062970]">Select a Service <span className="text-red-500">*</span></label>
        {rescheduleMode ? (
          <div className="mt-2 p-2 bg-gray-100 rounded text-gray-700 font-medium border border-gray-300">
            {services.find(s => s.id === selectedService)?.name} – ${services.find(s => s.id === selectedService)?.price} ({services.find(s => s.id === selectedService)?.duration / 60} hrs)
          </div>
        ) : (
          <Select
            className="w-full mt-2"
            placeholder="Select a Service"
            value={selectedService}
            onChange={setSelectedService}
          >
            {services.map((service) => (
              <Select.Option key={service.id} value={service.id}>
                {service.name} - ${service.price} ({service.duration / 60} hrs)
              </Select.Option>
            ))}
          </Select>
        )}
      </div>

      <div className="w-80 mb-6">
        <label className="text-sm font-semibold text-[#062970]">Select a Date <span className="text-red-500">*</span></label>
        <DatePicker
          className="w-full mt-2"
          value={selectedDate ? dayjs(selectedDate) : null} // ✅ Set this!
          placeholder="Select a Date"
          onChange={(date) => {
            setSelectedDate(dayjs(date));
            setSelectedTimeSlot(null);
          }}
          disabled={isAvailabilityEmpty}
          disabledDate={disabledDate}
        />
      </div>

      <div className="w-80 mb-6">
        <label className="text-sm font-semibold text-[#062970]">Select a Time Slot <span className="text-red-500">*</span></label>
        <Select
          className="w-full mt-2"
          placeholder="Select a Time Slot"
          value={selectedTimeSlot}
          onChange={setSelectedTimeSlot}
          disabled={generateAvailableSlots().length === 0}
        >
          {generateAvailableSlots().map((slot, index) => (
            <Select.Option key={index} value={slot}>
              {slot}
            </Select.Option>
          ))}
        </Select>
      </div>

      <Button
        type="primary"
        className="w-80 bg-[#062970] text-white py-3 rounded-full shadow-md hover:bg-[#051f5c] transition-all duration-300"
        onClick={rescheduleMode ? handleRescheduleNow : handleBookNow}
        disabled={isAvailabilityEmpty}
      >
        {isAvailabilityEmpty
          ? "No Availability Set"
          : !providerIsReadyToBook
          ? "Unavailable"
          : rescheduleMode
          ? "Confirm Reschedule"
          : "Confirm Booking"}
      </Button>


      {!providerIsReadyToBook && (
        <p className="text-red-600 font-medium mt-4">
          This provider is not currently accepting bookings.
        </p>
      )}
      {isAvailabilityEmpty && (
        <p className="text-red-500 mt-4">
          This service provider has not set their availability yet. Please check back later.
        </p>
      )}
    </div>
  );
};

export default BookingPage;
