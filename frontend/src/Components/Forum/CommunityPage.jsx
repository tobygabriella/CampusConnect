import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { Button } from "@/Components/ui/button";
import PostCard from "@/Components/forum/PostCard";
import CreatePostModal from "@/Components/Forum/CreatePostModal";
import CollegeFilter from "@/Components/Forum/CollegeFilter";
import { Loader2 } from "lucide-react";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import api from "@/utils/axiosInstance";
import { handleVote } from "@/utils/handleVote";
import { useUserColleges } from "@/hooks/useUserColleges";
import TagFilter from './TagFilter';

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
      console.log("Fetched tags from API:", res.data);
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
  console.log("Selected college:", collegeId);
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


  return (
    <div className="flex w-screen overflow-x-hidden">
      <SidebarNav />
      <div className="ml-64 min-h-screen bg-gradient-to-b from-[#f3e8ff] to-white flex flex-col flex-1 w-screen pt-16">
        <TopNavbar />
        <div className="max-w-4xl mx-auto p-4 w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
            <h2 className="text-base sm:text-lg font-semibold text-[#062970] leading-snug">
              {(collegeMap[selectedCollege] || collegeMap[user?.college])?.name || "Community"} Forum
            </h2>
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
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]]"
              disabled={!canPostToCurrentCollege()}
              title={
                !canPostToCurrentCollege()
                  ? "You can only post in communities you attend or service"
                  : ""
              }
            >
              New Post
            </Button>
          </div>

          {selectedCollege && !userPostableColleges.includes(selectedCollege) && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md">
              Viewing {(collegeMap[selectedCollege]?.name || "this")} community. You can only post in communities you attend or service.
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#062970]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {selectedCollege
                  ? `No posts yet in ${collegeMap[selectedCollege]?.name || "this"} community`
                  : "No posts yet in your community"}
              </p>
              {canPostToCurrentCollege() && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-[#062970] hover:bg-[#051f5c]"
                >
                  Create First Post
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostClick={() => navigate(`/community/posts/${post.id}`)}
                  onVote={(type) => onVote(type, post.id)}
                />
              ))}
            </div>
          )}

          {pagination.total > pagination.limit && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={pagination.page === i + 1 ? "default" : "outline"}
                  className={pagination.page === i + 1 ? "bg-[#062970]" : ""}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
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