import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, Mail, Bell } from "lucide-react";
import api from "@/utils/axiosInstance";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import WorkPostModal from "@/Components/WorkPost/WorkPostModal";
import { Tabs } from "antd";
import Loading from "@/Components/Loading/LoadingState";

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
            <div className="text-center py-8 text-gray-400">
              <Mail size={48} className="mx-auto mb-4" />
              <p>No unread notifications</p>
            </div>
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
            <div className="text-center py-8 text-gray-400">
              <Mail size={48} className="mx-auto mb-4" />
              <p>No read notifications</p>
            </div>
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
        <div className="ml-64 min-h-screen w-full bg-gradient-to-b from-[#f3e8ff] to-white flex flex-col pt-16">
          <TopNavbar />
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#062970] mb-6">Notifications</h2>
              <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-[#062970] text-white rounded hover:bg-[#051d5c]"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav />
      <div className="ml-64 min-h-screen w-full bg-gradient-to-b from-[#f3e8ff] to-white flex flex-col pt-16">
        <TopNavbar />
        
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#062970]">Notifications</h2>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-[#6b46c1] hover:underline flex items-center gap-1"
                >
                  <Bell size={16} />
                  <span>Mark all as read</span>
                </button>
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
              className="custom-tabs"
            />
          </div>
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
    {notifications.map((notif) => (
      <NotificationItem 
        key={notif.id} 
        notif={notif} 
        onClick={onClick}
      />
    ))}
  </div>
);

const NotificationItem = ({ notif, onClick }) => {
  const iconProps = {
    className: "w-5 h-5",
    fill: notif.type === 'like' ? "currentColor" : "none"
  };

  return (
    <div
      onClick={() => onClick(notif)}
      className={`p-6 rounded-lg border shadow-sm cursor-pointer transition-all ${
        notif.isRead
          ? "bg-gray-50 opacity-90"
          : "bg-white border-l-4 border-[#6b46c1]"
      } hover:shadow-md`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${
          notif.type === 'comment' ? 'bg-blue-100' : 'bg-red-100'
        }`}>
          {notif.type === 'comment' ? (
            <MessageSquare {...iconProps} className="text-blue-600" />
          ) : (
            <Heart {...iconProps} className="text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-[#062970]">{notif.title}</h3>
            {!notif.isRead && (
              <span className="inline-block w-2 h-2 bg-[#6b46c1] rounded-full"></span>
            )}
          </div>
          <p className="text-gray-700 mt-1">{notif.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;