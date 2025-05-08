import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/axiosInstance";
import WorkPostModal from "./WorkPostModal";

const WorkPostGrid = ({ isOwnProfile }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const endpoint = isOwnProfile ? "/work-posts/me" : `/work-posts/user/${username}`;
        const { data } = await api.get(endpoint);
        setPosts(data);
      } catch (error) {
        console.error("Failed to load work posts:", error);
      }
    };
    fetchPosts();
  }, [username, isOwnProfile]);

  if (posts.length === 0) {
    return <p className="text-gray-500 text-center">No work posts available</p>;
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

export default WorkPostGrid;
