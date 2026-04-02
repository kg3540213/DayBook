import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  useGetTodayFeedQuery,
  useCreatePostMutation,
  useGetUserPostCountQuery,
} from "../redux/api/postsApiSlice";
import PostForm from "../components/post/PostForm";
import PostCard from "../components/post/PostCard";
import Loader from "../components/Loader";
import lpuLogo from "../assets/lpu.png";

const TodayFeed = () => {
  const user = useSelector((state) => state.user.data);

  // Redirect if not logged in
  if (!user) return <Navigate to="/login" replace />;

  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
    refetch: refetchFeed,
  } = useGetTodayFeedQuery();

  const {
    data: countData,
    isLoading: countLoading,
    refetch: refetchCount,
  } = useGetUserPostCountQuery();

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();

  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const posts          = feedData?.posts ?? [];
  const remainingPosts = countData?.remaining ?? 5;
  const isCountLoading = countLoading;

  const handlePostSubmit = async (content) => {
    setErrorMsg("");
    try {
      // content is a plain string — postsApiSlice wraps it as { content }
      await createPost(content).unwrap();
      setShowForm(false);
      refetchFeed();
      refetchCount();
    } catch (err) {
      console.error("Post creation error:", err);
      const errorMessage =
        err?.data?.error || err?.data?.message || err?.message || "Failed to create post";
      setErrorMsg(errorMessage);
    }
  };

  const handleDelete = () => {
    refetchFeed();
    refetchCount();
  };

  if (feedLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px-52px)] py-8">
      <div className="max-w-2xl mx-auto px-4">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-4">LPU Community</p>
          
          {/* LPU Logo */}
          <div className="mb-6 flex justify-center">
            <img 
              src={lpuLogo} 
              alt="LPU Logo" 
              className="h-24 w-auto object-contain rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
            🌍 Today&apos;s Feed
          </h1>

          {/* Public Warning */}
          <div className="alert bg-info/10 border border-info/30 rounded-2xl mb-4 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 stroke-info"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-info">
              <strong>Public Feed:</strong> Visible to all LPU users. Don&apos;t share personal or sensitive info.
            </p>
          </div>

          <p className="text-base-content/60 text-sm">
            Share what&apos;s happening at LPU today. Posts disappear at midnight ⏰
          </p>
        </div>

        {/* ── Create Post ──────────────────────────────────────── */}
        <div className="mb-8">
          {isCountLoading ? (
            <div className="h-12 bg-base-200 rounded-2xl animate-pulse" />
          ) : remainingPosts > 0 ? (
            <>
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary w-full rounded-2xl shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  ✨ Share Something Today
                </button>
              ) : (
                <div className="card bg-base-200 rounded-3xl border border-base-300 shadow-lg">
                  <div className="card-body p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-bold text-base">Share What&apos;s Happening</h2>
                      <span className="badge badge-ghost badge-sm">
                        {remainingPosts} post{remainingPosts !== 1 ? "s" : ""} left today
                      </span>
                    </div>

                    {errorMsg && (
                      <div className="alert alert-error rounded-xl py-2 text-sm mb-3">
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
            <div className="alert bg-warning/10 border border-warning/30 rounded-2xl py-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0 stroke-warning"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm text-warning-content">
                You&apos;ve reached your daily limit of 5 posts. Try again tomorrow! 📅
              </span>
            </div>
          )}
        </div>

        {/* ── Feed Error ────────────────────────────────────────── */}
        {feedError && (
          <div className="alert alert-error rounded-2xl mb-4 text-sm">
            <span>Failed to load feed. Please refresh the page.</span>
          </div>
        )}

        {/* ── Posts Feed ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              Today&apos;s Posts
              <span className="ml-2 badge badge-primary badge-sm">{posts.length}</span>
            </h2>
            <button
              onClick={() => refetchFeed()}
              className="btn btn-ghost btn-xs rounded-xl text-base-content/50 hover:text-base-content"
            >
              ↻ Refresh
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">🌅</span>
              <p className="text-base-content/50 text-lg font-medium">
                No posts yet today
              </p>
              <p className="text-base-content/40 text-sm mt-1">
                Be the first to share something! 🚀
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={handleDelete}
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