import { useState } from "react";
import PropTypes from "prop-types";

const PostForm = ({ onSubmit, isLoading, onCancel }) => {
  const [content, setContent] = useState("");
  const maxChars = 300;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent("");
    }
  };

  const charsRemaining = maxChars - content.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Textarea */}
      <div className="form-control">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
          placeholder="What's happening at LPU today? (max 300 characters)"
          className="textarea textarea-bordered h-24 resize-none focus:outline-none"
          maxLength={maxChars}
          disabled={isLoading}
        />
      </div>

      {/* Character count */}
      <div className="flex justify-between items-center">
        <span className={`text-sm ${charsRemaining < 50 ? "text-warning" : "text-gray-500"}`}>
          {content.length}/{maxChars} characters
        </span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`btn btn-primary ${isLoading ? "loading" : ""}`}
          disabled={isLoading || !content.trim()}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              Posting...
            </>
          ) : (
            "Post to Feed"
          )}
        </button>
      </div>
    </form>
  );
};

PostForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
};

export default PostForm;
