import { Link } from "react-router-dom";
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/utils/timeAgo";
import defaultProfile from "@/assets/default-profile.jpg";

const PostCard = ({ post, onVote, onPostClick }) => {
  const upvotesCount = post._count?.upvotes || 0;
  const downvotesCount = post._count?.downvotes || 0;
  const commentsCount = post._count?.comments || 0;

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onPostClick}
    >
      <div className="flex items-start space-x-3">
        <img
          src={post.author.profilePicture || defaultProfile}
          alt={post.author.username}
          className="w-10 h-10 rounded-full object-cover border border-gray-200"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Link
              to={`/profile/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-[#062970] hover:underline"
            >
              {post.author.username}
            </Link>
            <span className="text-xs text-gray-500 capitalize">{post.author.role}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{post.title}</h3>
          <p className="mt-1 text-gray-600 line-clamp-2">{post.content}</p>
          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-[#f3e8ff] text-[#6b46c1] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div
            className="mt-3 flex items-center space-x-4 text-gray-500"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="sm" className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]" onClick={() => onVote?.("upvote")}>
              <ThumbsUp className="h-4 w-4  text-[#062970] " />
              <span className="text-[#062970]" >{upvotesCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]" onClick={() => onVote?.("downvote")}>
              <ThumbsDown className="h-4 w-4  text-[#062970] " />
              <span className="text-[#062970]">{downvotesCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="bg-green-500 text-[#062970] hover:bg-green-600 !bg-transparent hover:!bg-[#f3e8ff]" onClick={onPostClick}>
              <MessageSquare className="h-4 w-4 text-[#062970]" />
              <span className="text-[#062970]">{commentsCount}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default PostCard;