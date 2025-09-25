import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Home, Bell, User, Calendar, Users, LogOut, Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/Components/context/AuthContext";
import defaultProfile from "@/assets/default-profile.jpg";
import { useSocket } from "@/hooks/useSocket";
import AroLogo from "@/assets/aro.png";
import PropTypes from 'prop-types';
import api from "@/utils/axiosInstance";
import { formatRoleName } from "@/utils/formatters";
import { motion, AnimatePresence } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";

// Styles are now in main.css

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
    <motion.div 
      className={`
        sidebar-nav
        ${isCompact ? 'w-20' : 'w-72'} h-screen bg-white border-r border-gray-200 flex flex-col justify-between
        fixed left-0 top-0 z-40 shadow-lg
        ${isCompact ? 'px-3 py-6' : 'px-5 py-6'}
      `}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Collapse/Expand toggle */}
      <div className="sidebar-toggle absolute -right-3 top-12">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ModernButton
            variant="white"
            size="sm"
            className="!p-1.5 rounded-full shadow-md border border-gray-200"
            onClick={() => setIsCompact(!isCompact)}
          >
            {isCompact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </ModernButton>
        </motion.div>
      </div>

      {/* Logo + Profile */}
      <div>
        {/* Logo */}
        <motion.div 
          className={`mb-8 ${isCompact ? 'flex justify-center' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/home">
            {isCompact ? (
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
                <span className="text-white font-bold text-xl">A</span>
              </div>
            ) : (
              <img src={AroLogo} alt="ARO Logo" className="h-16" />
            )}
          </Link>
        </motion.div>

        {/* Profile section */}
        <AnimatePresence>
          {!isCompact && (
            <motion.div 
              className="sidebar-profile flex items-center mb-10 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
              onClick={() => handleNavigation(`/profile/${user?.username}`)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <img
                  src={user?.profilePicture || defaultProfile}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="ml-3 flex-grow overflow-hidden">
                <p className="font-medium text-gray-800 truncate">{user?.username || 'User'}</p>
                <p className="text-sm text-blue-600">{formatRoleName(user?.role) || 'Student'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact profile icon */}
        <AnimatePresence>
          {isCompact && (
            <motion.div 
              className="flex justify-center mb-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div 
                className="relative cursor-pointer"
                onClick={() => handleNavigation(`/profile/${user?.username}`)}
              >
                <motion.img
                  src={user?.profilePicture || defaultProfile}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav Links */}
        <div className="mb-6">
          <AnimatePresence>
            {!isCompact && (
              <motion.h3 
                className="sidebar-label text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Menu
              </motion.h3>
            )}
          </AnimatePresence>
          
          <nav className={`nav-buttons space-y-2 ${isCompact ? 'flex flex-col items-center' : ''}`}>
            <SidebarButton
              icon={<Home size={20} />}
              label="Home"
              onClick={() => handleNavigation("/home")}
              isCompact={isCompact}
              isActive={window.location.pathname === "/home"}
            />
            <SidebarButton
              icon={
                <div className="relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold">
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
              isActive={window.location.pathname === "/notifications"}
            />
            <SidebarButton
              icon={<Calendar size={20} />}
              label="Appointments"
              onClick={() => handleNavigation("/appointments")}
              isCompact={isCompact}
              isActive={window.location.pathname === "/appointments"}
            />
            {user?.role !== "service_provider" && (
              <SidebarButton
                icon={<Users size={20} />}
                label="Community"
                onClick={() => handleNavigation("/community")}
                isCompact={isCompact}
                isActive={window.location.pathname === "/community"}
              />
            )}
          </nav>
        </div>
        
        <div className="mb-6">
          <AnimatePresence>
            {!isCompact && (
              <motion.h3 
                className="sidebar-label text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Account
              </motion.h3>
            )}
          </AnimatePresence>
          
          <nav className={`nav-buttons space-y-2 ${isCompact ? 'flex flex-col items-center' : ''}`}>
            <SidebarButton
              icon={<User size={20} />}
              label="My Profile"
              onClick={() => handleNavigation(`/profile/${user?.username}`)}
              isCompact={isCompact}
              isActive={window.location.pathname === `/profile/${user?.username}`}
            />
            <SidebarButton
              icon={<Settings size={20} />}
              label="Edit Profile"
              onClick={() => handleNavigation("/edit-profile")}
              isCompact={isCompact}
              isActive={window.location.pathname === "/edit-profile"}
            />
          </nav>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="pb-4">
        <motion.div
          className={`sidebar-create-button mb-6 ${isCompact ? 'flex justify-center' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ModernButton
            variant="primary"
            size="md"
            icon={<Plus size={20} />}
            iconPosition="left"
            onClick={() => handleNavigation("/create")}
            className={isCompact ? 'w-12 h-12 !p-0 rounded-xl' : 'w-full rounded-xl'}
          >
            {!isCompact && 'Create Post'}
          </ModernButton>
        </motion.div>

        <div className={`space-y-2 ${isCompact ? 'flex flex-col items-center' : ''}`}>
          <SidebarButton
            icon={<LogOut size={20} />}
            label="Logout"
            onClick={handleLogout}
            isCompact={isCompact}
            variant="danger"
          />
        </div>
      </div>
    </motion.div>
  );
};

const SidebarButton = ({ icon, label, onClick, isCompact, isActive, variant }) => {
  // Determine the style based on active state and variant
  const buttonVariant = variant === 'danger' ? 'danger' : 
                        isActive ? 'primary-subtle' : 'ghost';
  
  const classes = isCompact ? 
    'w-12 h-12 !p-0 rounded-xl' : 
    'w-full justify-start text-left rounded-xl';
  
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <ModernButton
        variant={buttonVariant}
        size="md"
        onClick={onClick}
        className={classes}
        title={isCompact ? label : undefined}
        icon={icon}
        iconPosition="left"
      >
        <AnimatePresence>
          {!isCompact && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="truncate"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Active indicator */}
        {isActive && !isCompact && variant !== 'danger' && (
          <div className="ml-auto w-1.5 h-5 rounded-full bg-blue-600"></div>
        )}
      </ModernButton>
    </motion.div>
  );
};

SidebarButton.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isCompact: PropTypes.bool.isRequired,
  isActive: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'danger']),
};

SidebarButton.defaultProps = {
  isActive: false,
  variant: 'default',
};

export default SidebarNav;
