import { useEffect, useState } from "react";
import { useAuth } from "@/Components/context/AuthContext";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import { Tabs } from "antd";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";


const AppointmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [awaiting, setAwaiting] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [noteModal, setNoteModal] = useState({ open: false, apptId: null, note: "" });
  const [cancelModal, setCancelModal] = useState({ open: false, appt: null });

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
  
        // === Awaiting Confirmation First ===
        const awaitingConfirmationAppointments = all.filter((appt) => {
          const isUserInvolved =
            appt.client.id === user.id || appt.serviceProvider.user.id === user.id;
          const endTime = new Date(appt.endTime);
          const tenMinutesBeforeEnd = new Date(endTime.getTime() - 10 * 60 * 1000);
  
          const isReadyToConfirm = now >= tenMinutesBeforeEnd;
          const needsConfirmation =
            appt.status === "confirmed" &&
            (!appt.clientConfirmed || !appt.providerConfirmed);
  
          const shouldInclude =
            isUserInvolved && isReadyToConfirm && needsConfirmation;
  
          return shouldInclude;
        });
  
        const awaitingIds = new Set(awaitingConfirmationAppointments.map((a) => a.id));
  
        // === Upcoming (exclude awaiting) ===
        const upcomingAppointments = all.filter((appt) => {
          const isUserInvolved =
            appt.client.id === user.id || appt.serviceProvider.user.id === user.id;
          const startTime = new Date(appt.startTime);
          const endTime = new Date(appt.endTime);
          const tenMinutesBeforeEnd = new Date(endTime.getTime() - 10 * 60 * 1000);
  
          const isUpcoming =
            (startTime > now || (startTime <= now && now < tenMinutesBeforeEnd)) &&
            !awaitingIds.has(appt.id);
  
          return isUserInvolved && isUpcoming && appt.status === "confirmed";
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
            "no_show_client",
            "no_show_provider",
            "cancelled",
          ].includes(appt.status);
  
          return isUserInvolved && isPast && isCompleted;
        });
  
        setUpcoming(upcomingAppointments);
        setAwaiting(awaitingConfirmationAppointments);
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
  
  if (loading) return <div className="text-center mt-10">Loading appointments...</div>;

  const handleConfirm = async (id) => {
    try {
      await api.post(`/appointments/${id}/confirm`);
      toast.success("Appointment confirmed");
      window.location.reload();
    } catch {
      toast.error("Error confirming appointment");
    }
  };

  const handleReportNoShow = async (id, who) => {
    try {
      await api.patch(`/appointments/${id}/report-no-show`, { noShow: who });
      toast.success("No-show reported");
      window.location.reload();
    } catch {
      toast.error("Error reporting no-show");
    }
  };

  const submitNote = async () => {
    try {
      await api.patch(`/appointments/${noteModal.apptId}/add-note`, {
        note: noteModal.note
      });
      toast.success("Note added");
      setNoteModal({ open: false, apptId: null, note: "" });
      window.location.reload();
    } catch {
      toast.error("Failed to save note");
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
    const isUserInvolved =
      appt.client.id === user.id || appt.serviceProvider.user.id === user.id;
    const endTime = new Date(appt.endTime);
    const tenMinutesBeforeEnd = new Date(endTime.getTime() - 10 * 60 * 1000);
  
    const isReadyToConfirm = now >= tenMinutesBeforeEnd;
    const needsConfirmation =
      appt.status === "confirmed" &&
      (!appt.clientConfirmed || !appt.providerConfirmed);
  
    const isAwaiting =
      isUserInvolved && isReadyToConfirm && needsConfirmation;
  
    const isUpcoming =
      (startTime > now || (startTime <= now && now < tenMinutesBeforeEnd)) &&
      appt.status === "confirmed";

    const isProvider = user.role === "service_provider";
    const isOwnAppointment = isProvider && appt.serviceProvider.user.id === user.id;
    const appointmentType = isOwnAppointment ? "Providing" : "Receiving";

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
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
            {isOwnAppointment
              ? "Canceling this appointment will refund the client in full."
              : `Can cancel up to ${appt.serviceProvider.cancellationWindow} hours before appointment for full deposit refund.`}
            </p>       
            <div className="flex gap-4">
              <Button variant="ghost" 
                onClick={() => openCancelModal(appt)}
                className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
              >
                Cancel
              </Button>
              {!isOwnAppointment && (
                <Button variant="ghost" 
                  onClick={() => openRescheduleModal(appt)}
                  className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                >
                  Reschedule
                </Button>
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
        {isAwaiting && (
          <div className="mt-6 border-t pt-4">
            {(
              (user.id === appt.client.id && appt.clientConfirmed) ||
              (user.id === appt.serviceProvider.user.id && appt.providerConfirmed)
            ) ? (
              <p className="text-sm text-gray-600">
                ✅ You have confirmed this appointment. Waiting for{" "}
                <span className="font-semibold">
                  {user.id === appt.client.id ? "the service provider" : "the client"}
                </span>{" "}
                to confirm.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Help us confirm whether this appointment occurred:
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="ghost" 
                    onClick={() => handleConfirm(appt.id)}
                    className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                  >
                    ✅ Confirm Appointment
                  </Button>
                  <Button variant="ghost" 
                    onClick={() =>
                      handleReportNoShow(
                        appt.id,
                        user.id === appt.client.id ? "client" : "provider"
                      )
                    }
                    className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                  >
                    ❌ Report No-Show
                  </Button>
                </div>

                <textarea
                  className="w-full mt-4 p-2 border rounded-md"
                  rows={3}
                  placeholder="Optional notes (e.g. feedback, what happened)..."
                  onChange={(e) =>
                    setNoteModal((prev) => ({
                      ...prev,
                      apptId: appt.id,
                      note: e.target.value,
                    }))
                  }
                />

                <Button variant="ghost" 
                  onClick={submitNote}
                  className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                >
                  💬 Submit Note
                </Button>
              </>
            )}
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
    },
    {
      key: '3',
      label: 'Awaiting Confirmation',
      children: (
        <div className="mt-4">
          {awaiting.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No appointments awaiting confirmation.
            </p>
          ) : (
            <div>{awaiting.map(renderCard)}</div>
          )}
        </div>
      ),
    }
    
  ];

  return (
        <div className="flex w-screen overflow-x-hidden">
            <SidebarNav />
            <div className="ml-64 min-h-screen w-full bg-gradient-to-b from-[#f3e8ff] to-white flex flex-col pt-16">
                <TopNavbar />
                
                <div className="p-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-2xl font-bold text-[#062970] mb-6">Your Appointments</h2>

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
                                <Button variant="ghost"  onClick={closeCancelModal} className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]">No</Button>
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
                                >
                                  Yes, Cancel
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