import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance";
import defaultProfile from "@/assets/default-profile.jpg";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { FaTh, FaBookmark, FaTags, FaThumbsUp } from "react-icons/fa";
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

  if (!profile) return <div className="text-red-500 text-center mt-10">Profile not found</div>;

  const isServiceProvider = profile.role === "service_provider";

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav onSearchToggle={() => setSearchVisible(!searchVisible)} />
      <div className="flex-1 bg-gradient-to-b from-white to-[#f5f5f5] ml-16 min-[850px]:ml-64 flex flex-col pt-16 min-h-screen overflow-y-auto">
      <TopNavbar />

        {/* Profile Header with right shift */}
        <div className="px-4 md:px-8">
          <div className="p-2 md:p-4">
            <div className="flex flex-col lg-custom:flex-row items-center gap-4 lg-custom:gap-20">
              <div className="w-20 h-20 lg-custom:w-40 lg-custom:h-40 rounded-full overflow-hidden border-2 lg-custom:border-4 border-white shadow-lg">
                <img src={profile.profilePicture || defaultProfile} alt="Profile" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 lg-custom:ml-4 text-center">
                <div className="flex flex-col lg-custom:flex-row items-center gap-2 lg-custom:gap-4 justify-center">
                  <h2 className="text-lg lg-custom:text-2xl font-bold text-[#010a4f] capitalize">{profile.username}</h2>
                  <span className="text-sm bg-[#f3e8ff] text-[#6b46c1] px-2 py-1 rounded-full">
                    {formatRoleName(profile.role)}
                  </span>
                  {!isOwnProfile && (
                    <div className="flex flex-row gap-2">
                      <Button
                        className={`bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]${
                          profile.isFollowing ? "bg-red-500" : "bg-[#062970]"
                        } hover:opacity-75`}
                        onClick={handleFollowToggle}
                        style={{ color: "#062970" }}
                      >
                        {profile.isFollowing
                          ? "Unfollow"
                          : profile.followsYou
                            ? "Follow Back"
                            : "Follow"}
                      </Button>

                      {isServiceProvider && (
                        <Button
                          className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                          onClick={() => navigate(`/book/${profile.username}`)}
                          style={{ color: "#062970" }}
                        >
                          Book Now
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-6 lg-custom:gap-10 mt-2 lg-custom:mt-4">
                  <div className="text-center">
                    <p className="font-bold text-[#010a4f] text-sm lg-custom:text-base">{profile.followersCount || 0}</p>
                    <p className="text-[#010a4f] text-xs lg-custom:text-sm">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#010a4f] text-sm lg-custom:text-base">{profile.followingCount || 0}</p>
                    <p className="text-[#010a4f] text-xs lg-custom:text-sm">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#010a4f] text-sm lg-custom:text-base">
                      {isServiceProvider ? profile.services?.length || 0 : profile.posts?.length || 0}
                    </p>
                    <p className="text-[#010a4f] text-xs lg-custom:text-sm">
                      {isServiceProvider ? "Services" : "Posts"}
                    </p>
                  </div>
                </div>

                <div className="mt-2 lg-custom:mt-4 text-center">
                  {isServiceProvider && (
                    <p className="font-semibold text-[#010a4f] text-sm lg-custom:text-base">
                      {profile.profession || "No profession listed"}
                    </p>
                  )}
                  <p className="text-[#010a4f] text-sm lg-custom:text-base line-clamp-2 lg-custom:line-clamp-none">{profile.biography || "No bio available"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Centered Tabs Section */}
        <div className="w-full border-t border-gray-300 mt-4">
          <div className="flex justify-center max-w-4xl mx-auto">
            {[
              { key: "posts", label: "Posts", icon: <FaTh /> },
              { key: "myWork", label: "My Work", icon: <FaTh /> },
              { key: "upvoted", label: "Upvoted", icon: <FaThumbsUp /> },
              { key: "services", label: "Services", icon: <FaBookmark /> },
              { key: "policies", label: "Policies", icon: <FaTags /> },
              ...(isOwnProfile && isServiceProvider
                ? [{ key: "availability", label: "Availability", icon: <Calendar /> }]
                : []),
            ]
              .filter((tab) => {
                if (!isOwnProfile && tab.key === "upvoted") return false;
                return (isServiceProvider && tab.key !== "posts") ||
                      (!isServiceProvider && tab.key === "posts") ||
                      tab.key === "upvoted";
              })
              .map((tab) => (
                <Button
                  key={tab.key}
                  variant="ghost"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-none border-t-2 px-3 lg-custom:px-6 py-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider !bg-transparent hover:!bg-[#023e8a] hover:!text-white
                    ${
                      activeTab === tab.key
                        ? "border-[#062970] bg-white"
                        : "border-transparent"
                    }`}
                  style={{
                    color: '#062970'
                  }}
                  title={tab.label}
                >
                  <span className="text-lg" style={{ color: '#062970' }}>{tab.icon}</span>
                  <span className="hidden lg-custom:inline">{tab.label}</span>
                </Button>
              ))}
          </div>
        </div>

        {/* Centered Tab Content */}
        <div className="py-4 px-4">
          {searchVisible && <SearchTab onClose={() => setSearchVisible(false)} />}
          
          {activeTab === "posts" && !isServiceProvider && (
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-lg text-[#010a4f]">Posts</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {profile.posts && profile.posts.length > 0 ? (
                  profile.posts.map((post, index) => (
                    <div key={index} className="w-full h-24 md:h-32 bg-gray-200 rounded-lg">
                      <img src={post.image} alt={`Post ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-3 text-center">No posts available</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "myWork" && isServiceProvider && (
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-lg text-[#010a4f]">My Work</h3>
              <WorkPostGrid isOwnProfile={isOwnProfile} />
            </div>
          )}
          
          {activeTab === "upvoted" && isOwnProfile && (
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-lg text-[#010a4f]">Upvoted Posts</h3>
              {console.log("Rendering upvoted posts section - user:", user?.username)}
              <WorkPostGrid showUpvoted={true} isOwnProfile={true} />
            </div>
          )}
          {activeTab === "services" && isServiceProvider && (
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-lg text-[#010a4f]">Services Offered</h3>
              {isOwnProfile && stripeStatus && (!stripeStatus.payoutsEnabled || !stripeStatus.detailsSubmitted) && (
                <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-4 mb-4 rounded-md">
                  <p className="font-semibold">🔔 Payout Setup Incomplete</p>
                  <p className="text-sm">
                    Stripe requires more information to enable payouts.{" "}
                    <span
                      className="text-blue-600 underline cursor-pointer"
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
                      Click here to resume onboarding
                    </span>{" "}
                    or check your email for instructions from Stripe.
                  </p>
                </div>
              )}

              {/* Onboarding Button (only show if it's their own profile and they haven't onboarded) */}
              {isOwnProfile && !profile.stripeAccountId && (
                <div className="mb-4">
                  <Button
                    className="bg-purple-600 text-white hover:bg-purple-700"
                    onClick={async () => {
                      try {
                        const { data } = await api.post("/payments/create-onboarding-link");
                        setTimeout(() => {
                          const link = document.createElement("a");
                          link.href = data.url;
                          link.target = "_self";
                          document.body.appendChild(link);
                          link.click();
                        }, 100);
                        
                      } catch (err) {
                        toast.error("Failed to start Stripe onboarding");
                        console.error(err);
                      }
                    }}
                  >
                    Set up Payouts
                  </Button>
                </div>
              )}

              <div className="mt-2">
                {profile.services && profile.services.length > 0 ? (
                  profile.services.map((service) => (
                    <div
                      key={service.id}
                      className="p-3 border rounded-lg bg-gray-50 mb-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-[#062970]">{service.name}</p>
                        <p className="text-gray-600">${service.price}</p>
                      </div>
                      <Button
                        className="bg-green-500 hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                        onClick={() => navigate(`/book/${profile.username}?service=${service.id}`)}
                        style={{ color: "#062970" }}
                      >
                        Book Now
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No services provided</p>
                )}
              </div>
            </div>
          )}
          {activeTab === "availability" && isServiceProvider && (
            <div className="max-w-7xl mx-auto">
              <h3 className="font-semibold text-lg text-[#010a4f] mb-2">My Availability</h3>
              <AvailabilityCalendar />
            </div>
          )}

          {activeTab === "policies" && isServiceProvider && (
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-lg text-[#010a4f]">My Policies</h3>
              <div className="p-3 mt-2 border rounded-lg bg-gray-50">
                {profile.policy ? (
                  <p className="text-gray-700">{profile.policy}</p>
                ) : (
                  <p className="text-gray-500">No policies listed</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
