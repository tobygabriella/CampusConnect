import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/axiosInstance";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import defaultProfile from "@/assets/default-profile.jpg";
import { Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkPostModal from "./WorkPostModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/Components/context/AuthContext";
import Loading from "@/Components/Loading/LoadingState";

const HomeFeedPage = () => {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [imageIndexes, setImageIndexes] = useState({});
  const { user } = useAuth(); 
  const [loading, setLoading] = useState(true);

  const nextImage = (postId, totalImages) => {
    setImageIndexes((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % totalImages,
    }));
  };
  
  const prevImage = (postId, totalImages) => {
    setImageIndexes((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) === 0
        ? totalImages - 1
        : (prev[postId] || 0) - 1,
    }));
  };  

  const toggleLike = async (postId) => {
    try {
      const { data } = await api.post(`/work-posts/${postId}/upvote`);
      const liked = data.liked;
  
      // Update likedPostIds
      setLikedPostIds((prev) => {
        const newSet = new Set(prev);
        liked ? newSet.add(postId) : newSet.delete(postId);
        return newSet;
      });
  
      // Update the specific post's upvote count
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                _count: {
                  ...post._count,
                  upvotes: liked
                    ? (post._count?.upvotes || 0) + 1
                    : Math.max((post._count?.upvotes || 1) - 1, 0),
                },
              }
            : post
        )
      );
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  // const handleCommentAdded = (postId, newComment) => {
  //   setPosts(prevPosts =>
  //     prevPosts.map(post =>
  //       post.id === postId
  //         ? {
  //             ...post,
  //             comments: [...(post.comments || []), newComment],
  //             _count: {
  //               ...post._count,
  //               comments: (post._count?.comments || 0) + 1,
  //             },
  //           }
  //         : post
  //     )
  //   );
  // };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/work-posts/feed");
        setPosts(data);
        const likedIds = new Set();
        data.forEach(post => {
          if (post.upvotes?.some(v => v.userId === user.id)) {
            likedIds.add(post.id);
          }
        });
        setLikedPostIds(likedIds);
      } catch (err) {
        console.error("Failed to fetch home feed posts:", err);
      }
      finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      fetchFeed();
    }
  }, [user?.id]);  

  if (loading) return <Loading />;
  
  return (
    <>
      <div className="flex w-screen min-h-screen bg-gradient-to-b from-white to-[#f5f5f5] overflow-x-hidden">
        <SidebarNav />
        <div className="flex-1 flex flex-col pt-16 min-h-screen overflow-y-auto ml-16 min-[850px]:ml-64">
          <TopNavbar />
          <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
            {posts.length === 0 ? (
              <p className="text-center text-gray-500">No posts available in your feed yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                  {/* Author header */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${post.author.username}`)}
                  >
                    <img
                      src={post.author.profilePicture || defaultProfile}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <p className="text-[#062970] font-semibold">{post.author.username}</p>
                  </div>
  
                  {/* Image */}
                  {post.images && post.images.length > 0 && (
                    <div className="relative w-full max-h-[600px] flex justify-center items-center">
                      {post.images.length > 1 && (imageIndexes[post.id] || 0) > 0 && (
                        <Button
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                          onClick={() => prevImage(post.id, post.images.length)}
                        >
                          <ChevronLeft className="w-5 h-5 text-[#062970]" />
                        </Button>
                      )}
                      {post.images.length > 1 && (imageIndexes[post.id] || 0) < post.images.length - 1 && (
                        <Button
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                          onClick={() => nextImage(post.id, post.images.length)}
                        >
                          <ChevronRight className="w-5 h-5 text-[#062970]" />
                        </Button>
                      )}

                      <img
                        src={post.images[imageIndexes[post.id] || 0]}
                        alt="Work Post"
                        className="w-full h-auto max-h-[600px] object-cover"
                      />

                      {post.images.length > 1 && (
                        <div className="absolute bottom-4 text-white text-xs bg-black/60 rounded-full px-2 py-1">
                          {(imageIndexes[post.id] || 0) + 1} / {post.images.length}
                        </div>
                      )}
                    </div>
                  )}
  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLike(post.id)}
                      className="hover:bg-[#f3e8ff] !bg-transparent hover:!bg-[#f3e8ff] text-[#062970]"
                    >
                      <Heart
                        className="w-5 h-5"
                        fill={likedPostIds.has(post.id) ? "#062970" : "none"}
                        stroke="#062970"
                        strokeWidth={likedPostIds.has(post.id) ? "0" : "1.5"} // Remove stroke when filled
                      />
                      <span className="text-sm ml-1 text-[#062970]">{post._count?.upvotes || 0}</span>
                    </Button>
  
                      <Button
                        className="text-gray-600 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                        onClick={() => setSelectedPostId(post.id)}
                      >
                        <MessageSquare className="w-5 h-5 text-[#062970]" />
                        <span className="text-sm ml-1 text-[#062970]">{post._count?.comments || 0}</span>
                      </Button>
                    </div>
  
                    {(post.service || post.appointment?.service) && (
                      <div className="px-4 py-2 bg-gray-50 border-t text-sm flex flex-col md:flex-row md:justify-between md:items-center gap-1">
                        <div className="text-[#062970]">
                          <p className="font-semibold">
                            {(post.service || post.appointment?.service)?.name}
                          </p>
                        </div>
  
                        {post.author?.username && (
                          <Button
                            className="bg-green-500 hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                            style={{ color: "#062970" }}
                            onClick={() =>
                              navigate(
                                `/book/${post.author.username}?service=${
                                  post.service?.id || post.appointment?.service?.id
                                }`
                              )
                            }
                          >
                            Book Now
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
  
                  {/* Caption */}
                  <div className="px-4 pb-3">
                    <p className="text-sm text-[#062970]">{post.caption}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  
      {selectedPostId && (
       <WorkPostModal
          postId={selectedPostId}
          posts={posts}
          post={posts.find(p => p.id === selectedPostId)} 
          initialIndex={posts.findIndex((p) => p.id === selectedPostId)}
          onClose={() => setSelectedPostId(null)}
          disablePostNavigation={true}
          onPostUpdate={(updatedPost) => {
            setPosts((prevPosts) =>
              prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
            );
          
            setLikedPostIds((prev) => {
              const newSet = new Set(prev);
              if (updatedPost.isUpvotedByCurrentUser) {
                newSet.add(updatedPost.id);
              } else {
                newSet.delete(updatedPost.id);
              }
              return newSet;
            });
          }}          
        />     
      )}
    </>
  );  
};

export default HomeFeedPage;