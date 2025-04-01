import { useEffect, useState } from "react";
import { useAuth } from "@/Components/context/AuthContext";
import api from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import { Tabs } from "antd";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get("/bookings", { withCredentials: true });
        const all = response.data;

        const now = new Date();

        const upcomingAppointments = all.filter((appt) => {
          const isUserInvolved = appt.client.id === user.id || 
                               appt.serviceProvider.user.id === user.id;
          return isUserInvolved && new Date(appt.startTime) > now;
        });

        const pastAppointments = all.filter((appt) => {
          const isUserInvolved = appt.client.id === user.id || 
                               appt.serviceProvider.user.id === user.id;
          return isUserInvolved && new Date(appt.endTime) <= now;
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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      timeZone: 'UTC', // Explicitly use UTC
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="text-center mt-10">Loading appointments...</div>;

  const renderCard = (appt) => {
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
    },
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
                    </div>
                </div>
            </div>
        </div>

  );
};

export default AppointmentsPage;