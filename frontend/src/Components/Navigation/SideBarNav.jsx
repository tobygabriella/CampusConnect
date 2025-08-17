import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Bell, User, Calendar, Users, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/Components/context/AuthContext";
import defaultProfile from "@/assets/default-profile.jpg";
import { useSocket } from "@/hooks/useSocket";
import AroLogo from "@/assets/aro.png";
import PropTypes from 'prop-types';
import api from "@/utils/axiosInstance";
import { formatRoleName } from "@/utils/formatters";

const SidebarNav = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCompact, setIsCompact] = useState(window.innerWidth < 850);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 850);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch unread notifications initially (optional)
  useEffect(() => {
    const getUnread = async () => {
      try {
        const res = await api.get("/notifications?unread=true");
        setUnreadCount(res.data.length);
      } catch (err) {
        console.error("Failed to fetch unread notifications:", err);
      }
    };
  
    if (user?.id) {
      getUnread();
    }
  }, [user?.id]);

  // Join room & listen for incoming
  useSocket(user?.id, () => {
    setUnreadCount((prev) => prev + 1);
  });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/?logout=true';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className={`
      ${isCompact ? 'w-16' : 'w-64'} h-screen bg-white border-r border-gray-200 flex flex-col justify-between
      fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out
      ${isCompact ? 'p-2' : 'p-4'}
    `}>
      {/* Logo + Profile */}
      <div>
        {/* Logo */}
        <div className={`mb-4 ${isCompact ? 'flex justify-center' : ''}`}>
          {isCompact ? (
            <div className="w-10 h-10 bg-[#062970] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          ) : (
            <img src={AroLogo} alt="ARO Logo" className="h-20" />
          )}
        </div>

        {/* Profile section */}
        {!isCompact && (
          <div className="flex items-center mb-8 gap-3">
            <img
              src={user?.profilePicture || defaultProfile}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-gray-300"
            />
            <div>
              <p className="font-medium text-[#062970]">{user?.username}</p>
              <p className="text-sm text-gray-500">{formatRoleName(user?.role)}</p>
            </div>
          </div>
        )}

        {/* Compact profile icon */}
        {isCompact && (
          <div className="flex justify-center mb-6">
            <img
              src={user?.profilePicture || defaultProfile}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-gray-300"
            />
          </div>
        )}

        {/* Nav Links */}
        <nav className={`space-y-1 ${isCompact ? 'flex flex-col items-center' : ''}`}>
          <SidebarButton
            icon={<Home size={20} className="text-[#062970]" />}
            label="Home"
            onClick={() => handleNavigation("/home")}
            isCompact={isCompact}
          />
          <SidebarButton
            icon={
              <div className="relative">
                <Bell size={20} className="text-[#062970]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            }
            label="Notifications"
            onClick={() => {
              setUnreadCount(0);
              handleNavigation("/notifications");
            }}
            isCompact={isCompact}
          />
          <SidebarButton
            icon={<User size={20} className="text-[#062970]" />}
            label="Profile"
            onClick={() => handleNavigation(`/profile/${user?.username}`)}
            isCompact={isCompact}
          />
          <SidebarButton
            icon={<Calendar size={20} className="text-[#062970]" />}
            label="Appointments"
            onClick={() => handleNavigation("/appointments")}
            isCompact={isCompact}
          />
          <SidebarButton
            icon={<Users size={20} className="text-[#062970]" />}
            label="Community"
            onClick={() => handleNavigation("/community")}
            isCompact={isCompact}
          />
        </nav>
      </div>

      {/* Bottom Buttons */}
      <div className={`space-y-1 ${isCompact ? 'flex flex-col items-center' : ''}`}>
        <SidebarButton
          icon={<Plus size={20} className="text-[#062970]" />}
          label="New Post"
          onClick={() => handleNavigation("/create")}
          isCompact={isCompact}
        />
        <SidebarButton
          icon={<LogOut size={20} className="text-[#062970]" />}
          label="Logout"
          onClick={handleLogout}
          isCompact={isCompact}
        />
        <SidebarButton
          icon={<User size={20} className="text-[#062970]" />}
          label="Edit Profile"
          onClick={() => handleNavigation("/edit-profile")}
          isCompact={isCompact}
        />
      </div>
    </div>
  );
};

const SidebarButton = ({ icon, label, onClick, isCompact }) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className={`
      ${isCompact ? 'w-10 h-10 p-0 justify-center' : 'w-full justify-start gap-3 px-3 py-2'}
      !bg-transparent !shadow-none !text-[#062970] hover:!bg-[#f3e8ff] hover:!text-[#6b46c1]
      ${isCompact ? 'mb-2' : ''}
    `}
    title={isCompact ? label : undefined}
  >
    {icon}
    {!isCompact && <span>{label}</span>}
  </Button>
);

SidebarButton.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isCompact: PropTypes.bool.isRequired,
};

export default SidebarNav;
