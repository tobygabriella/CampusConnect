import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/axiosInstance";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import defaultProfile from "@/assets/default-profile.jpg";
import { Heart, MessageSquare, Calendar, ChevronLeft, ChevronRight, RefreshCcw, Layout, LayoutGrid } from "lucide-react";
import { formatRoleName } from "@/utils/formatters";
import WorkPostModal from "./WorkPostModal";
import { useAuth } from "@/Components/context/AuthContext";
import Loading from "@/Components/Loading/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import ModernButton from "@/Components/UI/ModernButton";

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

  // Add view mode state (grid or list)
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  
  if (loading) return <Loading />;
  
  return (
    <>
      <div className="flex w-screen min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-x-hidden">
        <SidebarNav />
        <div className="flex-1 flex flex-col pt-16 min-h-screen overflow-y-auto ml-16 min-[850px]:ml-64">
          <TopNavbar />
          
          {/* Header section */}
          <div className="px-4 md:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-2xl font-bold text-gray-900">Your Feed</h1>
                  <p className="text-gray-600">See the latest from people you follow</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <ModernButton
                    variant="outline"
                    size="sm"
                    icon={<RefreshCcw className="h-4 w-4" />}
                    iconPosition="left"
                    onClick={() => {
                      setLoading(true);
                      // Reload the posts
                      api.get("/work-posts/feed")
                        .then(({ data }) => {
                          setPosts(data);
                          const likedIds = new Set();
                          data.forEach(post => {
                            if (post.upvotes?.some(v => v.userId === user.id)) {
                              likedIds.add(post.id);
                            }
                          });
                          setLikedPostIds(likedIds);
                        })
                        .catch(err => console.error("Failed to refresh feed:", err))
                        .finally(() => setLoading(false));
                    }}
                  >
                    Refresh
                  </ModernButton>
                  
                  <div className="bg-gray-100 rounded-lg p-1 flex items-center">
                    <button 
                      onClick={() => setViewMode('list')} 
                      className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      title="List view"
                    >
                      <Layout className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')} 
                      className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      title="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content section */}
          <div className="px-4 md:px-8 pb-10">
            <div className={`max-w-4xl mx-auto ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}`}>
            {posts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 px-4 text-center"
              >
                <div className="bg-blue-50 p-5 rounded-full mb-4">
                  <RefreshCcw className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Your Feed is Empty
                </h3>
                <p className="text-gray-500 max-w-md mb-6">
                  No posts available in your feed yet. Follow more service providers to see their work here.
                </p>
              </motion.div>
            ) : (
              posts.map((post, index) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
                >
                  {/* Author header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-50">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/profile/${post.author.username}`)}
                    >
                      <motion.img
                        whileHover={{ scale: 1.05 }}
                        src={post.author.profilePicture || defaultProfile}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{post.author.username}</p>
                        {post.author.role === "service_provider" && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {formatRoleName(post.author.role)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
  
                  {/* Image */}
                  {post.images && post.images.length > 0 && (
                    <div className="relative w-full aspect-square flex justify-center items-center overflow-hidden bg-gray-50">
                      {post.images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between px-2 z-10">
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`${(imageIndexes[post.id] || 0) === 0 ? 'invisible' : ''}`}
                          >
                            <ModernButton
                              variant="white"
                              size="sm"
                              className="rounded-full shadow-md !p-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                prevImage(post.id, post.images.length);
                              }}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </ModernButton>
                          </motion.div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`${(imageIndexes[post.id] || 0) === post.images.length - 1 ? 'invisible' : ''}`}
                          >
                            <ModernButton
                              variant="white"
                              size="sm"
                              className="rounded-full shadow-md !p-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                nextImage(post.id, post.images.length);
                              }}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </ModernButton>
                          </motion.div>
                        </div>
                      )}

                      <img
                        src={post.images[imageIndexes[post.id] || 0]}
                        alt="Work Post"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedPostId(post.id)}
                      />

                      {post.images.length > 1 && (
                        <div className="absolute bottom-4 text-white text-xs bg-black/60 rounded-full px-2.5 py-1.5 font-medium">
                          {(imageIndexes[post.id] || 0) + 1} / {post.images.length}
                        </div>
                      )}
                    </div>
                  )}
  
                  {/* Action Buttons */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        className="!p-2"
                        onClick={() => toggleLike(post.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          <Heart
                            className={`h-5 w-5 ${likedPostIds.has(post.id) ? 'text-red-500 fill-red-500' : 'text-gray-700'}`}
                            strokeWidth={likedPostIds.has(post.id) ? "0" : "1.5"}
                          />
                          <span className="text-sm font-medium">{post._count?.upvotes || 0}</span>
                        </div>
                      </ModernButton>

                      <ModernButton
                        variant="ghost"
                        size="sm"
                        className="!p-2"
                        onClick={() => setSelectedPostId(post.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-5 w-5 text-gray-700" />
                          <span className="text-sm font-medium">{post._count?.comments || 0}</span>
                        </div>
                      </ModernButton>
                    </div>
  
                    {(post.service || post.appointment?.service) && (
                      <ModernButton
                        variant="primary"
                        size="sm"
                        icon={<Calendar className="h-4 w-4" />}
                        iconPosition="left"
                        onClick={() =>
                          navigate(
                            `/book/${post.author.username}?service=${
                              post.service?.id || post.appointment?.service?.id
                            }`
                          )
                        }
                      >
                        Book Now
                      </ModernButton>
                    )}
                  </div>
                  
                  {/* Service info */}
                  {(post.service || post.appointment?.service) && (
                    <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-full">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {(post.service || post.appointment?.service)?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Caption */}
                  <div className="px-4 py-3">
                    <p className="text-gray-700 text-sm">{post.caption}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Post Modal */}
    <AnimatePresence>
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
      </AnimatePresence>
    </>
  );  
};

export default HomeFeedPage;