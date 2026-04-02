import { useState } from "react";
import PropTypes from "prop-types";
import { useDeletePostMutation } from "../../redux/api/postsApiSlice";
import { useSelector } from "react-redux";

const PostCard = ({ post, onDelete }) => {
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const userState = useSelector((state) => state.user);
  const currentUserId = userState?.data?.data?._id || userState?.data?._id;
  const isOwner = currentUserId === post.userId;

  // Calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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

  return (
    <div className="card bg-surface border border-base-300 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{post.userName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getTimeAgo(post.createdAt)}
            </p>
          </div>

          {/* Delete Button (Only for post owner) */}
          {isOwner && (
            <div>
              {showDeleteConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="btn btn-sm btn-error btn-outline"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn btn-sm btn-ghost"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-sm btn-ghost text-error"
                  title="Delete your post"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <p className="text-base break-words">{post.content}</p>
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
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PostCard;
