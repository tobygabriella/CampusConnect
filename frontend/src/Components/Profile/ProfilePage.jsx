import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { toast } from "react-toastify";
import api from "@/utils/axiosInstance";
import defaultProfile from "@/assets/default-profile.jpg";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { FaTh, FaBookmark, FaTags } from "react-icons/fa";
import SearchTab from "@/Components/Navigation/SearchTab";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import AvailabilityCalendar from "@/Components/Profile/AvailabilityCalendar";

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
      } catch (error) {
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

  if (loading) return <div className="text-white text-center mt-10">Loading profile...</div>;

  if (!profile) return <div className="text-red-500 text-center mt-10">Profile not found</div>;

  const isServiceProvider = profile.role === "service_provider";

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav onSearchToggle={() => setSearchVisible(!searchVisible)} />
      <div className="ml-64 min-h-screen bg-gradient-to-b from-[#f3e8ff] to-white flex flex-col flex-1 w-screen pt-16">
        <TopNavbar />

        {/* Profile Header with right shift */}
        <div className="px-8">
          <div className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-20">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src={profile.profilePicture || defaultProfile} alt="Profile" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 ml-4">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                  <h2 className="text-2xl font-bold text-[#062970] capitalize">{profile.username}</h2>
                  {!isOwnProfile && (
                    <>
                      <Button
                        className={`${
                          profile.isFollowing ? "bg-red-500" : "bg-[#062970]"
                        } text-white hover:opacity-75`}
                        onClick={handleFollowToggle}
                      >
                        {profile.isFollowing
                          ? "Unfollow"
                          : profile.followsYou
                            ? "Follow Back"
                            : "Follow"}
                      </Button>

                      {isServiceProvider && (
                        <Button
                          className="bg-green-500 text-white hover:bg-green-600 ml-2"
                          onClick={() => navigate(`/book/${profile.username}`)}
                        >
                          Book Now
                        </Button>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-10 mt-4">
                  <div className="text-center">
                    <p className="font-bold text-[#062970]">{profile.followersCount || 0}</p>
                    <p className="text-gray-600 text-sm">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#062970]">{profile.followingCount || 0}</p>
                    <p className="text-gray-600 text-sm">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#062970]">
                      {isServiceProvider ? profile.services?.length || 0 : profile.posts?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {isServiceProvider ? "Services" : "Posts"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {isServiceProvider && (
                    <p className="font-semibold text-[#062970]">
                      {profile.profession || "No profession listed"}
                    </p>
                  )}
                  <p className="text-gray-600">{profile.biography || "No bio available"}</p>
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
              { key: "services", label: "Services", icon: <FaBookmark /> },
              { key: "policies", label: "Policies", icon: <FaTags /> },
              ...(isOwnProfile && isServiceProvider
                ? [{ key: "availability", label: "Availability", icon: <Calendar /> }]
                : []),
            ]
              .filter((tab) =>
                (isServiceProvider && tab.key !== "posts") ||
                (!isServiceProvider && tab.key === "posts")
              )
              .map((tab) => (
                <Button
                  key={tab.key}
                  variant="ghost"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-none border-t-2 px-6 py-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider !bg-transparent hover:!bg-[#f3e8ff] 
                    ${
                      activeTab === tab.key
                        ? "border-black text-[#062970]"
                        : "border-transparent text-[#062970] hover:bg-[#f3e8ff] hover:text-[#6b46c1]"
                    }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </Button>
              ))}
          </div>
        </div>

        {/* Centered Tab Content */}
        <div className="py-4 px-4">
          {searchVisible && <SearchTab onClose={() => setSearchVisible(false)} />}
          
          {activeTab === "posts" && !isServiceProvider && (
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-lg text-[#062970]">Posts</h3>
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
              <h3 className="font-semibold text-lg text-[#062970]">My Work</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {profile.workImages && profile.workImages.length > 0 ? (
                  profile.workImages.map((image, index) => (
                    <div key={index} className="w-full h-24 md:h-32 bg-gray-200 rounded-lg">
                      <img src={image} alt={`Work ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-3 text-center">No work images available</p>
                )}
              </div>
            </div>
          )}
          {activeTab === "services" && isServiceProvider && (
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-lg text-[#062970]">Services Offered</h3>
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
                        className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                        onClick={() => navigate(`/book/${profile.username}?service=${service.id}`)}
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
              <h3 className="font-semibold text-lg text-[#062970] mb-2">My Availability</h3>
              <AvailabilityCalendar />
            </div>
          )}

          {activeTab === "policies" && isServiceProvider && (
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold text-lg text-[#062970]">My Policies</h3>
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