import api from "@/utils/axiosInstance";

export const handleVote = async ({ type, postId, commentId, currentCounts, setCounts }) => {
  try {
    const response = await api.post("/forum/vote", {
      type,
      postId,
      commentId,
    });

    const action = response.data.action;

    // Determine opposite type for toggling logic
    const isPost = !!postId;
    const upvoteKey = isPost ? "upvotes" : "upvotes";
    const downvoteKey = isPost ? "downvotes" : "downvotes";

    let newCounts = { ...currentCounts };

    if (type === "upvote") {
      newCounts[upvoteKey] += action === "added" ? 1 : -1;
      if (action === "added" && currentCounts[downvoteKey] > 0) {
        newCounts[downvoteKey] -= 1;
      }
    } else if (type === "downvote") {
      newCounts[downvoteKey] += action === "added" ? 1 : -1;
      if (action === "added" && currentCounts[upvoteKey] > 0) {
        newCounts[upvoteKey] -= 1;
      }
    }

    // Clamp counts to not go below 0
    newCounts[upvoteKey] = Math.max(0, newCounts[upvoteKey]);
    newCounts[downvoteKey] = Math.max(0, newCounts[downvoteKey]);

    setCounts(newCounts);
  } catch (error) {
    console.error("Error voting:", error);
  }
};
