import { useState } from "react";
import PropTypes from "prop-types";
import { useDeletePostMutation } from "../../redux/api/postsApiSlice";
import { useSelector } from "react-redux";

const PostCard = ({ post, onDelete }) => {
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const userState = useSelector((state) => state.user);
  // Handle both login and profile response shapes
  const userData = userState?.data?.data ?? {};
  const currentUserId = userData._id ?? userState?.data?._id;
  const isOwner = currentUserId && post.userId && currentUserId.toString() === post.userId.toString();

  const getTimeAgo = (date) => {
    const now      = new Date();
    const postDate = new Date(date);
    const diffMs   = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1)  return "just now";
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

  // Derive initials from userName
  const nameParts = (post.userName || "?").split(" ");
  const initials  = nameParts.map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();

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
      </div>
    </div>
  );
};

PostCard.propTypes = {
  post: PropTypes.shape({
    _id:       PropTypes.string.isRequired,
    userName:  PropTypes.string.isRequired,
    userId:    PropTypes.string.isRequired,
    content:   PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PostCard;