import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PropTypes from 'prop-types';
import api from "@/utils/axiosInstance";
import WorkPostModal from "./WorkPostModal";
import Loading from "@/Components/Loading/LoadingState";

const WorkPostGrid = ({ isOwnProfile, showUpvoted = false }) => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        let endpoint;
        try {
          // Log the current user context
          console.log("Current props:", { showUpvoted, isOwnProfile, username });
          
          if (showUpvoted) {
            endpoint = "/work-posts/upvoted";
            console.log("Fetching upvoted posts from:", endpoint);
            
            // Check auth state from cookies/localStorage if available
            const token = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)?.[1] || localStorage.getItem('token');
            console.log("Auth token available:", !!token);
            
            // Make the request with explicit credentials flag
            const response = await api.get(endpoint, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log("Upvoted posts response status:", response.status);
            console.log("Upvoted posts data count:", response?.data?.length || 0);
            console.log("First post sample:", response?.data?.[0] ? JSON.stringify(response.data[0].id) : "No posts");
            
            const { data } = response;
            setPosts(data);
          } else {
            endpoint = isOwnProfile ? "/work-posts/me" : `/work-posts/user/${username}`;
            console.log("Fetching posts from:", endpoint);
            const { data } = await api.get(endpoint);
            setPosts(data);
          }
        } catch (error) {
          console.error(`Failed to load work posts from ${endpoint}:`, error);
          if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            console.error("Response headers:", error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received:", error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error setting up request:", error.message);
          }
          // Don't throw here, handle gracefully instead
          setPosts([]);
        }
      } catch (error) {
        console.error("Failed to load work posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [username, isOwnProfile, showUpvoted]);

  if (loading) return <Loading />;
  
  if (posts.length === 0) {
    return (
      <p className="text-gray-500 text-center">
        {showUpvoted ? "You haven't upvoted any posts yet" : "No work posts available"}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        {posts.map((post) => (
            <div
            key={post.id}
            className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setSelectedPostId(post.id)}
            >
            <img
                src={post.images?.[0]}
                alt="Work Post"
                className="w-full h-full object-cover"
            />
            </div>
        ))}
      </div>
      {selectedPostId && (
        <WorkPostModal
        postId={selectedPostId}
        posts={posts}
        initialIndex={posts.findIndex(p => p.id === selectedPostId)}
        onClose={() => setSelectedPostId(null)}
      />      
      )}
    </>
  );
};

WorkPostGrid.propTypes = {
  isOwnProfile: PropTypes.bool,
  showUpvoted: PropTypes.bool
};

export default WorkPostGrid;
