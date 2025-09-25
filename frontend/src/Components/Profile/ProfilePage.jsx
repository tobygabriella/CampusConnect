import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance";
import defaultProfile from "@/assets/default-profile.jpg";
import ModernButton from "@/Components/UI/ModernButton";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Grid, Bookmark, Tag, ThumbsUp, MapPin, Clock, User, UserPlus, UserMinus, ExternalLink, Camera, Star, Settings } from "lucide-react";
import SearchTab from "@/Components/Navigation/SearchTab";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import AvailabilityCalendar from "@/Components/Profile/AvailabilityCalendar";
import WorkPostGrid from "../WorkPost/WorkPostGrid";
import Loading from "@/Components/Loading/LoadingState";
import { formatRoleName } from "@/utils/formatters";

const ProfilePage = () => {
  const { user } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [searchVisible, setSearchVisible] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);

  const isOwnProfile = user?.username === username || !username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileUsername = username || user.username;
        const response = await api.get(`/users/profile/${profileUsername}`, { withCredentials: true });
        setProfile(response.data);
        if (
          response.data?.role === "service_provider" &&
          response.data?.stripeAccountId &&
          isOwnProfile
        ) {
          try {
            const { data } = await api.get("/payments/check-onboarding-status");
            setStripeStatus(data);
          } catch (error) {
            console.warn("Failed to fetch Stripe onboarding status:", error);
          }
        }
      } catch {
        toast.error("Error loading profile.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, username]);

  const handleFollowToggle = async () => {
    try {
      if (profile.isFollowing) {
        await api.post(`/users/unfollow/${profile.id}`);

        setProfile((prev) => ({
          ...prev,
          isFollowing: false,
          followersCount: prev.followersCount - 1,
        }));
      } else {
        await api.post(`/users/follow/${profile.id}`);

        setProfile((prev) => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1,
        }));
      }

      const response = await api.get(`/users/profile/${username || user.username}`, { withCredentials: true });
      setProfile(response.data);
    } catch (error) {
      console.error("Follow error:", error);
      toast.error("Failed to update follow status.");
    }
  };

  if (loading) return <Loading />;

  if (!profile) return <div className="flex items-center justify-center h-screen text-red-600 font-medium">Profile not found</div>;

  const isServiceProvider = profile.role === "service_provider";

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav onSearchToggle={() => setSearchVisible(!searchVisible)} />
      <div className="flex-1 bg-gradient-to-b from-gray-50 to-white ml-16 min-[850px]:ml-64 flex flex-col pt-16 min-h-screen overflow-y-auto">
      <TopNavbar />

        {/* Profile Header */}
        <div className="px-4 md:px-8 pt-6 pb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Profile Image with Animation */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="relative"
              >
                <div className="w-28 h-28 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                  <img 
                    src={profile.profilePicture || defaultProfile} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg"
                    title="Change profile picture"
                  >
                    <Camera className="h-5 w-5" />
                  </motion.button>
                )}
              </motion.div>

              {/* User Info */}
              <div className="flex-1 space-y-4 w-full text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
                      <h2 className="text-2xl font-bold text-gray-900">{profile.username}</h2>
                      
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                        <User className="h-3.5 w-3.5" />
                        {formatRoleName(profile.role)}
                      </div>
                    </div>
                    
                    {isServiceProvider && (
                      <div className="flex items-center gap-1.5 text-gray-600 text-sm justify-center lg:justify-start">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{profile.profession || "Professional"}</span>
                        
                        {profile.rating && (
                          <div className="flex items-center ml-2">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span className="ml-1 font-medium">{profile.rating}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!isOwnProfile ? (
                      <>
                        <ModernButton
                          variant={profile.isFollowing ? "outline" : "primary"}
                          size="sm"
                          icon={profile.isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          iconPosition="left"
                          onClick={handleFollowToggle}
                        >
                          {profile.isFollowing
                            ? "Unfollow"
                            : profile.followsYou
                              ? "Follow Back"
                              : "Follow"}
                        </ModernButton>
                        
                        {isServiceProvider && (
                          <ModernButton
                            variant="primary"
                            size="sm"
                            icon={<Calendar className="h-4 w-4" />}
                            iconPosition="left"
                            onClick={() => navigate(`/book/${profile.username}`)}
                          >
                            Book Now
                          </ModernButton>
                        )}
                      </>
                    ) : (
                      <ModernButton
                        variant="outline"
                        size="sm"
                        icon={<Settings className="h-4 w-4" />}
                        iconPosition="left"
                        onClick={() => navigate('/edit-profile')}
                      >
                        Edit Profile
                      </ModernButton>
                    )}
                  </div>
                </div>
                
                <div className="text-gray-700 max-w-2xl">
                  {profile.biography ? (
                    <p className="text-sm lg:text-base">{profile.biography}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No bio available</p>
                  )}
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <motion.div 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100"
                  >
                    <p className="font-bold text-blue-600 text-xl">{profile.followersCount || 0}</p>
                    <p className="text-gray-600 text-sm">Followers</p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100"
                  >
                    <p className="font-bold text-blue-600 text-xl">{profile.followingCount || 0}</p>
                    <p className="text-gray-600 text-sm">Following</p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100"
                  >
                    <p className="font-bold text-blue-600 text-xl">
                      {isServiceProvider ? profile.services?.length || 0 : profile.posts?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {isServiceProvider ? "Services" : "Posts"}
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="px-4 md:px-8 mb-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide">
              {[
                { key: "posts", label: "Posts", icon: <Grid className="h-4 w-4" /> },
                { key: "myWork", label: "My Work", icon: <Camera className="h-4 w-4" /> },
                { key: "upvoted", label: "Upvoted", icon: <ThumbsUp className="h-4 w-4" /> },
                { key: "services", label: "Services", icon: <Bookmark className="h-4 w-4" /> },
                { key: "policies", label: "Policies", icon: <Tag className="h-4 w-4" /> },
                ...(isOwnProfile && isServiceProvider
                  ? [{ key: "availability", label: "Availability", icon: <Calendar className="h-4 w-4" /> }]
                  : []),
              ]
                .filter((tab) => {
                  if (!isOwnProfile && tab.key === "upvoted") return false;
                  return (isServiceProvider && tab.key !== "posts") ||
                        (!isServiceProvider && tab.key === "posts") ||
                        tab.key === "upvoted";
                })
                .map((tab) => (
                  <motion.button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 py-4 px-6 font-medium text-sm relative whitespace-nowrap
                      ${
                        activeTab === tab.key
                          ? "text-blue-600"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tab.icon}
                    {tab.label}
                    {activeTab === tab.key && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.button>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <div className="px-4 md:px-8 pb-8">
          {searchVisible && <SearchTab onClose={() => setSearchVisible(false)} />}
          
          {activeTab === "posts" && !isServiceProvider && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">Posts</h3>
                {isOwnProfile && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={<Camera className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    New Post
                  </ModernButton>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.posts && profile.posts.length > 0 ? (
                    profile.posts.map((post, index) => (
                      <motion.div 
                        key={index} 
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img 
                          src={post.image} 
                          alt={`Post ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-3 py-10 flex flex-col items-center justify-center text-center">
                      <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-2">No posts available</p>
                      {isOwnProfile && (
                        <ModernButton
                          variant="outline"
                          size="sm"
                          icon={<Camera className="h-4 w-4" />}
                          iconPosition="left"
                        >
                          Create Your First Post
                        </ModernButton>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "myWork" && isServiceProvider && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">My Work</h3>
                {isOwnProfile && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={<Camera className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    Add Work
                  </ModernButton>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <WorkPostGrid isOwnProfile={isOwnProfile} />
              </div>
            </motion.div>
          )}
          
          {activeTab === "upvoted" && isOwnProfile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">Upvoted Posts</h3>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <WorkPostGrid showUpvoted={true} isOwnProfile={true} />
              </div>
            </motion.div>
          )}
          {activeTab === "services" && isServiceProvider && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">Services Offered</h3>
                {isOwnProfile && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={<Bookmark className="h-4 w-4" />}
                    iconPosition="left"
                    onClick={() => navigate('/add-service')}
                  >
                    Add Service
                  </ModernButton>
                )}
              </div>
              
              {/* Stripe Payment Setup Alert */}
              <AnimatePresence>
                {isOwnProfile && stripeStatus && (!stripeStatus.payoutsEnabled || !stripeStatus.detailsSubmitted) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3"
                  >
                    <div className="p-2 bg-blue-100 rounded-full">
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Complete Your Payout Setup</p>
                      <p className="text-sm text-blue-700 mt-1 mb-2">
                        Stripe requires more information to enable payments for your services.
                      </p>
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { data } = await api.post("/payments/create-onboarding-link");
                            window.location.href = data.url;
                          } catch (err) {
                            toast.error("Could not resume onboarding");
                            console.error(err);
                          }
                        }}
                      >
                        Complete Setup
                      </ModernButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Onboarding Button */}
              {isOwnProfile && !profile.stripeAccountId && (
                <div className="mb-4">
                  <ModernButton
                    variant="primary"
                    size="md"
                    icon={<ExternalLink className="h-4 w-4" />}
                    iconPosition="left"
                    onClick={async () => {
                      try {
                        const { data } = await api.post("/payments/create-onboarding-link");
                        window.location.href = data.url;
                      } catch (err) {
                        toast.error("Failed to start Stripe onboarding");
                        console.error(err);
                      }
                    }}
                  >
                    Set up Payouts
                  </ModernButton>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {profile.services && profile.services.length > 0 ? (
                  <div className="space-y-3">
                    {profile.services.map((service) => (
                      <motion.div
                        key={service.id}
                        className="p-4 border border-gray-100 rounded-xl bg-white hover:border-blue-200 hover:bg-blue-50 transition-colors"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{service.name}</h4>
                            <div className="mt-1 flex items-center gap-3">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{service.duration / 60} hrs</span>
                              </div>
                              <p className="font-medium text-blue-600">${service.price}</p>
                            </div>
                            {service.description && (
                              <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                            )}
                          </div>
                          
                          {!isOwnProfile && (
                            <ModernButton
                              variant="primary"
                              size="sm"
                              icon={<Calendar className="h-4 w-4" />}
                              iconPosition="left"
                              onClick={() => navigate(`/book/${profile.username}?service=${service.id}`)}
                            >
                              Book Now
                            </ModernButton>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                      <Bookmark className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">No services available yet</p>
                    {isOwnProfile && (
                      <ModernButton
                        variant="outline"
                        size="sm"
                        icon={<Bookmark className="h-4 w-4" />}
                        iconPosition="left"
                        onClick={() => navigate('/add-service')}
                      >
                        Add Your First Service
                      </ModernButton>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === "availability" && isServiceProvider && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">My Availability</h3>
                {isOwnProfile && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={<Calendar className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    Manage Schedule
                  </ModernButton>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <AvailabilityCalendar />
              </div>
            </motion.div>
          )}

          {activeTab === "policies" && isServiceProvider && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">My Policies</h3>
                {isOwnProfile && (
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={<Tag className="h-4 w-4" />}
                    iconPosition="left"
                    onClick={() => navigate('/edit-policies')}
                  >
                    Edit Policies
                  </ModernButton>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {profile.policy ? (
                  <div className="prose max-w-none text-gray-700">
                    <p>{profile.policy}</p>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                      <Tag className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">No policies listed yet</p>
                    {isOwnProfile && (
                      <ModernButton
                        variant="outline"
                        size="sm"
                        icon={<Tag className="h-4 w-4" />}
                        iconPosition="left"
                        onClick={() => navigate('/edit-policies')}
                      >
                        Add Policies
                      </ModernButton>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
