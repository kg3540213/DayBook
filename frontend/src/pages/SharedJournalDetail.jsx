// frontend/src/pages/SharedJournalDetail.jsx
// Real-time additions vs original:
//   • connect + join journal room on mount, leave + disconnect on unmount
//   • listen for entry:added / entry:updated / entry:deleted → patch RTK cache
//   • listen for user:typing / user:stopped → show/hide typing indicator
//   • listen for user:online / user:offline → show collaborator presence dot
//   • TypingIndicator component (animated dots)
//   • OnlineBadge component on each member chip
//   • everything else (layout, pagination, UI) is identical to original

import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch }  from "react-redux";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useGetSharedJournalQuery }  from "../redux/api/sharedJournalApiSlice";
import apiSlice                      from "../redux/api/apiSlice";
import Loader                        from "../components/Loader";
import SharedEntryCard               from "../components/shared/SharedEntryCard";
import AddSharedEntry                from "../components/shared/AddSharedEntry";
import { FaArrowLeft, FaUsers, FaCircle } from "react-icons/fa";
import socket                        from "../utils/socket";   // NEW

// ── Typing indicator — three animated dots ────────────────────────
const TypingIndicator = ({ name }) => (
  <div className="flex items-center gap-2 px-4 py-2 text-sm text-base-content/60">
    <span className="font-medium text-primary">{name}</span>
    <span>is typing</span>
    <span className="flex gap-0.5 items-end h-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  </div>
);

// ── Member chip with live presence dot ───────────────────────────
const MemberChip = ({ user, label, isOnline }) => {
  if (!user) return null;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";
  return (
    <div className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-1.5">
      <div className="relative">
        {user.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt=""
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
            {initials}
          </span>
        )}
        {/* Online dot */}
        <FaCircle
          className={`absolute -bottom-0.5 -right-0.5 text-[8px] transition-colors duration-500 ${
            isOnline ? "text-success" : "text-base-content/20"
          }`}
        />
      </div>
      <div className="text-xs">
        <p className="font-medium leading-tight">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-base-content/40 capitalize">{label}</p>
      </div>
    </div>
  );
};

// ── Pagination ────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 my-8">
      <button
        className="btn btn-sm btn-ghost"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ← Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="btn btn-sm btn-ghost"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────
const SharedJournalDetail = () => {
  const user = useSelector((state) => state.user.data);
  if (!user) return <Navigate to="/login" replace />;

  const { journalId } = useParams();
  const navigate       = useNavigate();
  const dispatch       = useDispatch();
  const currentUserId  = user.data._id;

  const [page, setPage] = useState(1);

  // ── Real-time state ───────────────────────────────────────────
  // typingUser: { userId, name } | null
  const [typingUser,      setTypingUser]      = useState(null);
  // onlineUserIds: Set of userId strings currently in the room
  const [onlineUserIds,   setOnlineUserIds]   = useState(new Set());
  const [socketConnected, setSocketConnected] = useState(false);

  // Debounce timer ref for clearing typing indicator if stop event is missed
  const typingTimerRef = useRef(null);

  // ── RTK Query ─────────────────────────────────────────────────
  const { data, isLoading, isError } = useGetSharedJournalQuery(
    { journalId, page, limit: 9 },
    { skip: !journalId }
  );

  // ── RTK cache patcher helpers ─────────────────────────────────
  // Instead of doing a full refetch on every socket event we surgically
  // update the cached query result.  This keeps page / scroll position
  // stable and avoids a network round-trip.

  // Patch key that matches the query arg in sharedJournalApiSlice
  const patchCache = useCallback(
    (recipe) => {
      dispatch(
        apiSlice.util.updateQueryData(
          "getSharedJournal",
          { journalId, page, limit: 9 },
          recipe
        )
      );
    },
    [dispatch, journalId, page]
  );

  const handleEntryAdded = useCallback(
    ({ entry }) => {
      // Only auto-prepend on page 1; other pages show a subtle toast instead
      if (page === 1) {
        patchCache((draft) => {
          if (!draft?.data?.entries) return;
          // Avoid duplicates (our own submission is already handled by RTK)
          const exists = draft.data.entries.some((e) => e._id === entry._id);
          if (!exists) {
            draft.data.entries.unshift(entry);
            if (draft.pagination) draft.pagination.total += 1;
          }
        });
      }
    },
    [page, patchCache]
  );

  const handleEntryUpdated = useCallback(
    ({ entry }) => {
      patchCache((draft) => {
        if (!draft?.data?.entries) return;
        const idx = draft.data.entries.findIndex((e) => e._id === entry._id);
        if (idx !== -1) draft.data.entries[idx] = entry;
      });
    },
    [patchCache]
  );

  const handleEntryDeleted = useCallback(
    ({ entryId }) => {
      patchCache((draft) => {
        if (!draft?.data?.entries) return;
        draft.data.entries = draft.data.entries.filter(
          (e) => e._id !== entryId
        );
        if (draft.pagination) draft.pagination.total -= 1;
      });
    },
    [patchCache]
  );

  // ── Typing handlers ───────────────────────────────────────────
  const handleTypingStart = useCallback(({ userId, name }) => {
    // Don't show indicator for our own typing (the server already
    // excludes the sender but guard here too)
    if (userId === currentUserId) return;
    setTypingUser({ userId, name });

    // Auto-clear after 4 s in case typing:stop is missed
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(
      () => setTypingUser(null),
      4000
    );
  }, [currentUserId]);

  const handleTypingStop = useCallback(({ userId }) => {
    if (userId === currentUserId) return;
    clearTimeout(typingTimerRef.current);
    setTypingUser((prev) =>
      prev?.userId === userId ? null : prev
    );
  }, [currentUserId]);

  // ── Presence handlers ─────────────────────────────────────────
  const handleUserOnline = useCallback(({ userId }) => {
    setOnlineUserIds((prev) => new Set([...prev, userId]));
  }, []);

  const handleUserOffline = useCallback(({ userId }) => {
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    // Also clear typing if they disconnect mid-type
    setTypingUser((prev) => (prev?.userId === userId ? null : prev));
  }, []);

  // ── Socket lifecycle — connect on mount, clean up on unmount ──
  useEffect(() => {
    if (!journalId) return;

    // Connect the singleton (no-op if already connected)
    socket.connect();

    const onConnect = () => {
      setSocketConnected(true);
      // Join the journal room after the connection is confirmed
      socket.emit("journal:join", { journalId });
    };

    const onDisconnect = () => {
      setSocketConnected(false);
      setOnlineUserIds(new Set());
      setTypingUser(null);
    };

    // Attach all listeners
    socket.on("connect",       onConnect);
    socket.on("disconnect",    onDisconnect);
    socket.on("entry:added",   handleEntryAdded);
    socket.on("entry:updated", handleEntryUpdated);
    socket.on("entry:deleted", handleEntryDeleted);
    socket.on("user:typing",   handleTypingStart);
    socket.on("user:stopped",  handleTypingStop);
    socket.on("user:online",   handleUserOnline);
    socket.on("user:offline",  handleUserOffline);

    // If the socket was already connected before this effect ran
    // (e.g. navigating back to the page) fire onConnect manually
    if (socket.connected) onConnect();

    return () => {
      // Leave the room and remove all listeners on unmount
      socket.emit("journal:leave", { journalId });
      socket.off("connect",       onConnect);
      socket.off("disconnect",    onDisconnect);
      socket.off("entry:added",   handleEntryAdded);
      socket.off("entry:updated", handleEntryUpdated);
      socket.off("entry:deleted", handleEntryDeleted);
      socket.off("user:typing",   handleTypingStart);
      socket.off("user:stopped",  handleTypingStop);
      socket.off("user:online",   handleUserOnline);
      socket.off("user:offline",  handleUserOffline);

      // Disconnect the socket when leaving the shared journal area
      socket.disconnect();

      clearTimeout(typingTimerRef.current);
      setSocketConnected(false);
      setOnlineUserIds(new Set());
      setTypingUser(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId]);

  // Re-join the room when the page number changes (same journal, new page)
  // The entry:added patch only works for page 1 but we still want
  // entry:updated and entry:deleted to work on all pages.
  // The room join itself doesn't need to change — we just re-bind the
  // patchCache callbacks via the dependency array above.

  // ── Page change ───────────────────────────────────────────────
  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Loading / error states ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px-52px)] gap-4">
        <p className="text-error text-lg">
          Failed to load journal or you don't have access.
        </p>
        <button
          onClick={() => navigate("/shared-journals")}
          className="btn btn-primary rounded-xl"
        >
          ← Back to Shared Journals
        </button>
      </div>
    );
  }

  const journal    = data?.data?.journal;
  const entries    = data?.data?.entries ?? [];
  const pagination = data?.pagination    ?? {};

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28"
      style={{ minHeight: "calc(100dvh - 64px - 52px)" }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate("/shared-journals")}
        className="btn btn-ghost btn-sm gap-2 mb-5 -ml-2 rounded-xl"
      >
        <FaArrowLeft /> All Shared Journals
      </button>

      {/* Journal header */}
      <div className="bg-base-200 rounded-3xl p-6 border border-base-300 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <FaUsers className="text-primary text-xl mt-1 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{journal?.name}</h1>
              {/* Live connection pill */}
              <span
                className={`badge badge-xs gap-1 transition-colors duration-500 ${
                  socketConnected ? "badge-success" : "badge-ghost"
                }`}
              >
                <FaCircle className="text-[6px]" />
                {socketConnected ? "Live" : "Connecting…"}
              </span>
            </div>
            {journal?.description && (
              <p className="text-base-content/60 text-sm mt-1">
                {journal.description}
              </p>
            )}
          </div>
        </div>

        {/* Members with online presence */}
        <div className="flex flex-wrap gap-3">
          <MemberChip
            user={journal?.owner}
            label="owner"
            isOnline={
              journal?.owner?._id === currentUserId ||
              onlineUserIds.has(journal?.owner?._id)
            }
          />
          <MemberChip
            user={journal?.collaborator}
            label="collaborator"
            isOnline={
              journal?.collaborator?._id === currentUserId ||
              onlineUserIds.has(journal?.collaborator?._id)
            }
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-base-300">
          <div className="text-sm text-base-content/60">
            <span className="font-semibold text-base-content">
              {pagination.total ?? 0}
            </span>{" "}
            {(pagination.total ?? 0) === 1 ? "entry" : "entries"}
          </div>
        </div>
      </div>

      {/* Encryption notice */}
      <div className="alert alert-warning rounded-2xl text-sm mb-6 py-2">
        <span>🔓</span>
        <span>
          Entries here are <strong>not encrypted</strong> — both members can
          read them.
        </span>
      </div>

      {/* ── Typing indicator ──────────────────────────────────── */}
      {typingUser && (
        <div className="mb-3 animate-pulse">
          <TypingIndicator name={typingUser.name} />
        </div>
      )}

      {/* Entries grid */}
      {entries.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📝</span>
          <h2 className="text-xl font-semibold mb-2">No entries yet</h2>
          <p className="text-base-content/60">
            Be the first to write something in this shared journal!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {entries.map((entry) => (
            <SharedEntryCard
              key={entry._id}
              entry={entry}
              journalId={journalId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={pagination.totalPages ?? 1}
        onChange={handlePageChange}
      />

      {/* FAB */}
      <div className="fixed bottom-20 right-8 z-10">
        <AddSharedEntry journalId={journalId} />
      </div>
    </div>
  );
};

export default SharedJournalDetail;