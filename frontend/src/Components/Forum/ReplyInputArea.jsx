import defaultProfile from "@/assets/default-profile.jpg";
import { Button } from "@/components/ui/button";

const ReplyInputArea = ({
    comment,
    user,
    replyInputs,
    commentLoading,
    handleReplyChange,
    handleCommentSubmit,
    setActiveReplyId,
  }) => (
    <div className="ml-8 pl-4">
      <form onSubmit={(e) => handleCommentSubmit(e, comment.id)} className="mb-4">
        <div className="flex items-start space-x-3">
          <img
            src={user?.profilePicture || defaultProfile}
            alt={user?.username}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-1">
              Replying to @{comment.author.username}
            </div>
            <textarea
              value={replyInputs[comment.id] || ""}
              onChange={(e) => handleReplyChange(comment.id, e.target.value)}
              placeholder={`Replying to @${comment.author.username}...`}
              rows={2}
              className="w-full px-4 py-2 rounded-full border border-[#d8b4fe] text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6b46c1] bg-white"
            />
            <div className="flex justify-end mt-2 space-x-2">
              <Button
                type="button"
                onClick={() => setActiveReplyId(null)}
                variant="outline"
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={commentLoading}
                className="bg-[#6b46c1] text-white hover:bg-[#5a3cad] text-sm"
              >
                Reply
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );

  export default ReplyInputArea