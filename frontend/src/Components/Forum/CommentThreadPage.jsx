import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/Components/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import SidebarNav from "@/Components/Navigation/SideBarNav";
import TopNavbar from "@/Components/Navigation/TopNavBar";
import PostCard from "@/Components/forum/PostCard";
import NestedCommentThread from "@/Components/forum/NestedCommentThread";
import api from "@/utils/axiosInstance";
import { useRef } from "react";
import { useLocation } from "react-router-dom";

const CommentThreadPage = () => {
  const { commentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightedCommentId = searchParams.get("highlight");
  const commentRefs = useRef({});

  const handleReplyChange = (commentId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: value,
    }));
  };

  const handleCommentSubmit = async (e, parentId = null) => {
    e.preventDefault();
    const content = replyInputs[parentId];
    if (!content || !content.trim()) return;
  
    setCommentLoading(true);
    try {
      const res = await api.post("/forum/comments", {
        content,
        postId: post.id,
        parentId,
      });
  
      const newReply = res.data;
  
      const addReplyRecursive = (current, parentId, newReply) => {
        if (current.id === parentId) {
          return {
            ...current,
            replies: [...(current.replies || []), newReply],
            _count: {
              ...current._count,
              replies: (current._count?.replies || 0) + 1,
            },
          };
        }
  
        if (current.replies && current.replies.length > 0) {
          return {
            ...current,
            replies: current.replies.map((r) =>
              addReplyRecursive(r, parentId, newReply)
            ),
          };
        }
  
        return current;
      };
  
      setComment((prev) => addReplyRecursive(prev, parentId, newReply));
      setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
      setActiveReplyId(null);
    } catch (error) {
      console.error("Failed to submit reply", error);
    } finally {
      setCommentLoading(false);
    }
  };
 
  const handleCommentVote = async (type, commentId) => {
    const findComment = (node, commentId) => {
      if (node.id === commentId) return node;
      for (const child of node.replies || []) {
        const found = findComment(child, commentId);
        if (found) return found;
      }
      return null;
    };
  
    const updateCommentCounts = (node, commentId, updatedCounts) => {
      if (node.id === commentId) {
        return {
          ...node,
          _count: updatedCounts,
        };
      }
  
      return {
        ...node,
        replies: (node.replies || []).map((r) =>
          updateCommentCounts(r, commentId, updatedCounts)
        ),
      };
    };
  
    const target = findComment(comment, commentId);
    if (!target) return;
  
    const currentCounts = {
      upvotes: target._count.upvotes,
      downvotes: target._count.downvotes,
    };
  
    try {
      const { handleVote } = await import("@/utils/handleVote");
      await handleVote({
        type,
        commentId,
        currentCounts,
        setCounts: (updatedCounts) => {
          setComment((prev) =>
            updateCommentCounts(prev, commentId, updatedCounts)
          );
        },
      });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handlePostVote = async (type) => {
    if (!post) return;
  
    const currentCounts = {
      upvotes: post._count.upvotes,
      downvotes: post._count.downvotes,
    };
  
    try {
      const { handleVote } = await import("@/utils/handleVote");
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
      console.error("Error voting on post:", error);
    }
  };
  
  
  useEffect(() => {
    const fetchThread = async () => {
      try {
        const res = await api.get(`/forum/comments/${commentId}/thread`);
        setComment(res.data);
        setPost(res.data.post); // Grab associated post
      } catch (err) {
        console.error("Failed to load thread", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [commentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-[#062970]" />
        <span className="ml-2">Loading thread...</span>
      </div>
    );
  }

  if (!comment || !post) {
    return <div className="text-center mt-10 text-gray-500">Thread not found.</div>;
  }

  return (
    <div className="flex w-screen overflow-x-hidden bg-white">
      <SidebarNav />
      <div className="ml-64 min-h-screen bg-gradient-to-b from-[#f3e8ff] to-white flex flex-col flex-1 w-screen pt-16">
        <TopNavbar />
        <div className="max-w-4xl mx-auto p-4 w-full">
          <Button
            variant="ghost"
            className="text-[#062970] hover:underline mb-4 bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Post
          </Button>

          {/* Original Post */}
          <PostCard post={post} onPostClick={() => {}} onVote={handlePostVote} />


          {/* Thread */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-[#062970] mb-4">Comment Thread</h2>
            <NestedCommentThread
              comment={comment}
              showAll
              depth={0}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentThreadPage;
