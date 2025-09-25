import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance";
import { DatePicker, Select } from "antd";
import { useAuth } from "@/Components/context/AuthContext";
import dayjs from "dayjs";
import Loading from "@/Components/Loading/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowLeft, Check, X, AlertCircle, ChevronRight } from "lucide-react";
import ModernButton from "@/Components/UI/ModernButton";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
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
  const { user } = useAuth();
  const [rescheduleFee, setRescheduleFee] = useState(0);
  const [bookingWithSelf, setBookingWithSelf] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/profile/${username}`);
        setServices(response.data.services || []);
        setRescheduleFee(response.data.serviceProvider?.rescheduleFee || 0);
        const isSelf = response.data.username === user?.username;
        setBookingWithSelf(isSelf);

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
      }finally {
        setLoading(false);
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
    const nextDayKey = dayjs(key).add(1, 'day').format("YYYY-MM-DD");
    
    // Enable date if either current day or next day has availability
    return !(
      availability[key]?.length > 0 || 
      availability[nextDayKey]?.some(slot => slot.startsWith("00:00"))
    );
  };

  const generateAvailableSlots = () => {
    if (!selectedDate || duration === 0) return [];
  
    const selectedDayStart = selectedDate.startOf("day");
    const selectedDayEnd = selectedDate.endOf("day");
  
    const allSlots = [];
  
    // Loop through both current day and next day availability keys
    for (const key of [selectedDate.format("YYYY-MM-DD"), dayjs(selectedDate).add(1, "day").format("YYYY-MM-DD")]) {
      const daySlots = availability[key] || [];
      for (const slot of daySlots) {
        const [startStr, endStr] = slot.split(" - ");
        const startUTC = dayjs.utc(`${key}T${startStr}`);
        const endUTC = dayjs.utc(`${key}T${endStr}`);
  
        // Convert to local
        const startLocal = startUTC.local();
        const endLocal = endUTC.local();
  
        // Only include if it intersects the selected date
        if (
          startLocal.isSame(selectedDayStart, 'day') ||
          endLocal.isSame(selectedDayStart, 'day') ||
          (startLocal.isBefore(selectedDayEnd) && endLocal.isAfter(selectedDayStart))
        ) {
          allSlots.push({ startLocal, endLocal });
        }
      }
    }
  
    // Sort by start time
    allSlots.sort((a, b) => a.startLocal.unix() - b.startLocal.unix());
  
    // Merge overlapping/adjacent slots in local time
    const mergedSlots = [];
    let current = null;
  
    for (const slot of allSlots) {
      if (!current) {
        current = { ...slot };
      } else if (slot.startLocal.isSameOrBefore(current.endLocal)) {
        // Extend end time if overlapping or adjacent
        if (slot.endLocal.isAfter(current.endLocal)) {
          current.endLocal = slot.endLocal;
        }
      } else {
        mergedSlots.push(current);
        current = { ...slot };
      }
    }
    if (current) mergedSlots.push(current);
  
    // Create valid time slots in 15-min increments
    const finalSlots = [];
  
    for (const { startLocal, endLocal } of mergedSlots) {
      let cursor = startLocal.clone();
    
      while (cursor.add(duration, "minute").isSameOrBefore(endLocal)) {
        const slotStart = cursor.format("HH:mm");
        const slotEnd = cursor.add(duration, "minute").format("HH:mm");
    
        // ✅ Only add if it's today and not in the past
        const now = dayjs();
        const isToday = cursor.isSame(now, "day");
        const isFuture = !isToday || cursor.isAfter(now.add(5, "minute"));
    
        if (cursor.isSame(selectedDayStart, "day") && isFuture) {
          finalSlots.push(`${slotStart} - ${slotEnd}`);
        }
    
        cursor = cursor.add(15, "minute");
      }
    }
    
  
    return [...new Set(finalSlots)].sort((a, b) => {
      const [aStart] = a.split(" - ");
      const [bStart] = b.split(" - ");
      return aStart.localeCompare(bStart);
    });
  };
  
  
  const handleBookNow = () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      toast.error("Please select a service, date, and time.");
      return;
    }
  
    const [slotStartLocal] = selectedTimeSlot.split(" - ");
    const localDateTime = dayjs(`${selectedDate.format("YYYY-MM-DD")}T${slotStartLocal}`);
    const utcDateTime = localDateTime.utc();
  
    const utcDate = utcDateTime.format("YYYY-MM-DD");
    const utcTime = utcDateTime.format("HH:mm");
    navigate(
      `/checkout?provider=${username}&service=${selectedService}&date=${utcDate}&start=${utcTime}&duration=${duration}`
    );
  };
  
  
  const handleRescheduleNow = async () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      toast.error("Please select a new service, date, and time.");
      return;
    }
  
    const [slotStartLocal] = selectedTimeSlot.split(" - ");
    const localDateStr = selectedDate.format("YYYY-MM-DD");
  
    // Create local datetime → convert to UTC
    const localDateTime = dayjs(`${localDateStr}T${slotStartLocal}`);
    const utcDateTime = localDateTime.utc();
    const utcDate = utcDateTime.format("YYYY-MM-DD");
    const utcTime = utcDateTime.format("HH:mm");
  
    // Compare to original UTC values to avoid resending same slot
    if (utcDate === originalDate && utcTime === originalStartTime) {
      toast.error("Please choose a new date or time to reschedule.");
      return;
    }

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
  
  if (loading) return <Loading />;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-100 py-4 px-6 mb-8"
      >
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/appointments" className="text-gray-500 hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {rescheduleMode ? "Reschedule Appointment" : "Book a Service"}
            </h1>
          </div>
        </div>
      </motion.div>
      
      <div className="container mx-auto max-w-3xl px-4 pb-12">
        {/* Progress Steps */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center items-center gap-8 mb-10 w-full"
        >
          {["Service Details", "Payment"].map((step, i) => (
            <div
              key={step}
              className={`flex flex-col items-center text-sm font-medium ${i === 0 ? "text-blue-600" : "text-gray-400"}`}
            >
              <div className={`rounded-full h-10 w-10 flex items-center justify-center shadow-sm ${i === 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                {i === 0 ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className="mt-2">{step}</span>
              {i === 0 && (
                <motion.div 
                  className="h-1 w-12 bg-blue-600 mt-1 rounded-full"
                  layoutId="activeStep"
                />
              )}
            </div>
          ))}
        </motion.div>

      {/* Booking Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 space-y-6">
          {/* Service Selection */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Select a Service <span className="text-red-500">*</span></label>
            </div>
            
            {rescheduleMode ? (
              <div className="p-4 bg-blue-50 rounded-lg text-gray-800 font-medium border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{services.find(s => s.id === selectedService)?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{services.find(s => s.id === selectedService)?.duration / 60} hrs</p>
                </div>
                <p className="text-lg font-semibold text-blue-600">${services.find(s => s.id === selectedService)?.price}</p>
              </div>
            ) : (
              <Select
                className="w-full"
                placeholder="Select a Service"
                value={selectedService}
                onChange={setSelectedService}
                dropdownStyle={{ borderRadius: '0.5rem' }}
                style={{ borderRadius: '0.5rem' }}
              >
                {services.map((service) => (
                  <Select.Option key={service.id} value={service.id}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{service.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({service.duration / 60} hrs)</span>
                      </div>
                      <span className="font-semibold text-blue-600">${service.price}</span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Select a Date <span className="text-red-500">*</span></label>
            </div>
            <DatePicker
              className="w-full rounded-lg"
              value={selectedDate ? dayjs(selectedDate) : null}
              placeholder="Select a Date"
              onChange={(date) => {
                setSelectedDate(dayjs(date));
                setSelectedTimeSlot(null);
              }}
              disabled={isAvailabilityEmpty}
              disabledDate={disabledDate}
              style={{ borderRadius: '0.5rem', height: '42px' }}
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Select a Time <span className="text-red-500">*</span></label>
            </div>
            
            {generateAvailableSlots().length > 0 ? (
              <div>
                <Select
                  className="w-full"
                  placeholder="Select a Time Slot"
                  value={selectedTimeSlot}
                  onChange={setSelectedTimeSlot}
                  style={{ borderRadius: '0.5rem' }}
                >
                  {generateAvailableSlots().map((slot, index) => (
                    <Select.Option key={index} value={slot}>
                      <div className="py-1">
                        <span className="font-medium">{slot}</span>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  {!selectedDate ? "Please select a date first" : "No available time slots on the selected date"}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <ModernButton
              variant={isAvailabilityEmpty || bookingWithSelf || !providerIsReadyToBook ? "ghost" : "primary"}
              size="lg"
              fullWidth
              rounded="lg"
              icon={<ChevronRight className="h-5 w-5" />}
              iconPosition="right"
              onClick={rescheduleMode ? handleRescheduleNow : handleBookNow}
              disabled={isAvailabilityEmpty || bookingWithSelf || !providerIsReadyToBook}
              className="font-medium"
            >
              {isAvailabilityEmpty
                ? "No Availability Set"
                : bookingWithSelf
                ? "You cannot book yourself"
                : !providerIsReadyToBook
                ? "Provider Unavailable"
                : rescheduleMode
                ? "Confirm Reschedule"
                : "Continue to Payment"}
            </ModernButton>
          </div>
        </div>
      </motion.div>

      {/* Error Messages */}
      <AnimatePresence>
        {!providerIsReadyToBook && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-100 rounded-lg p-4 mt-6 text-red-600 text-sm flex items-center space-x-2"
          >
            <X className="h-5 w-5" />
            <p>This provider is not currently accepting bookings.</p>
          </motion.div>
        )}
        {isAvailabilityEmpty && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-50 border border-amber-100 rounded-lg p-4 mt-6 text-amber-700 text-sm flex items-center space-x-2"
          >
            <AlertCircle className="h-5 w-5" />
            <p>This service provider has not set their availability yet. Please check back later.</p>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default BookingPage;