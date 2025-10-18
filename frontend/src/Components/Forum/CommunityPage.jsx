import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import PostCard from "@/Components/forum/PostCard";
import CreatePostModal from "@/Components/Forum/CreatePostModal";
import CollegeFilter from "@/Components/Forum/CollegeFilter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, PlusCircle, BookOpen, MessageSquare, Info, ChevronLeft, ChevronRight } from "lucide-react";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import api from "@/utils/axiosInstance";
import { handleVote } from "@/utils/handleVote";
import { useUserColleges } from "@/hooks/useUserColleges";
import TagFilter from './TagFilter';
import Loading from "@/Components/Loading/LoadingState";
import ModernButton from "@/Components/UI/ModernButton";

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null); // this is collegeId
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 10 });
  const [userColleges, setUserColleges] = useState([]);
  const [availableColleges, setAvailableColleges] = useState([]);
  const [collegeMap, setCollegeMap] = useState({});
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null); 
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const userPostableColleges = useUserColleges(); // Only recompute when user changes

  const fetchTags = async () => {
    try {
      const res = await api.get("/forum/tags");
      setAvailableTags(res.data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };
  
  useEffect(() => {
    fetchTags();
  }, []);

const fetchPosts = async (page = 1, collegeId = null,  tag = selectedTag) => {
  setLoading(true);
  try {
    // Clear previous posts when switching colleges
    if (collegeId && collegeId !== selectedCollege) {
      setPosts([]);
    }

    const params = new URLSearchParams({
      page,
      limit: pagination.limit,
    });
    if (tag) params.append("tag", tag);
    // Always require a college ID
    const effectiveCollegeId = collegeId || selectedCollege || 
                             (user?.collegeId ? String(user.collegeId) : null) || 
                             (user?.collegesServed?.[0]?.id ? String(user.collegesServed[0].id) : null);
    
    if (!effectiveCollegeId) {
      throw new Error("No college specified");
    }

    params.append('college', effectiveCollegeId);

    const response = await api.get(`/forum/posts?${params.toString()}`);
    const { posts, total, currentPage, userColleges, availableColleges } = response.data;

    // Create college map for easy lookup
    const collegeMap = {};
    [...userColleges, ...availableColleges].forEach(college => {
      collegeMap[college.id] = college;
    });

    setPosts(posts);
    setPagination({
      page: currentPage,
      total,
      limit: pagination.limit
    });
    setUserColleges(userColleges);
    setAvailableColleges(availableColleges);
    setCollegeMap(collegeMap);
    
    // Update selected college if changed
    if (collegeId && collegeId !== selectedCollege) {
      setSelectedCollege(collegeId);
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    setPosts([]);
    setPagination(prev => ({ ...prev, total: 0 }));
  } finally {
    setLoading(false);
  }
};

const handleCollegeSelect = (collegeId) => {
  if (collegeId !== selectedCollege) {
    // Reset to page 1 when changing colleges
    fetchPosts(1, collegeId);
  }
};

  useEffect(() => {
        // Auto-select college when user data is available
        if (user) {
          let defaultCollegeId = null;
          
          // For regular students - use their college
          if (user.role !== 'service_provider' && user.collegeId) {
            defaultCollegeId = String(user.collegeId);
          } 
          // For service providers - use first college they service
          else if (user.role === 'service_provider' && user.collegesServed?.length > 0) {
            defaultCollegeId = String(user.collegesServed[0].id);
          }
          
          // Only set if we found a college and it's not already selected
          if (defaultCollegeId && !selectedCollege) {
            setSelectedCollege(defaultCollegeId);
          }
        }
        
        // Fetch posts with the selected college
        fetchPosts(1, selectedCollege || (user?.collegeId ? String(user.collegeId) : null));
      }, [user, user?.college, user?.collegesServed]);

  const handlePostCreated = (newPost) => {
    if (!selectedCollege || selectedCollege === user?.college) {
      setPosts([newPost, ...posts]);
    }
    setShowCreateModal(false);
  };

  const handlePageChange = (newPage) => {
    fetchPosts(newPage, selectedCollege);
  };

  const canPostToCurrentCollege = () => {
    if (!userPostableColleges.length) return false;
    
    const currentCollegeId = selectedCollege || 
                          user?.collegeId || 
                          user?.college?.id;
    
    if (!currentCollegeId) return false;
    
    return userPostableColleges.includes(String(currentCollegeId));
  };

  const onVote = async (type, postId) => {
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;

    const currentCounts = {
      upvotes: posts[postIndex]._count.upvotes,
      downvotes: posts[postIndex]._count.downvotes,
    };

    await handleVote({
      type,
      postId,
      currentCounts,
      setCounts: (updatedCounts) => {
        const updatedPosts = [...posts];
        updatedPosts[postIndex]._count = {
          ...updatedPosts[postIndex]._count, 
          ...updatedCounts, 
        };
        setPosts(updatedPosts);
      },
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav />
      <div className="flex-1 flex flex-col pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-y-auto ml-16 min-[850px]:ml-64">
        <TopNavbar />
        <div className="max-w-5xl mx-auto px-4 py-6 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {(collegeMap[selectedCollege] || collegeMap[user?.college])?.name || "Community"} Forum
                  </h2>
                  <p className="text-sm text-gray-500">Connect and share with your campus community</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <CollegeFilter
                  userCollegeId={user?.college?.id}
                  userColleges={userColleges}
                  availableColleges={availableColleges}
                  selectedCollegeId={selectedCollege}
                  onSelectCollege={handleCollegeSelect}
                />
                <TagFilter
                  selectedTag={selectedTag}
                  onSelectTag={(tag) => {
                    setSelectedTag(tag);
                    fetchPosts(1, selectedCollege, tag);
                  }}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              {/* Stats */}
              <div className="hidden md:flex gap-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{pagination.total || 0} posts</span>
                </div>
                {selectedTag && (
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      #{selectedTag}
                    </span>
                  </div>
                )}
              </div>
              
              <ModernButton
                variant="primary"
                size="sm"
                icon={<PlusCircle className="h-4 w-4" />}
                iconPosition="left"
                onClick={() => setShowCreateModal(true)}
                disabled={!canPostToCurrentCollege()}
                title={
                  !canPostToCurrentCollege()
                    ? "You can only post in communities you attend or service"
                    : ""
                }
              >
                New Post
              </ModernButton>
            </div>
          </motion.div>
          
          <AnimatePresence>
            {selectedCollege && !userPostableColleges.includes(selectedCollege) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-start gap-3 border border-blue-100"
              >
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p>Viewing {(collegeMap[selectedCollege]?.name || "this")} community. You can only post in communities you attend or service.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : posts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 px-4 text-center"
            >
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Posts Yet
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                {selectedCollege
                  ? `Be the first to post in the ${collegeMap[selectedCollege]?.name || "this"} community!`
                  : "No posts yet in your community. Start the conversation!"}
              </p>
              {canPostToCurrentCollege() && (
                <ModernButton
                  variant="primary"
                  size="md"
                  icon={<PlusCircle className="h-4 w-4" />}
                  iconPosition="left"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create First Post
                </ModernButton>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <PostCard
                    post={post}
                    onPostClick={() => navigate(`/community/posts/${post.id}`)}
                    onVote={(type) => onVote(type, post.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {pagination.total > pagination.limit && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mt-8 mb-4 items-center gap-2"
            >
              <ModernButton
                variant="ghost"
                size="sm"
                icon={<ChevronLeft className="h-4 w-4" />}
                iconPosition="left"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="!p-2"
              />
              
              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => {
                  // Show limited page numbers with ellipsis for better UX
                  const pageNum = i + 1;
                  const currentPage = pagination.page;
                  const totalPages = Math.ceil(pagination.total / pagination.limit);
                  
                  // Always show first, last, current, and pages around current
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <ModernButton
                        key={pageNum}
                        variant={pagination.page === pageNum ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 !p-0 ${pagination.page === pageNum ? 'font-semibold' : ''}`}
                      >
                        {pageNum}
                      </ModernButton>
                    );
                  }
                  
                  // Show ellipsis at logical breaks
                  if (pageNum === 2 && currentPage > 3) {
                    return <span key="ellipsis-start" className="w-8 text-center">...</span>;
                  }
                  
                  if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="ellipsis-end" className="w-8 text-center">...</span>;
                  }
                  
                  return null;
                })}
              </div>
              
              <ModernButton
                variant="ghost"
                size="sm"
                icon={<ChevronRight className="h-4 w-4" />}
                iconPosition="left"
                disabled={pagination.page === Math.ceil(pagination.total / pagination.limit)}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="!p-2"
              />
            </motion.div>
          )}
        <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
        userCollegeId={user?.collegeId}
        selectedCollegeId={selectedCollege}
        />
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;