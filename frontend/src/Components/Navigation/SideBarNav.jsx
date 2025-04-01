import { useNavigate } from "react-router-dom";
import { Home, Bell, User, Calendar, Users, Search, LogOut, Plus } from "lucide-react";
import { Button } from "/Users/tobygabriella/Desktop/Aro/frontend/src/Components/ui/button.jsx";
import { useAuth } from "@/Components/context/AuthContext";
import defaultProfile from "@/assets/default-profile.jpg";
import AroLogo from "@/assets/aro.png"; 

const SidebarNav = ({ onSearchToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="w-64 h-screen bg-[#faf5ff] border-r border-gray-200 flex flex-col justify-between p-4 fixed left-0 top-0 z-50">

      {/* Logo + Profile */}
      <div>
      <div className="mb-4">
        <img src={AroLogo} alt="ARO Logo" className="h-12" /> {/* Bigger and left-aligned */}
      </div>


        {/* Profile section */}
        <div className="flex items-center mb-8 gap-3">
          <img
            src={user?.profilePicture || defaultProfile}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
          <div>
            <p className="font-medium text-[#062970]">{user?.username}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          <SidebarButton 
            icon={<Home size={20} className="text-[#062970]" />} 
            label="Home" 
            onClick={() => navigate("/home")} 
          />
          <SidebarButton 
            icon={<Bell size={20} className="text-[#062970]" />} 
            label="Notifications" 
            onClick={() => navigate("/notifications")} 
          />
          <SidebarButton 
            icon={<User size={20} className="text-[#062970]" />} 
            label="Profile" 
            onClick={() => navigate(`/profile/${user?.username}`)} 
          />
          <SidebarButton 
            icon={<Calendar size={20} className="text-[#062970]" />} 
            label="Appointments" 
            onClick={() => navigate("/appointments")} 
          />
          <SidebarButton 
            icon={<Users size={20} className="text-[#062970]" />} 
            label="Community" 
            onClick={() => navigate("/community")} 
          />
        </nav>
      </div>

      {/* Bottom Buttons */}
      <div className="space-y-1">
        <SidebarButton 
          icon={<Plus size={20} className="text-[#062970]" />} 
          label="New Post" 
          onClick={() => navigate("/create")} 
        />
        <SidebarButton 
          icon={<LogOut size={20} className="text-[#062970]" />} 
          label="Logout" 
          onClick={handleLogout} 
        />
        <SidebarButton 
          icon={<User size={20} className="text-[#062970]" />} 
          label="Edit Profile" 
          onClick={() => navigate("/edit-profile")} 
        />
      </div>
    </div>
  );
};

const SidebarButton = ({ icon, label, onClick }) => (
<Button
  variant="ghost"
  onClick={onClick}
  className="w-full justify-start gap-3 px-3 py-2 !bg-transparent !shadow-none !text-[#062970] hover:!bg-[#f3e8ff] hover:!text-[#6b46c1]"
>
  {icon}
  <span>{label}</span>
</Button>
);


export default SidebarNav;