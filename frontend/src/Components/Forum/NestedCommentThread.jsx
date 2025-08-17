import CommentCard from "@/Components/forum/CommentCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ReplyInputArea from "./ReplyInputArea";
import { useState } from "react";


const MAX_DEPTH = 6;
const MAX_VISIBLE_REPLIES = 2;

const NestedCommentThread = ({
  comment,
  depth = 0,
  showAll = false,
  user,
  replyInputs,
  commentLoading,
  activeReplyId,
  handleReplyChange,
  handleCommentSubmit,
  setActiveReplyId,
  handleCommentVote,
  highlightedCommentId,
  commentRefs,   
}) => {
  const navigate = useNavigate();
  const [showAllReplies, setShowAllReplies] = useState(false);

  const shouldCollapse = depth >= MAX_DEPTH && !showAll;

  const repliesToShow = showAllReplies || showAll
    ? comment.replies
    : comment.replies?.slice(0, MAX_VISIBLE_REPLIES);

  return (
    <div className="space-y-2">
      <div
        ref={(el) => {
          if (el) commentRefs.current[comment.id] = el;
        }}
        className={comment.id === highlightedCommentId ? "rounded-md bg-[#f3e8ff] transition-all" : ""}
      >
        <CommentCard
          comment={comment}
          onReply={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
          onUpvote={(id) => handleCommentVote("upvote", id)}
          onDownvote={(id) => handleCommentVote("downvote", id)}
        />
      </div>


      {activeReplyId === comment.id && (
        <ReplyInputArea
          comment={comment}
          user={user}
          replyInputs={replyInputs}
          commentLoading={commentLoading}
          handleReplyChange={handleReplyChange}
          handleCommentSubmit={handleCommentSubmit}
          setActiveReplyId={setActiveReplyId}
        />
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 pl-4 border-l-2 border-gray-200 space-y-4">
          {shouldCollapse ? (
            <Button
              variant="ghost"
              size="sm"
              className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
              onClick={() => navigate(`/comments/${comment.id}/thread`)}
            >
              View more replies
            </Button>
          ) : (
            <>
              {repliesToShow.map((child) => (
                <NestedCommentThread
                  key={child.id}
                  comment={child}
                  user={user}
                  depth={depth + 1}
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
              ))}

              {comment.replies.length > MAX_VISIBLE_REPLIES && !showAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
                  onClick={() => setShowAllReplies(!showAllReplies)}
                  style={{ color: "#062970"}}
                >
                  {showAllReplies ? "Hide replies" : "View more replies"}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};



export default NestedCommentThread;
