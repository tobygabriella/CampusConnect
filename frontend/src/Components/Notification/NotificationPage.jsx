import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, Mail, Bell, CheckCircle, XCircle, Clock, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import api from "@/utils/axiosInstance";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import WorkPostModal from "@/Components/WorkPost/WorkPostModal";
import { Tabs } from "antd";
import Loading from "@/Components/Loading/LoadingState";
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";

// Import our custom styles
import "@/styles/modern-tabs.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkPostId, setSelectedWorkPostId] = useState(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const navigate = useNavigate();

  // Fetch all notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/notifications");
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      } catch (err) {
        console.error("Notification fetch error:", err);
        setError("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Mark one as read and navigate
  const handleClick = async (notif) => {
    if (!notif.isRead) {
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => prev - 1);
  
      try {
        await api.patch(`/notifications/${notif.id}/read`);
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
    // Handle navigation based on notification type and metadata
    if (notif.metadata?.link) {
        // Direct link takes highest priority
        navigate(notif.metadata.link);
        return;
    }

    // Handle comment-related notifications
    if (notif.metadata?.commentId) {
        const isDeeplyNested = notif.metadata?.depth >= 6;

        if (notif.type === "COMMENT_REPLY") {
        if (isDeeplyNested) {
            navigate(`/comments/${notif.metadata.commentId}/thread`);
        } else if (notif.metadata.forumPostId) {
            navigate(`/community/posts/${notif.metadata.forumPostId}?highlight=${notif.metadata.commentId}`);
        }
        return;
        }

        // Handle other comment types
        if (notif.metadata.forumPostId) {
            navigate(`/community/posts/${notif.metadata.forumPostId}?highlight=${notif.metadata.commentId}`);
            return;
        }
    }

    // Handle post-related notifications
    if (notif.metadata?.forumPostId) {
        navigate(`/community/posts/${notif.metadata.forumPostId}`);
        return;
    }

    // Handle work post notifications
    if (notif.metadata?.workPostId) {
        setSelectedWorkPostId(notif.metadata.workPostId);
        if (notif.metadata.commentId) {
        setHighlightedCommentId(notif.metadata.commentId);
        }
        return;
    }
};  

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Categorize notifications
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const items = [
    {
      key: '1',
      label: (
        <div className="flex items-center gap-2">
          <Bell size={16} />
          <span>Unread ({unreadNotifications.length})</span>
        </div>
      ),
      children: (
        <div className="mt-4">
          {unreadNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-4"
            >
              <div className="bg-gray-50 inline-flex rounded-full p-6 mb-4">
                <Mail size={42} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No unread notifications</h3>
              <p className="text-gray-500 text-sm">When you receive notifications, they'll appear here</p>
            </motion.div>
          ) : (
            <NotificationList 
              notifications={unreadNotifications} 
              onClick={handleClick}
            />
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className="flex items-center gap-2">
          <Mail size={16} />
          <span>Read</span>
        </div>
      ),
      children: (
        <div className="mt-4">
          {readNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-4"
            >
              <div className="bg-gray-50 inline-flex rounded-full p-6 mb-4">
                <Mail size={42} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No read notifications</h3>
              <p className="text-gray-500 text-sm">Your history of read notifications will appear here</p>
            </motion.div>
          ) : (
            <NotificationList 
              notifications={readNotifications} 
              onClick={handleClick}
            />
          )}
        </div>
      ),
    }
  ];

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="flex w-screen overflow-x-hidden">
        <SidebarNav />
        <div className="flex-1 bg-gradient-to-b from-gray-50 to-white ml-16 min-[850px]:ml-64 flex flex-col pt-16 min-h-screen overflow-y-auto transition-all duration-300">
          <TopNavbar />
          <div className="p-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
              
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg mb-6">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700 mb-1">Error Loading Notifications</p>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
              
              <ModernButton
                variant="primary"
                size="md"
                icon={<RefreshCw className="h-4 w-4" />}
                iconPosition="left"
                onClick={() => window.location.reload()}
              >
                Retry
              </ModernButton>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav />
      <div className="flex-1 bg-gradient-to-b from-gray-50 to-white ml-16 min-[850px]:ml-64 flex flex-col pt-16 min-h-screen overflow-y-auto transition-all duration-300">
        <TopNavbar />
        <div className="p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <p className="text-gray-500 text-sm">
                  {unreadCount > 0 
                    ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` 
                    : "You're all caught up!"}
                </p>
              </div>
              
              {unreadCount > 0 && (
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  icon={<Bell size={16} />}
                  iconPosition="left"
                >
                  Mark all as read
                </ModernButton>
              )}
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
      </div>
      {selectedWorkPostId && (
        <WorkPostModal 
            postId={selectedWorkPostId} 
            onClose={() => {
                setSelectedWorkPostId(null);
                setHighlightedCommentId(null);
              }} 
              highlightedCommentId={highlightedCommentId}
        />
        )}
    </div>
  );
};

// Sub-components
const NotificationList = ({ notifications, onClick }) => (
  <div className="space-y-4">
    <AnimatePresence>
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id}
          notif={notif}
          onClick={onClick}
        />
      ))}
    </AnimatePresence>
  </div>
);

NotificationList.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    })
  ).isRequired,
  onClick: PropTypes.func.isRequired,
};

const NotificationItem = ({ notif, onClick }) => {
  const iconProps = {
    className: "w-5 h-5",
    fill: notif.type.includes('LIKE') ? "currentColor" : "none"
  };

  const getIconAndBg = () => {
    const type = notif.type;
    
    // Comment related
    if (type.includes('COMMENT') || type.includes('POST_COMMENT')) {
      return {
        icon: <MessageSquare {...iconProps} className="text-blue-600" />,
        bg: 'bg-blue-100',
        borderColor: 'border-blue-200'
      };
    }
    
    // Like related
    if (type.includes('LIKE') || type.includes('UPVOTE')) {
      return {
        icon: <Heart {...iconProps} className="text-red-600" />,
        bg: 'bg-red-100',
        borderColor: 'border-red-200'
      };
    }
    
    // Appointment related
    if (type.includes('APPOINTMENT')) {
      if (type === 'APPOINTMENT_CONFIRMED') {
        return {
          icon: <CheckCircle {...iconProps} className="text-green-600" />,
          bg: 'bg-green-100',
          borderColor: 'border-green-200'
        };
      }
      
      if (type === 'APPOINTMENT_CANCELLED') {
        return {
          icon: <XCircle {...iconProps} className="text-red-600" />,
          bg: 'bg-red-100',
          borderColor: 'border-red-200'
        };
      }
      
      if (type.includes('REMINDER') || type === 'APPOINTMENT_RESCHEDULED') {
        return {
          icon: <Clock {...iconProps} className="text-amber-600" />,
          bg: 'bg-amber-100',
          borderColor: 'border-amber-200'
        };
      }
      
      return {
        icon: <Calendar {...iconProps} className="text-indigo-600" />,
        bg: 'bg-indigo-100',
        borderColor: 'border-indigo-200'
      };
    }
    
    // Default for other types
    return {
      icon: <Bell {...iconProps} className="text-purple-600" />,
      bg: 'bg-purple-100',
      borderColor: 'border-purple-200'
    };
  };

  const { icon, bg, borderColor } = getIconAndBg();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={() => onClick(notif)}
      className={`p-5 rounded-xl border shadow-sm cursor-pointer transition-colors ${
        notif.isRead
          ? "bg-gray-50 border-gray-100"
          : `bg-white border ${borderColor}`
      } hover:shadow-md`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${bg}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900">{notif.title}</h3>
            <AnimatePresence>
              {!notif.isRead && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="inline-block w-2 h-2 bg-blue-600 rounded-full"
                ></motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-gray-700 mt-1 text-sm">{notif.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

NotificationItem.propTypes = {
  notif: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    isRead: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default NotificationsPage;