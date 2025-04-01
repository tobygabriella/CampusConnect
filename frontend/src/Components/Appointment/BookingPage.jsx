import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance";
import { Button, DatePicker, Select } from "antd";
import dayjs from "dayjs";

const BookingPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedService = searchParams.get("service");

  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState({});
  const [selectedService, setSelectedService] = useState(preSelectedService || null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/users/profile/${username}`);
        setServices(response.data.services || []);

        const availabilityResponse = await api.get(`/availability/get-availability/${username}`);
        const data = availabilityResponse.data.availabilityData || {};
        if (Object.keys(data).length === 0) {
          toast.info("This service provider has not set their availability yet.");
        }
        setAvailability(data);
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

    const toMinutes = (time) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };
    const toHHMM = (min) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    for (let block of rawSlots) {
      const [startStr, endStr] = block.split(" - ");
      let start = toMinutes(startStr);
      const end = toMinutes(endStr);

      while (start + duration <= end) {
        const slotStart = toHHMM(start);
        const slotEnd = toHHMM(start + duration);
        validSlots.push(`${slotStart} - ${slotEnd}`);
        start += 15; // move by 15-minute increments
      }
    }

    return validSlots;
  };

  const handleBookNow = () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      toast.error("Please select a service, date, and time.");
      return;
    }
  
    navigate("/checkout", {
      state: {
        providerUsername: username,
        serviceId: selectedService,
        date: selectedDate.format("YYYY-MM-DD"),
        startTime: selectedTimeSlot.split(" - ")[0],
        duration,
      },
    });
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-[#f3e8ff] to-white p-6">
      <h2 className="text-2xl font-bold text-[#062970] mb-4">Book a Service</h2>

      {/* Timeline */}
      <div className="flex justify-center items-center gap-8 mb-8 w-full max-w-2xl">
        {["Personal Details", "Payment", "Complete"].map((step, i) => (
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

      {/* Service */}
      <div className="w-80 mb-6">
        <label className="text-sm font-semibold text-[#062970]">Select a Service <span className="text-red-500">*</span></label>
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
      </div>

      {/* Date */}
      <div className="w-80 mb-6">
        <label className="text-sm font-semibold text-[#062970]">Select a Date <span className="text-red-500">*</span></label>
        <DatePicker
          className="w-full mt-2"
          placeholder="Select a Date"
          onChange={(date) => {
            setSelectedDate(dayjs(date));
            setSelectedTimeSlot(null); // reset when date changes
          }}
          disabled={isAvailabilityEmpty}
          disabledDate={disabledDate}
        />
      </div>

      {/* Time Slot Dropdown */}
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

      {/* Book Button */}
      <Button
        type="primary"
        className="w-80 bg-[#062970] text-white py-3 rounded-full shadow-md hover:bg-[#051f5c] transition-all duration-300"
        onClick={handleBookNow}
        disabled={isAvailabilityEmpty}
      >
        {isAvailabilityEmpty ? "No Availability Set" : "Confirm Booking"}
      </Button>

      {isAvailabilityEmpty && (
        <p className="text-red-500 mt-4">
          This service provider has not set their availability yet. Please check back later.
        </p>
      )}
    </div>
  );
};

export default BookingPage;
