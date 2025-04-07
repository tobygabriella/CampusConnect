import { Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/utils/timeAgo";
import defaultProfile from "@/assets/default-profile.jpg";

const CommentCard = ({ 
  comment, 
  onReply,
  onUpvote,
  onDownvote 
}) => {
  return (
    <div className="bg-white rounded-lg p-4 mb-3">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <img
            src={comment.author.profilePicture || defaultProfile}
            alt={comment.author.username}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Link
              to={`/profile/${comment.author.username}`}
              className="font-medium text-sm text-[#062970] hover:underline"
            >
              {comment.author.username}
            </Link>
            <span className="text-xs text-gray-500 capitalize">{comment.author.role}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt)} ago
            </span>
          </div>
          <p className="mt-1 text-gray-700 text-sm">{comment.content}</p>
          <div className="mt-2 flex items-center space-x-4 text-gray-500">
            <Button 
              variant="ghost" 
              size="sm" 
              className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
              onClick={() => onUpvote(comment.id)}
            >
              <ThumbsUp className="h-3 w-3" />
              <span className="text-xs ml-1">{comment._count?.upvotes || 0}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
              onClick={() => onDownvote(comment.id)}
            >
              <ThumbsDown className="h-3 w-3" />
              <span className="text-xs ml-1">{comment._count?.downvotes || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]"
              onClick={() => onReply(comment)}
            >
              <Reply className="h-3 w-3" />
              <span className="text-xs ml-1">Reply</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;