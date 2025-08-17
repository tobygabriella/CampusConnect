import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import CommentCard from "@/Components/Forum/CommentCard";
import api from "@/utils/axiosInstance";
import { useAuth } from "@/Components/context/AuthContext";
import { Button } from "@/components/ui/button";
import defaultProfile from "@/assets/default-profile.jpg";
import { Heart, MessageSquare } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "@/Components/Loading/LoadingState";

const WorkPostModal = ({ postId, post: initialPost, posts = [], initialIndex = 0, onClose, onPostUpdate, disablePostNavigation = false, highlightedCommentId }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(initialPost || null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const currentPostId = posts.length > 0 ? posts[currentIndex]?.id : postId;
  const [commentInput, setCommentInput] = useState("");
  const { user } = useAuth(); 
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentRefs = useRef({});
  const navigate = useNavigate();

  const updatePostState = (newPost) => {
    setPost(newPost);
    if (onPostUpdate) onPostUpdate(newPost); 
  };
  
  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
    }
  }, [initialPost]);
  
  useEffect(() => {
    if (highlightedCommentId && commentRefs.current[highlightedCommentId]) {
      const el = commentRefs.current[highlightedCommentId];
      el.scrollIntoView({ behavior: "smooth", block: "center" });
  
      // Temporarily add highlight class
      el.classList.add("ring-2", "ring-[#6b46c1]", "rounded-md", "bg-[#f3e8ff]");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-[#6b46c1]", "bg-[#f3e8ff]");
      }, 2000);      
    }
  }, [post, highlightedCommentId]);
  

  const handleCommentUpvote = async (commentId) => {
    try {
      const res = await api.post(`/work-posts/comments/${commentId}/upvote`);
      const liked = res.data.liked;
  
      updatePostState({
        ...post,
        comments: post.comments.map((c) => {
          if (c.id !== commentId) return c;
      
          const wasUpvoted = c.isUpvotedByCurrentUser;
          const wasDownvoted = c.isDownvotedByCurrentUser;
      
          let newUpvotes = c._count?.upvotes || 0;
          let newDownvotes = c._count?.downvotes || 0;
      
          if (liked) {
            newUpvotes += 1;
            if (wasDownvoted) newDownvotes -= 1;
          } else {
            newUpvotes -= 1;
          }
      
          return {
            ...c,
            isUpvotedByCurrentUser: liked,
            isDownvotedByCurrentUser: false,
            _count: { ...c._count, upvotes: newUpvotes, downvotes: newDownvotes },
          };
        }),
      });      
    } catch (err) {
      console.error("Failed to toggle comment like", err);
    }
  };
  
  const handleCommentDownvote = async (commentId) => {
    try {
      const res = await api.post(`/work-posts/comments/${commentId}/downvote`);
      const downvoted = res.data.downvoted;
  
      updatePostState((prev) => ({
        ...prev,
        comments: prev.comments.map((c) => {
          if (c.id !== commentId) return c;
  
          const wasUpvoted = c.isUpvotedByCurrentUser;
          const wasDownvoted = c.isDownvotedByCurrentUser;
  
          // Calculate new counts
          let newUpvotes = c._count?.upvotes || 0;
          let newDownvotes = c._count?.downvotes || 0;
  
          if (downvoted) {
            newDownvotes += 1;
            if (wasUpvoted) newUpvotes -= 1;
          } else {
            newDownvotes -= 1;
          }
  
          return {
            ...c,
            isDownvotedByCurrentUser: downvoted,
            isUpvotedByCurrentUser: false,
            _count: {
              ...c._count,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
            },
          };
        }),
      }));
    } catch (err) {
      console.error("Failed to toggle comment downvote", err);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/work-posts/${currentPostId}`);
        setPost(data);
        setCurrentImgIndex(0);
        if (onPostUpdate) onPostUpdate(data);
      } catch (err) {
        console.error("Failed to load post", err);
      }
      finally {
        setLoading(false);
      }
    };    
    if (currentPostId) fetchPost();
  }, [currentPostId]);

  if (loading) return <Loading />;

  const images = Array.isArray(post?.images) ? post.images : [];
  const currentImage = images?.[currentImgIndex];

  if (!post || images.length === 0) return null;
  const enableNav = !disablePostNavigation && posts.length > 1;

  const nextPost = () => setCurrentIndex((i) => (i + 1) % posts.length);
  const prevPost = () => setCurrentIndex((i) => (i - 1 + posts.length) % posts.length);

  const nextImage = () => setCurrentImgIndex((i) => (i + 1) % images?.length);
  const prevImage = () => setCurrentImgIndex((i) => (i - 1 + images?.length) % images?.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Left Post Navigation (outside modal) */}
      {enableNav && currentIndex > 0 && (
        <Button
          onClick={prevPost}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 rounded-full p-2 shadow-lg  bg-green-500 hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
          style={{ color: "#062970"}}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}
  
      {/* Modal Content */}
      <div className="relative flex w-full max-w-6xl bg-white rounded-lg overflow-hidden">
        {/* Left - Image Viewer */}
        <div className="relative w-2/3 flex items-center justify-center">
          {/* Inner Image Navigation - Left */}
          {currentImgIndex > 0 && (
            <Button 
              onClick={prevImage} 
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 rounded-full p-2 shadow-lg  bg-green-500 hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
              style={{ color: "#062970"}}
            >
              <ChevronLeft />
            </Button>
          )}
          
          {/* Inner Image Navigation - Right */}
          {images.length > 0 && currentImgIndex < images.length - 1 && (
            <Button 
              onClick={nextImage} 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff] shadow"
              style={{ color: "#062970"}}
            >
              <ChevronRight />
            </Button>
          )}
          
          {images?.length > 1 && (
            <div className="absolute bottom-4 text-white text-xs bg-black/60 rounded-full px-2 py-1">
              {currentImgIndex + 1} / {images?.length}
            </div>
          )}
          <img src={currentImage} alt="Work Post" className="w-full aspect-square object-contain" />
        </div>
  
        {/* Right - Comments + Info */}
        <div className="w-1/3 flex flex-col p-4 relative">
          <Button onClick={onClose} className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]" style={{ color: "#062970" }}>
            <X />
          </Button>
  
          <div className="flex items-center gap-2 mb-4">
            <img src={post.author.profilePicture || defaultProfile} alt="Author" className="w-10 h-10 rounded-full" />
            <div className="font-semibold text-[#062970]">{post.author.username}</div>
          </div>
  
          <p className="text-gray-700 mb-2">{post.caption}</p>
  
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs bg-[#f3e8ff] text-[#6b46c1] px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
          {(post.service || post.appointment?.service) && (
            <div className="bg-gray-50 border rounded-md p-3 mt-2 mb-4">
              <div className="text-sm text-[#062970] font-semibold mb-2">
                {(post.service || post.appointment.service)?.name}
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
  
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Post-level Like & Comment Count */}
            <div className="flex items-center gap-4 mb-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                try {
                  const res = await api.post(`/work-posts/${post.id}/upvote`);
                  const liked = res.data.liked;

                  updatePostState({
                    ...post,
                    isUpvotedByCurrentUser: liked,
                    _count: {
                      ...post._count,
                      upvotes: liked
                        ? (post._count?.upvotes || 0) + 1
                        : Math.max((post._count?.upvotes || 1) - 1, 0),
                    },
                  });                  
                  } catch (err) {
                    console.error("Failed to toggle post like", err);
                  }
                  }}
                  className={`hover:bg-[#f3e8ff] !bg-transparent text-[#062970]`}
                >
                <Heart
                  className="w-5 h-5"
                  fill={post.isUpvotedByCurrentUser ? "#062970" : "none"}
                  stroke="#062970"
                  strokeWidth={post.isUpvotedByCurrentUser ? "0" : "1.5"}
                />
                <span className="text-sm ml-1 text-[#062970]">{post._count?.upvotes || 0}</span>
              </Button>

              <div className="text-sm text-[#062970] flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-[#062970]" />
                <span>{post._count?.comments || 0}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3" style={{ maxHeight: '500px' }}>
            {Array.isArray(post.comments) && post.comments.length > 0 ? (
                post.comments.map(comment => (
                  <div
                    key={comment.id}
                    ref={el => commentRefs.current[comment.id] = el}
                    className={comment.id === highlightedCommentId ? "rounded-md transition-all" : ""}
                  >
                    <CommentCard key={comment.id} comment={comment} onUpvote={handleCommentUpvote} onDownvote={handleCommentDownvote} showReply={false} />
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No comments yet</p>
              )}
            </div>
            {/* Add Comment */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentInput.trim()) return;
                setCommentSubmitting(true);
                try {
                  const res = await api.post(`/work-posts/${post.id}/comments`, {
                    content: commentInput,
                  });           
                  updatePostState({
                    ...post,
                    comments: [...post.comments, res.data],
                    _count: {
                      ...post._count,
                      comments: (post._count?.comments || 0) + 1,
                    },
                  });                  
                  setCommentInput("");
                } catch (err) {
                  console.error("Error adding comment:", err);
                } finally {
                  setCommentSubmitting(false);
                }
              }}
              className="border-t border-gray-300 pt-3 mt-2 flex items-center shrink-0"
            >
              <img
                src={user?.profilePicture || defaultProfile}
                alt="You"
                className="w-8 h-8 rounded-full object-cover mr-2"
              />
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b46c1] text-black placeholder:text-gray-500 bg-white"
              />
              <Button
                type="submit"
                disabled={commentSubmitting || !commentInput.trim()}
                className="bg-green-500 hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                style={{ color: "#062970" }}
              >
                {commentSubmitting ? <Loading fullScreen={false} className="inline" /> : "Post"}
              </Button>
            </form>
          </div>
        </div>
      </div>
  
      {/* Right Post Navigation (outside modal) */}
      {enableNav && currentIndex < posts.length - 1 && (
        <Button
          onClick={nextPost}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff] rounded-full p-2 shadow-lg"
        >
          <ChevronRight className="w-6 h-6" style={{ color: "#062970"}}/>
        </Button>
      )}
    </div>
  );
};

export default WorkPostModal;