import { useEffect, useState } from "react";
import { useAuth } from "@/Components/context/AuthContext";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import { Tabs } from "antd";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import { useNavigate } from "react-router-dom";
import Loading from "@/Components/Loading/LoadingState";
import ModernButton from "@/Components/UI/ModernButton";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, X, Calendar as CalendarIcon, MessageSquare, Ban, User } from "lucide-react";

// Styles are now in main.css

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ open: false, appt: null });
  const [retryPaymentModal, setRetryPaymentModal] = useState({ open: false, apptId: null });

  const openCancelModal = (appt) => setCancelModal({ open: true, appt });
  const openRescheduleModal = (appt) => {
    navigate(`/book/${appt.serviceProvider.user.username}?appointmentId=${appt.id}&mode=reschedule`);
  };

  const closeCancelModal = () => setCancelModal({ open: false, appt: null });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get("/appointments", { withCredentials: true });
        const all = response.data;
        const now = new Date(new Date().toISOString());
  
        // === Upcoming Appointments ===
        const upcomingAppointments = all.filter((appt) => {
          const isUserInvolved =
            appt.client.id === user.id || appt.serviceProvider.user.id === user.id;
          const startTime = new Date(appt.startTime);
          const endTime = new Date(appt.endTime);
          const tenMinutesBeforeEnd = new Date(endTime.getTime() - 10 * 60 * 1000);
  
          const isUpcoming =
            (startTime > now || (startTime <= now && now < tenMinutesBeforeEnd));
  
          return isUserInvolved &&
                 isUpcoming &&
                 ["confirmed", "checked_in"].includes(appt.status);
        });
  
        // === Past ===
        const pastAppointments = all.filter((appt) => {
          const isUserInvolved =
            appt.client.id === user.id || appt.serviceProvider.user.id === user.id;
          const endTime = new Date(appt.endTime);
          const isPast = endTime <= now;
          const isCompleted = [
            "completed",
            "paid",
            "checked_out",
            "no_show_client",
            "no_show_provider",
            "cancelled",
          ].includes(appt.status);
  
          return isUserInvolved && (isPast || isCompleted);
        });
  
        setUpcoming(upcomingAppointments);
        setPast(pastAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };
  
    if (user) fetchAppointments();
  }, [user]);
  
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      timeZone: userTimeZone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  if (loading) return <Loading />;

  const handleCheckIn = async (id) => {
    try {
      await api.post(`/appointments/${id}/check-in`);
      toast.success("Checked in successfully");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error checking in");
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await api.post(`/appointments/${id}/check-out`);
      toast.success("Checked out successfully");
      window.location.reload();
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || "Error checking out";
      
      if (
        code === "missing_payment_method" ||
        code === "stripe_payment_failed" ||
        code === "stripe_customer_retrieval_failed"
      ) {
        setRetryPaymentModal({ open: true, apptId: id });
      }
      
      toast.error(`${message}. Please contact your provider to resolve payment directly.`);
    }
  };



  const getTimeStatusMessage = (appt, type) => {
    if (!appt?.startTime || !appt?.serviceProvider?.cancellationWindow) return "";
  
    const start = new Date(appt.startTime);
    const now = new Date();
    const hoursUntil = (start - now) / (1000 * 60 * 60); // hours
    const cancellationWindow = appt.serviceProvider.cancellationWindow;
    const rescheduleFee = appt.serviceProvider.rescheduleFee || 0;
  
    if (type === "cancel") {
      return hoursUntil >= cancellationWindow
        ? "✅ You are eligible for a full deposit refund."
        : "⚠️ You are not eligible for a refund since you are past the cancellation window.";
    }
  
    if (type === "reschedule") {
      return hoursUntil >= cancellationWindow
        ? "✅ No reschedule fee will be charged."
        : `⚠️ A reschedule fee of $${rescheduleFee} will be charged.`;
    }
  
    return "";
  };

  const renderCard = (appt) => {
    const now = new Date();
    const startTime = new Date(appt.startTime);
    const endTime = new Date(appt.endTime);
    const tenMinutesBeforeEnd = new Date(endTime.getTime() - 10 * 60 * 1000);
  
    const isUpcoming =
      (startTime > now || (startTime <= now && now < tenMinutesBeforeEnd)) &&
      ["confirmed", "checked_in"].includes(appt.status);

    const isCheckedIn = appt.status === "checked_in";
    
    // Check if appointment start time is within 15 minutes (before or after) of current time
    const CHECKIN_WINDOW_MIN = 60; // +/- 1 hour
    const windowStart = new Date(startTime.getTime() - CHECKIN_WINDOW_MIN * 60 * 1000);
    const windowEnd   = new Date(startTime.getTime() + CHECKIN_WINDOW_MIN * 60 * 1000);
    const inCheckInWindow = now >= windowStart && now <= windowEnd;
    
    const isProvider = user.role === "service_provider";
    const isOwnAppointment = isProvider && appt.serviceProvider.user.id === user.id;
    const appointmentType = isOwnAppointment ? "Providing" : "Receiving";
    
    
    // Only clients (receivers) can check in, not providers
    const isClient = appt.clientId === user.id;
    const canCheckIn = isUpcoming && !isCheckedIn && inCheckInWindow && isClient;
    
    // Only clients (receivers) can check out
    const canCheckOut = isUpcoming && isCheckedIn && isClient;

    // Style based on status
    const getStatusStyle = (status) => {
      switch (status) {
        case 'confirmed':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'cancelled':
          return 'bg-red-50 text-red-700 border-red-200';
        case 'completed':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'paid':
          return 'bg-green-50 text-green-700 border-green-200';
        case 'no_show_client':
        case 'no_show_provider':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    return (
      <motion.div 
        key={appt.id} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mb-4 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300`}
        whileHover={{ y: -2 }}
      >
        {/* Status indicator */}
        <div className="h-1 w-full bg-gray-100">
          <div 
            className={`h-full ${appt.status === 'confirmed' ? 'bg-blue-500' : 
            appt.status === 'cancelled' ? 'bg-red-500' : 
            appt.status === 'completed' ? 'bg-green-500' : 
            'bg-gray-300'}`} 
            style={{ width: isProvider && isOwnAppointment ? '60%' : '100%' }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {appt.service.name}
                {isProvider && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOwnAppointment ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {appointmentType}
                  </span>
                )}
              </h3>
              <p className="text-gray-600 mt-1 flex items-center gap-1.5">
                <User className="h-4 w-4 text-gray-400" />
                {isOwnAppointment ? (
                  <>Client: <span className="font-medium">{appt.client.name}</span></>
                ) : (
                  <>Provider: <span className="font-medium">{appt.serviceProvider.user.name}</span></>
                )}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusStyle(appt.status)}`}>
              {appt.status === 'confirmed' && <CheckCircle className="h-3 w-3 inline mr-1" />}
              {appt.status === 'cancelled' && <Ban className="h-3 w-3 inline mr-1" />}
              {appt.status.includes('no_show') && <X className="h-3 w-3 inline mr-1" />}
              {appt.status === 'completed' && <CheckCircle className="h-3 w-3 inline mr-1" />}
              {appt.status.charAt(0).toUpperCase() + appt.status.slice(1).replace('_', ' ')}
            </span>
          </div>


          {/* Time and Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Start Time</p>
                  <p className="font-medium text-gray-800">{formatDateTime(appt.startTime)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">End Time</p>
                  <p className="font-medium text-gray-800">{formatDateTime(appt.endTime)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-medium text-gray-800">{appt.service.duration / 60} hours</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 font-bold">$</span>
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-medium text-gray-800">${appt.service.price}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {appt.notes && (
            <div className="mb-4">
              <div className="flex items-center text-gray-700 mb-1">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                <p className="text-sm font-medium">Notes</p>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">{appt.notes}</p>
            </div>
          )}

          {/* Actions Section for Upcoming Appointments */}
          {isUpcoming && (
            <div className="mt-5">
              {/* Policy Info */}
              <p className="text-xs text-gray-500 mb-3">
                {isOwnAppointment
                  ? "Canceling this appointment will refund the client in full."
                  : `Can cancel up to ${appt.serviceProvider.cancellationWindow} hours before appointment for full refund.`}
              </p>

              <div className="flex gap-2 flex-wrap">
                <ModernButton
                  variant="outline"
                  size="sm"
                  icon={<Ban className="h-4 w-4" />}
                  iconPosition="left"
                  onClick={() => openCancelModal(appt)}
                  className="text-sm"
                >
                  Cancel
                </ModernButton>

                {!isOwnAppointment && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={<CalendarIcon className="h-4 w-4" />}
                    iconPosition="left"
                    onClick={() => openRescheduleModal(appt)}
                    className="text-sm"
                  >
                    Reschedule
                  </ModernButton>
                )}

                {/* Check-in and Check-out Buttons */}
                {canCheckIn && (
                  <ModernButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle className="h-4 w-4" />}
                    iconPosition="left"
                    onClick={() => handleCheckIn(appt.id)}
                    className="text-sm"
                  >
                    Check In
                  </ModernButton>
                )}

                {canCheckOut && (
                  <ModernButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle className="h-4 w-4" />}
                    iconPosition="left"
                    onClick={() => handleCheckOut(appt.id)}
                    className="text-sm"
                  >
                    Check Out
                  </ModernButton>
                )}
              </div>

              {isCheckedIn && (
                <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-100 mt-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">Checked In</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const items = [
    {
      key: '1',
      label: 'Upcoming',
      children: (
        <div className="mt-4">
          {upcoming.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No upcoming appointments scheduled.</p>
          ) : (
            <div>{upcoming.map(renderCard)}</div>
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: 'Past',
      children: (
        <div className="mt-4">
          {past.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No past appointments found.</p>
          ) : (
            <div>{past.map(renderCard)}</div>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav />
      <div className="flex-1 bg-gradient-to-b from-gray-50 to-white ml-16 min-[850px]:ml-64 flex flex-col pt-16 min-h-screen overflow-y-auto">  
        <TopNavbar />            
        <div className="p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Appointments</h2>
              <div className="flex items-center gap-2">
                <ModernButton
                  variant="ghost"
                  size="sm"
                  icon={<Calendar className="h-4 w-4" />}
                  iconPosition="left"
                  onClick={() => navigate("/book")}
                >
                  Book New
                </ModernButton>
              </div>
            </div>
            
            <Tabs
              defaultActiveKey="1"
              items={items}
              tabBarStyle={{
                borderBottom: "1px solid #e2e8f0",
                marginBottom: "16px",
              }}
              tabBarGutter={32}
              className="modern-tabs"
            />
          </motion.div>
        </div>
          
        {/* Cancel Modal */}
        <AnimatePresence>
          {cancelModal.open && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-50"
                onClick={closeCancelModal}
              />
              <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25 }}
              >
                <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Cancel Appointment?</h3>
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      icon={<X className="h-5 w-5" />}
                      onClick={closeCancelModal}
                      className="text-gray-500 hover:text-gray-700"
                      rounded="full"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Are you sure you want to cancel this appointment? {cancelModal.appt?.serviceProvider?.cancellationWindow} hour refund policy applies.
                    </p>
                    <div className={`p-3 rounded-lg ${getTimeStatusMessage(cancelModal.appt, "cancel").startsWith("✅") ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <p className={`text-sm ${getTimeStatusMessage(cancelModal.appt, "cancel").startsWith("✅") ? 'text-green-700' : 'text-amber-700'}`}>
                        {getTimeStatusMessage(cancelModal.appt, "cancel")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <ModernButton 
                      variant="ghost" 
                      onClick={closeCancelModal}
                    >
                      Keep Appointment
                    </ModernButton>
                    <ModernButton 
                      variant="danger"
                      onClick={async () => {
                        try {
                          await api.patch(`/appointments/${cancelModal.appt.id}/cancel`);
                          toast.success("Appointment cancelled");
                          closeCancelModal();
                          window.location.reload();
                        } catch (error) {
                          toast.error("Failed to cancel appointment");
                          console.error("Cancel error:", error);
                        }
                      }}
                    >
                      Yes, Cancel
                    </ModernButton>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Retry Payment Modal */}
        <AnimatePresence>
          {retryPaymentModal.open && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-50"
                onClick={() => setRetryPaymentModal({ open: false, apptId: null })}
              />
              <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Update Payment Method</h3>
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      icon={<X className="h-5 w-5" />}
                      onClick={() => setRetryPaymentModal({ open: false, apptId: null })}
                      className="text-gray-500 hover:text-gray-700"
                      rounded="full"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                      <p className="text-amber-700">
                        Your confirmation could not be processed because we couldn't charge your card.
                      </p>
                    </div>
                    <p className="text-gray-600">
                      Please update your payment method or contact your provider if you prefer to handle this directly.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <ModernButton 
                      variant="ghost" 
                      onClick={() => setRetryPaymentModal({ open: false, apptId: null })}
                    >
                      Close
                    </ModernButton>
                    <ModernButton 
                      variant="primary"
                      onClick={() =>
                        navigate(`/checkout?appointmentId=${retryPaymentModal.apptId}&mode=retry`)
                      }
                    >
                      Update Payment
                    </ModernButton>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppointmentsPage;