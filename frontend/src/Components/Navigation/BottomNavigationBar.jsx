import { useNavigate } from "react-router-dom";
import { Home, Bell, User, Calendar, Users, Search, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/Components/context/AuthContext";

const BottomNavigationBar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
      <button className="text-gray-600 hover:text-[#062970]" onClick={() => navigate("/")}>
        <Home size={24} />
      </button>
      <button className="text-gray-600 hover:text-[#062970]" onClick={() => navigate("/notifications")}>
        <Bell size={24} />
      </button>
      <button className="text-gray-600 hover:text-[#062970]" onClick={() => navigate("/profile")}>
        <User size={24} />
      </button>
      {user?.role === "service_provider" && (
        <button className="text-gray-600 hover:text-[#062970]" onClick={() => navigate("/availability")}>
          <Calendar size={24} />
        </button>
      )}
      <button className="text-gray-600 hover:text-[#062970]" onClick={() => navigate("/community")}>
        <Users size={24} />
      </button>
      <button className="text-gray-600 hover:text-[#062970]" onClick={() => navigate("/search")}>
        <Search size={24} />
      </button>
      <button className="text-gray-600 hover:text-[#062970]" onClick={handleLogout}>
        <LogOut size={24} />
      </button>
      <button className="text-gray-600 hover:text-[#062970]" onClick={() => navigate("/create")}>
        <Plus size={24} />
      </button>
    </div>
  );
};

export default BottomNavigationBar;