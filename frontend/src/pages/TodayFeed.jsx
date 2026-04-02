import { useState } from "react";
import { useGetTodayFeedQuery, useCreatePostMutation, useGetUserPostCountQuery } from "../redux/api/postsApiSlice";
import PostForm from "../components/post/PostForm";
import PostCard from "../components/post/PostCard";
import Loader from "../components/Loader";

const TodayFeed = () => {
  const { data: feedData, isLoading: feedLoading, error: feedError, refetch: refetchFeed } = useGetTodayFeedQuery();
  const { data: countData, isLoading: countLoading, refetch: refetchCount } = useGetUserPostCountQuery();
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const posts = feedData?.posts || [];
  const remainingPosts = countData?.remaining || 5;

  const handlePostSubmit = async (content) => {
    setErrorMsg("");
    try {
      console.log("Creating post with content:", content);
      await createPost(content).unwrap();
      console.log("Post created successfully!");
      setShowForm(false);
      // Refetch both feed and count
      refetchFeed();
      refetchCount();
    } catch (err) {
      console.error("Post creation error:", err);
      const errorMessage = err?.data?.error || err?.message || "Failed to create post";
      setErrorMsg(errorMessage);
    }
  };

  if (feedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🌍 LPU Today Feed</h1>
          
          {/* Public Warning */}
          <div className="alert alert-info shadow-lg mb-4">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <p className="text-sm">
                <strong>🌍 Public Feed:</strong> This is a public feed visible to all LPU users. Do not share personal or sensitive information.
              </p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Share what's happening at LPU today. Posts automatically disappear at midnight ⏰
          </p>
        </div>

        {/* Create Post Section */}
        <div className="mb-8">
          {remainingPosts > 0 ? (
            <>
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary w-full"
                >
                  ✨ Create Today's Post
                </button>
              ) : (
                <div className="card bg-surface shadow-lg">
                  <div className="card-body">
                    <h2 className="card-title">Share What's Happening</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {remainingPosts} post{remainingPosts !== 1 ? "s" : ""} remaining today
                    </div>

                    {errorMsg && (
                      <div className="alert alert-error shadow-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 shrink-0 stroke-current"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2m-2-2l-2-2m2 2l2 2"
                          />
                        </svg>
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <PostForm
                      onSubmit={handlePostSubmit}
                      isLoading={isCreating}
                      onCancel={() => {
                        setShowForm(false);
                        setErrorMsg("");
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="alert alert-warning shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4v2m0 4v2M7 9h.01M7 13h.01M7 17h.01M11 9h.01M11 13h.01M11 17h.01M15 9h.01M15 13h.01M15 17h.01"
                />
              </svg>
              <span>You've reached your daily post limit (5). Try again tomorrow! 📅</span>
            </div>
          )}
        </div>

        {/* Feed Error */}
        {feedError && (
          <div className="alert alert-error shadow-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Failed to load feed. Please try refreshing the page.</span>
          </div>
        )}

        {/* Posts Feed */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              Today's Posts ({posts.length})
            </h2>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No posts yet... Be the first! 🚀
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onDelete={() => {
                    refetchFeed();
                    refetchCount();
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayFeed;
