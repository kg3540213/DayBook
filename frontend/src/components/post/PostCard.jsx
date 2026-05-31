import { useState } from "react";
import PropTypes from "prop-types";
import {
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
} from "../../redux/api/postsApiSlice";
import { useSelector } from "react-redux";

const PostCard = ({ post, onDelete }) => {
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();
  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();
  const [deleteComment, { isLoading: isDeletingComment }] = useDeleteCommentMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [expandedComments, setExpandedComments] = useState(false);

  const userState = useSelector((state) => state.user);
  // Handle both login and profile response shapes
  const userData = userState?.data?.data ?? {};
  const currentUserId = userData._id ?? userState?.data?._id;
  const isOwner = currentUserId && post.userId && currentUserId.toString() === post.userId.toString();

  // Check if current user liked this post
  const userLiked = post.likes?.some((likeId) => likeId.toString() === currentUserId?.toString());

  const getTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  const handleDelete = async () => {
    try {
      await deletePost(post._id).unwrap();
      setShowDeleteConfirm(false);
      onDelete();
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleLike = async () => {
    try {
      if (userLiked) {
        await unlikePost(post._id).unwrap();
      } else {
        await likePost(post._id).unwrap();
      }
      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      console.error("Failed to like/unlike post:", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      await addComment({ postId: post._id, content: commentContent }).unwrap();
      setCommentContent("");
      setShowCommentForm(false);
      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment({ postId: post._id, commentId }).unwrap();
      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  // Derive initials from userName
  const nameParts = (post.userName || "?").split(" ");
  const initials = nameParts.map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();

  const likeCount = post.likes?.length ?? 0;
  const commentCount = post.comments?.length ?? 0;
  const displayComments = expandedComments ? post.comments : post.comments?.slice(-2);

  return (
    <div className="card bg-base-200 border border-base-300 rounded-3xl hover:border-base-content/20 hover:shadow-md transition-all duration-200">
      <div className="card-body p-5">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar with initials */}
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0 select-none">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{post.userName}</p>
              <p className="text-xs text-base-content/40 mt-0.5">
                {getTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Delete (owner only) */}
          {isOwner && (
            <div className="shrink-0">
              {showDeleteConfirm ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={handleDelete}
                    className="btn btn-xs btn-error rounded-lg"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn btn-xs btn-ghost rounded-lg"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-xs btn-ghost text-error rounded-lg"
                  title="Delete your post"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <p className="text-sm leading-relaxed break-words mt-1 text-base-content/85">
          {post.content}
        </p>

        {/* ── Like & Comment Stats ────────────────────────── */}
        <div className="flex gap-4 text-xs text-base-content/60 mt-3">
          {likeCount > 0 && (
            <button
              onClick={() => {}}
              className="hover:text-primary transition-colors cursor-default"
              title={`${likeCount} like${likeCount !== 1 ? "s" : ""}`}
            >
              ❤️ {likeCount}
            </button>
          )}
          {commentCount > 0 && (
            <button
              onClick={() => setExpandedComments(!expandedComments)}
              className="hover:text-primary transition-colors"
              title={`${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
            >
              💬 {commentCount}
            </button>
          )}
        </div>

        {/* ── Actions (Like & Comment) ────────────────────── */}
        <div className="divider my-2" />
        <div className="flex gap-2">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLiking || isUnliking}
            className={`flex-1 btn btn-sm rounded-lg gap-2 ${
              userLiked
                ? "btn-primary text-primary-content"
                : "btn-ghost hover:bg-primary/10"
            }`}
          >
            {isLiking || isUnliking ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <>
                {userLiked ? "❤️ Liked" : "🤍 Like"}
              </>
            )}
          </button>

          {/* Comment button */}
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="flex-1 btn btn-sm btn-ghost rounded-lg gap-2 hover:bg-primary/10"
          >
            💬 Comment
          </button>
        </div>

        {/* ── Comment Form ────────────────────────────────── */}
        {showCommentForm && (
          <form onSubmit={handleAddComment} className="mt-3 space-y-2">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value.slice(0, 200))}
              placeholder="Write a comment... (max 200 characters)"
              className="textarea textarea-bordered textarea-sm w-full resize-none"
              maxLength={200}
              disabled={isAddingComment}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCommentForm(false);
                  setCommentContent("");
                }}
                className="btn btn-xs btn-ghost rounded-lg"
                disabled={isAddingComment}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!commentContent.trim() || isAddingComment}
                className="btn btn-xs btn-primary rounded-lg"
              >
                {isAddingComment ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Comments List ───────────────────────────────── */}
        {commentCount > 0 && (
          <div className="mt-4 space-y-3 bg-base-100/30 rounded-xl p-3">
            {!expandedComments && commentCount > 2 && (
              <button
                onClick={() => setExpandedComments(true)}
                className="text-xs text-primary hover:underline w-full text-left"
              >
                View all {commentCount} comments
              </button>
            )}

            {displayComments?.map((comment) => {
              const commentOwnerInitials = (comment.userName || "?")
                .split(" ")
                .map((p) => p[0] ?? "")
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isCommentOwner =
                currentUserId && comment.userId && currentUserId.toString() === comment.userId.toString();

              return (
                <div key={comment._id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0 select-none">
                    {commentOwnerInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs font-semibold">{comment.userName}</p>
                        <p className="text-xs text-base-content/70 break-words mt-1">
                          {comment.content}
                        </p>
                        <p className="text-xs text-base-content/40 mt-1">
                          {getTimeAgo(comment.createdAt)}
                        </p>
                      </div>
                      {isCommentOwner && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="btn btn-xs btn-ghost text-error rounded-lg shrink-0"
                          title="Delete comment"
                          disabled={isDeletingComment}
                        >
                          {isDeletingComment ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            "✕"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {expandedComments && commentCount > 2 && (
              <button
                onClick={() => setExpandedComments(false)}
                className="text-xs text-primary hover:underline w-full text-left"
              >
                Hide comments
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

PostCard.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    likes: PropTypes.arrayOf(PropTypes.string),
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        userName: PropTypes.string.isRequired,
        userId: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PostCard;