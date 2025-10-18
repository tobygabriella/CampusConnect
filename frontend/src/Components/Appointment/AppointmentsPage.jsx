import { useEffect, useState } from "react";
import { useAuth } from "@/Components/context/AuthContext";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import { Tabs } from "antd";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Loading from "@/Components/Loading/LoadingState";

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

    return (
      <div 
        key={appt.id} 
        className={`p-6 mb-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ${
          isProvider ? (isOwnAppointment ? "border-l-4 border-blue-500" : "border-l-4 border-green-500") : ""
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-[#062970]">
              {appt.service.name}
              {isProvider && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({appointmentType})
                </span>
              )}
            </h3>
            <p className="text-gray-600">
              {isOwnAppointment ? (
                <>Client: {appt.client.name}</>
              ) : (
                <>Provider: {appt.serviceProvider.user.name}</>
              )}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            appt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
            appt.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            {appt.status}
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Start Time</p>
            <p className="font-medium">{formatDateTime(appt.startTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Time</p>
            <p className="font-medium">{formatDateTime(appt.endTime)}</p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">{appt.service.duration / 60} hours</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="font-medium">${appt.service.price}</p>
          </div>
        </div>
        {isUpcoming && (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
              {isOwnAppointment
                ? "Canceling this appointment will refund the client in full."
                : `Can cancel up to ${appt.serviceProvider.cancellationWindow} hours before appointment for full deposit refund.`}
              </p>
              <div className="flex gap-4">
                <Button variant="ghost"
                  onClick={() => openCancelModal(appt)}
                  className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                  style={{ color: "#062970"}}
                >
                  Cancel
                </Button>
                {!isOwnAppointment && (
                  <Button variant="ghost"
                    onClick={() => openRescheduleModal(appt)}
                    className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                    style={{ color: "#062970"}}
                  >
                    Reschedule
                  </Button>
                )}
              </div>
            </div>
            
            {/* Check-in and Check-out Buttons */}
            <div className="flex justify-end gap-4">
              {canCheckIn && (
                <Button variant="ghost"
                  onClick={() => handleCheckIn(appt.id)}
                  className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                  style={{ color: "#062970"}}
                >
                  ✅ Check In
                </Button>
              )}
              
              {canCheckOut && (
                <Button variant="ghost"
                  onClick={() => handleCheckOut(appt.id)}
                  className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                  style={{ color: "#062970"}}
                >
                  🏁 Check Out
                </Button>
              )}
              
              {isCheckedIn && (
                <div className="text-sm text-green-600 font-semibold mt-2">
                  ✓ Checked In
                </div>
              )}
            </div>
          </div>
        )}
        {appt.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="font-medium">{appt.notes}</p>
          </div>
        )}

      </div>
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
      <div className="flex-1 bg-gradient-to-b from-white to-[#f5f5f5] ml-16 min-[850px]:ml-64 flex flex-col pt-16 min-h-screen overflow-y-auto">  
            <TopNavbar />            
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-[#010a4f] mb-6">Your Appointments</h2>
                <Tabs
                defaultActiveKey="1"
                items={items}
                tabBarStyle={{
                    borderBottom: "1px solid #e2e8f0",
                    marginBottom: "16px",
                }}
                tabBarGutter={32}
                className="custom-tabs"
                />
                {cancelModal.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="relative bg-white p-6 rounded shadow-lg max-w-sm w-full">
                      <Button variant="ghost" 
                        onClick={closeCancelModal}
                        className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                        aria-label="Close"
                        style={{ color: "#062970"}}
                      >
                        &times;
                      </Button>
                      <h3 className="text-lg font-semibold mb-4 text-[#062970]">Cancel Appointment?</h3>
                      <p className="text-sm mb-6 text-gray-600">
                        Are you sure you want to cancel this appointment? {cancelModal.appt?.serviceProvider?.cancellationWindow} hour refund policy applies.
                      </p>
                      <p className="text-sm mb-4 text-gray-500 italic">
                        {getTimeStatusMessage(cancelModal.appt, "cancel")}
                      </p>
                      <div className="flex justify-end gap-3">
                        <Button variant="ghost"  onClick={closeCancelModal} className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]" style={{ color: "#062970"}}>No</Button>
                        <Button variant="ghost" 
                          onClick={async () => {
                            try {
                              await api.patch(`/appointments/${cancelModal.appt.id}/cancel`);
                              toast.success("Appointment cancelled");
                              closeCancelModal();
                              window.location.reload();
                            } catch {
                              toast.error("Failed to cancel appointment");
                            }
                          }}
                          className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                          style={{ color: "#062970"}}
                        >
                          Yes, Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {retryPaymentModal.open && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                      <h2 className="text-xl font-bold mb-4 text-[#062970]">Add a Payment Method</h2>
                      <p className="text-gray-600 mb-4">
                        Your confirmation could not go through because we couldn’t charge your card. Please update your payment methodor contact your provider if you would prefer to handle this directly.
                      </p>
                      <div className="flex justify-end gap-4">
                        <Button onClick={() => setRetryPaymentModal({ open: false, apptId: null })} style={{ color: "#062970"}}>Close</Button>
                        <Button
                          onClick={() =>
                            navigate(`/checkout?appointmentId=${retryPaymentModal.apptId}&mode=retry`)
                          }
                          style={{ color: "#062970"}}
                        >
                          Update Payment
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </div>
      </div>
  </div>
  );
};

export default AppointmentsPage;