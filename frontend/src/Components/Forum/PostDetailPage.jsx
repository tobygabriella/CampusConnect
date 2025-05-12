import { useState, useEffect, useRef} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { Button } from "@/Components/ui/button";
import PostCard from "@/Components/forum/PostCard";
import {  ArrowLeft , Loader2 } from "lucide-react";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import api from "@/utils/axiosInstance";
import { handleVote } from "@/utils/handleVote";
import { toast } from "react-toastify";
import { useUserColleges } from "@/hooks/useUserColleges";
import defaultProfile from "@/assets/default-profile.jpg";
import NestedCommentThread from "@/Components/forum/NestedCommentThread";

const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [commentLoading, setCommentLoading] = useState(false);
  const userPostableColleges = useUserColleges();
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightedCommentId = searchParams.get("highlight");

  const commentRefs = useRef({});

  useEffect(() => {
    if (highlightedCommentId && commentRefs.current[highlightedCommentId]) {
      const el = commentRefs.current[highlightedCommentId];
      el.scrollIntoView({ behavior: "smooth", block: "center" });
  
      el.classList.add("bg-[#f3e8ff]");
      setTimeout(() => el.classList.remove("bg-[#f3e8ff]"), 2000);
    }
  }, [comments, highlightedCommentId]);
  

  const fetchPost = async () => {
    try {
      const response = await api.get(`/forum/posts/${postId}`);
      setPost(response.data);
    } catch (error) {
      console.error("[fetchPost] Error fetching post:", error);
      setPost(null);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/forum/posts/${postId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("[fetchComments] Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async (e, parentId = null) => {
    e.preventDefault();
  
    const content = parentId ? replyInputs[parentId] : newComment;
  
    if (!content.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
  
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }
  
    setCommentLoading(true);
    try {
      const response = await api.post("/forum/comments", {
        content,
        postId,
        parentId,
      });

      if (parentId) {
        setComments(prev =>
          prev.map(comment =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), response.data],
                  _count: {
                    ...comment._count,
                    replies: (comment._count?.replies || 0) + 1,
                  },
                }
              : comment
          )
        );
        setReplyInputs(prev => ({ ...prev, [parentId]: "" }));
      } else {
        setComments(prev => [response.data, ...prev]);
        setNewComment("");
      }
  
      setReplyingTo(null);
      toast.success("Comment posted successfully");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };
  const handleCommentVote = async (type, commentId) => {
    // Helper function to find and update comment in nested structure
    const updateCommentCounts = (comments, commentId, updatedCounts) => {
      return comments.map(comment => {
        // Check if this is the comment we're looking for
        if (comment.id === commentId) {
          return {
            ...comment,
            _count: updatedCounts,
          };
        }
        
        // Check in replies if they exist
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentCounts(comment.replies, commentId, updatedCounts),
          };
        }
        
        return comment;
      });
    };
  
    // Find the comment (we need its current counts)
    let targetComment = null;
    const findComment = (comments, commentId) => {
      for (const comment of comments) {
        if (comment.id === commentId) {
          targetComment = comment;
          return;
        }
        if (comment.replies) {
          findComment(comment.replies, commentId);
        }
      }
    };
    findComment(comments, commentId);
  
    if (!targetComment) {
      console.warn("[handleCommentVote] Comment not found");
      return;
    }
  
    const currentCounts = {
      upvotes: targetComment._count.upvotes,
      downvotes: targetComment._count.downvotes,
    };
  
    try {
      await handleVote({
        type,
        commentId,
        currentCounts,
        setCounts: (updatedCounts) => {
          setComments(prev => 
            updateCommentCounts(prev, commentId, updatedCounts)
          );
        },
      });
    } catch (error) {
      console.error("[handleCommentVote] Error handling vote:", error);
    }
  };

  const onVote = async (type) => {
    if (!post) {
      console.warn("[onVote] No post available to vote on");
      return;
    }

    const currentCounts = {
      upvotes: post._count.upvotes,
      downvotes: post._count.downvotes,
    };


    try {
      await handleVote({
        type,
        postId: post.id,
        currentCounts,
        setCounts: (updatedCounts) => {
          setPost((prev) => ({
            ...prev,
            _count: {
              ...prev._count, 
              ...updatedCounts, 
            },
          }));
        },
      });
    } catch (error) {
      console.error("[onVote] Error handling vote:", error);
    }
  };
  
  const handleReplyChange = (commentId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: value,
    }));
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#062970]" />
        <span className="ml-2">Loading post...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Post not found</h2>
        <p className="text-gray-500 mt-2">The requested post could not be loaded</p>
        <Button
          onClick={() => navigate(-1)}
          className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
        >
          Go Back
        </Button>
      </div>
    );
  }


  return (
    <div className="flex w-screen overflow-x-hidden bg-white">
      <SidebarNav />
      <div className="ml-64 min-h-screen bg-gradient-to-b from-[#f3e8ff] to-white flex flex-col flex-1 w-screen pt-16">
        <TopNavbar />
        <div className="max-w-4xl mx-auto p-4 w-full">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>

          <PostCard 
            post={post} 
            onPostClick={() => {}} 
            onVote={onVote} 
          />

          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-[#062970] mb-4">
              {post._count.comments} Comments
            </h2>
            {user && userPostableColleges.includes(post.collegeId) ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex items-start space-x-3">
                  <img
                    src={user?.profilePicture || defaultProfile}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => {
                        setNewComment(e.target.value);
                      }}
                      placeholder={
                        replyingTo
                          ? `Replying to @${replyingTo.author.username}...`
                          : "Add a comment..."
                      }
                      rows={2}
                      className="w-full px-4 py-2 rounded-full border border-[#d8b4fe] text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b46c1] bg-white"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        type="submit"
                        disabled={commentLoading}
                        className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                      >
                        {commentLoading ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-3 bg-blue-50 text-blue-800 rounded-md">
                {user ? "You can only comment in communities you're part of" : "Please sign in to comment"}
              </div>
            )}

            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <NestedCommentThread
                  key={comment.id}
                  comment={comment}
                  user={user}
                  replyInputs={replyInputs}
                  commentLoading={commentLoading}
                  activeReplyId={activeReplyId}
                  handleReplyChange={handleReplyChange}
                  handleCommentSubmit={handleCommentSubmit}
                  setActiveReplyId={setActiveReplyId}
                  handleCommentVote={handleCommentVote}
                  highlightedCommentId={highlightedCommentId} 
                  commentRefs={commentRefs}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;