import { useParams, Navigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetUserProfileQuery } from "../redux/api/usersApiSlice";
import { useGetTodayFeedQuery } from "../redux/api/postsApiSlice";
import PostCard from "../components/post/PostCard";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import {
  FaFire,
  FaAward,
  FaRegCalendarAlt,
} from "react-icons/fa";

const UserProfile = () => {

  const { id } = useParams();
  const currentUserState = useSelector((s) => s.user.data);
  const currentUserId = currentUserState?.data?._id ?? currentUserState?._id;

  const { data: profileResponse, isLoading: profileLoading, error: profileError, refetch } = useGetUserProfileQuery(id);
  const { data: feedData } = useGetTodayFeedQuery();

  if (currentUserId && id && currentUserId.toString() === id.toString()) {
    // If it's the user's own profile, show profile info (or redirect to home where profile modal is)
    // Here we'll just redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  if (profileError || !profileResponse) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-64px-52px)] px-4 text-center">
        <span className="text-5xl mb-4">📭</span>
        <h2 className="text-xl font-bold mb-2">Profile Unavailable</h2>
        <p className="text-base-content/50 max-w-sm text-sm mb-4">
          This account does not exist, or you have blocked each other.
        </p>
        <Link to="/feed" className="btn btn-primary btn-sm rounded-xl">
          Back to Feed
        </Link>
      </div>
    );
  }

  const profile = profileResponse.data;
  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase();

  // Filter Today's posts written by this user
  const todayPosts = (feedData?.posts ?? []).filter((p) => p.userId.toString() === id.toString());

  return (
    <div className="min-h-[calc(100dvh-64px-52px)] py-8 max-w-3xl mx-auto px-4">
      {/* Back button */}
      <Link to="/feed" className="btn btn-ghost btn-sm rounded-xl gap-1 mb-6 text-base-content/60">
        ← Back to Feed
      </Link>

      {/* ── Header Profile Card ── */}
      <div className="card bg-base-200 border border-base-300 shadow-md rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start mb-6">
        {/* Avatar */}
        {profile.profilePhoto ? (
          <img
            src={profile.profilePhoto}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-lg"
          />
        ) : (
          <span className="w-24 h-24 rounded-full bg-primary/20 text-primary text-3xl font-extrabold flex items-center justify-center border-2 border-primary select-none shrink-0 shadow-lg">
            {initials}
          </span>
        )}

        <div className="flex-1 min-w-0 text-center md:text-left flex flex-col gap-2">
          <div>
            <h1 className="text-2xl font-black truncate flex items-center justify-center md:justify-start gap-2">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-xs text-base-content/50 truncate mt-0.5">{profile.email}</p>
          </div>

        </div>
      </div>

      <div className="flex flex-col gap-6">
          {/* Stats section */}
          {profile.streak && (
            <div className="bg-base-200 border border-base-300 rounded-3xl p-5">
              <h2 className="font-bold text-sm tracking-wide text-base-content/50 uppercase mb-4 flex items-center gap-1.5">
                <FaFire className="text-warning text-sm" /> LPU Writing Streak
              </h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-base-100 p-3 rounded-2xl border border-base-content/5 shadow-sm">
                  <p className="text-[10px] font-semibold text-base-content/40 uppercase mb-1">Current Streak</p>
                  <p className="text-lg font-black text-warning">{profile.streak.currentStreak} 🔥</p>
                </div>
                <div className="bg-base-100 p-3 rounded-2xl border border-base-content/5 shadow-sm">
                  <p className="text-[10px] font-semibold text-base-content/40 uppercase mb-1">Longest Streak</p>
                  <p className="text-lg font-black text-base-content">{profile.streak.longestStreak} days</p>
                </div>
                <div className="bg-base-100 p-3 rounded-2xl border border-base-content/5 shadow-sm">
                  <p className="text-[10px] font-semibold text-base-content/40 uppercase mb-1">Total Writing Days</p>
                  <p className="text-lg font-black text-primary">{profile.streak.totalDays} days</p>
                </div>
              </div>
            </div>
          )}

          {/* Badges section */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="bg-base-200 border border-base-300 rounded-3xl p-5">
              <h2 className="font-bold text-sm tracking-wide text-base-content/50 uppercase mb-4 flex items-center gap-1.5">
                <FaAward className="text-primary text-sm" /> Campus Achievements
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="card bg-base-100 p-4 border border-base-content/5 shadow-sm text-center flex flex-col items-center gap-1.5 hover:scale-[1.02] transition-transform duration-200"
                  >
                    <span className="text-2xl">{badge.name.split(" ")[0]}</span>
                    <span className="font-bold text-xs">{badge.name.split(" ").slice(1).join(" ")}</span>
                    <span className="text-[10px] text-base-content/40 leading-snug">{badge.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User's Posts Feed */}
          <div>
            <h2 className="font-bold text-sm tracking-wide text-base-content/50 uppercase mb-4 flex items-center gap-1.5">
              <FaRegCalendarAlt className="text-primary text-sm" /> Today&apos;s Posts
            </h2>

            {todayPosts.length === 0 ? (
              <div className="card bg-base-200 border border-base-300 rounded-3xl p-8 text-center text-xs text-base-content/40">
                No posts shared today by this student.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {todayPosts.map((post) => (
                  <PostCard key={post._id} post={post} onDelete={refetch} />
                ))}
              </div>
            )}
          </div>
        </div>

    </div>
  );
};

export default UserProfile;
