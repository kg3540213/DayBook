import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  useGetMySharedJournalsQuery,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
} from "../redux/api/sharedJournalApiSlice";
import Loader from "../components/Loader";
import CreateSharedJournal from "../components/shared/CreateSharedJournal";
import SharedJournalCard from "../components/shared/SharedJournalCard";
import { toast } from "react-toastify";

// ── PendingInviteCard ─────────────────────────────────────────────
// Shown to user2 when they have a pending invite addressed to their
// email but haven't accepted yet.  Gives them Accept / Decline
// directly from the journals list — no need to find the original email.
const PendingInviteCard = ({ journal, onAccepted, onDeclined }) => {
  const [acceptInvite,  { isLoading: accepting  }] = useAcceptInviteMutation();
  const [declineInvite, { isLoading: declining  }] = useDeclineInviteMutation();

  const isProcessing = accepting || declining;

  const handleAccept = async (e) => {
    e.stopPropagation();
    try {
      const res = await acceptInvite(journal.inviteToken).unwrap();
      toast.success(res.message || "You've joined the shared journal!");
      onAccepted?.();
    } catch (err) {
      toast.error(err?.data?.message || "Could not accept invite.");
    }
  };

  const handleDecline = async (e) => {
    e.stopPropagation();
    try {
      const res = await declineInvite(journal.inviteToken).unwrap();
      toast.info(res.message || "Invite declined.");
      onDeclined?.();
    } catch (err) {
      toast.error(err?.data?.message || "Could not decline invite.");
    }
  };

  return (
    <div className="card bg-base-200 shadow-md rounded-2xl border border-warning/40 relative overflow-hidden">
      {/* Pending ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-warning rounded-t-2xl" />

      <div className="card-body p-5 pt-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl mt-0.5">📩</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight truncate">
              {journal.name}
            </h3>
            {journal.description && (
              <p className="text-xs text-base-content/60 line-clamp-2 mt-0.5">
                {journal.description}
              </p>
            )}
          </div>
        </div>

        {/* Owner info */}
        <div className="flex items-center gap-2 mb-3">
          {journal.owner?.profilePhoto ? (
            <img
              src={journal.owner.profilePhoto}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
              {(journal.owner?.firstName?.[0] ?? "").toUpperCase()}
            </span>
          )}
          <p className="text-xs text-base-content/70">
            Invited by{" "}
            <span className="font-semibold">
              {journal.owner?.firstName} {journal.owner?.lastName ?? ""}
            </span>
          </p>
        </div>

        {/* Encryption warning */}
        <div className="alert alert-warning rounded-xl text-xs py-1.5 mb-3">
          <span>🔓</span>
          <span>Entries in this journal are not encrypted.</span>
        </div>

        {/* Accept / Decline */}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="btn btn-primary btn-sm flex-1 rounded-xl"
          >
            {accepting ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Joining…
              </>
            ) : (
              "✅ Accept"
            )}
          </button>
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="btn btn-ghost btn-sm rounded-xl text-error border border-error/30"
          >
            {declining ? "…" : "✕ Decline"}
          </button>
        </div>

        <p className="text-xs text-base-content/40 text-center mt-2">
          Invited on {new Date(journal.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────
const SharedJournals = () => {
  const user = useSelector((state) => state.user.data);
  if (!user) return <Navigate to="/login" replace />;

  const currentUserId    = user.data._id;
  const currentUserEmail = user.data.email;

  const { data, isLoading, isError, refetch } = useGetMySharedJournalsQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  const journals = data?.data ?? [];

  // ── Split into three buckets ──────────────────────────────────
  // 1. pendingInvites  — pending journals where the logged-in user is the invitee
  // 2. activeJournals  — journals the user is an active member of
  // 3. ownedPending    — journals the current user owns but invitee hasn't accepted
  const pendingInvites = journals.filter(
    (j) =>
      j.status === "pending" &&
      j.inviteEmail === currentUserEmail &&
      j.owner._id !== currentUserId
  );

  const activeJournals = journals.filter((j) => j.status === "active");

  const ownedPending = journals.filter(
    (j) =>
      j.status === "pending" &&
      j.owner._id === currentUserId
  );

  const hasAnyJournal =
    pendingInvites.length > 0 ||
    activeJournals.length > 0 ||
    ownedPending.length > 0;

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-10"
      style={{ minHeight: "calc(100dvh - 64px - 52px)" }}
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Shared Journals</h1>
          <p className="text-base-content/60 text-sm mt-1">
            Private spaces you share with one other person.
          </p>
        </div>
        <CreateSharedJournal />
      </div>

      {/* Encryption callout */}
      <div className="alert alert-warning rounded-2xl text-sm mb-8 py-3">
        <span className="text-lg">🔓</span>
        <div>
          <p className="font-semibold">Shared entries are not encrypted</p>
          <p className="text-base-content/70 text-xs">
            Both collaborators can read every entry in a shared journal. Keep
            sensitive thoughts in your personal (encrypted) journal.
          </p>
        </div>
      </div>

      {isError && (
        <p className="text-error text-center">
          Failed to load shared journals. Please refresh.
        </p>
      )}

      {/* Empty state */}
      {!isError && !hasAnyJournal && (
        <div className="text-center py-24">
          <span className="text-6xl block mb-4">👥</span>
          <h2 className="text-2xl font-bold mb-2">No shared journals yet</h2>
          <p className="text-base-content/60 mb-6 max-w-sm mx-auto">
            Create one and invite a friend, classmate, or study partner to write
            together.
          </p>
          <CreateSharedJournal />
        </div>
      )}

      {/* ── Pending invites section (user2 needs to act) ───────── */}
      {pendingInvites.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">Pending Invites</h2>
            <span className="badge badge-warning badge-sm">
              {pendingInvites.length}
            </span>
          </div>
          <p className="text-sm text-base-content/60 mb-4">
            You've been invited to these journals. Accept to start writing
            together, or decline to remove the invite.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingInvites.map((journal) => (
              <PendingInviteCard
                key={journal._id}
                journal={journal}
                onAccepted={refetch}
                onDeclined={refetch}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Owned pending (owner waiting for invitee) ──────────── */}
      {ownedPending.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">Waiting for Response</h2>
            <span className="badge badge-ghost badge-sm">
              {ownedPending.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ownedPending.map((journal) => (
              <SharedJournalCard
                key={journal._id}
                journal={journal}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Active journals ─────────────────────────────────────── */}
      {activeJournals.length > 0 && (
        <div>
          {(pendingInvites.length > 0 || ownedPending.length > 0) && (
            <h2 className="text-lg font-bold mb-4">Active Journals</h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeJournals.map((journal) => (
              <SharedJournalCard
                key={journal._id}
                journal={journal}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedJournals;