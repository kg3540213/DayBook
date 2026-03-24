import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useGetSharedJournalQuery } from "../redux/api/sharedJournalApiSlice";
import Loader from "../components/Loader";
import SharedEntryCard from "../components/shared/SharedEntryCard";
import AddSharedEntry  from "../components/shared/AddSharedEntry";
import { FaArrowLeft, FaUsers } from "react-icons/fa";

// Tiny avatar
const MemberChip = ({ user, label }) => {
  if (!user) return null;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-1.5">
      {user.profilePhoto ? (
        <img src={user.profilePhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
      ) : (
        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
      )}
      <div className="text-xs">
        <p className="font-medium leading-tight">{user.firstName} {user.lastName}</p>
        <p className="text-base-content/40 capitalize">{label}</p>
      </div>
    </div>
  );
};

// Pagination bar
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

const SharedJournalDetail = () => {
  const user = useSelector((state) => state.user.data);
  if (!user) return <Navigate to="/login" replace />;

  const { journalId } = useParams();
  const navigate       = useNavigate();
  const currentUserId  = user.data._id;

  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetSharedJournalQuery(
    { journalId, page, limit: 9 },
    { skip: !journalId }
  );

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
        <p className="text-error text-lg">Failed to load journal or you don't have access.</p>
        <button onClick={() => navigate("/shared-journals")} className="btn btn-primary rounded-xl">
          ← Back to Shared Journals
        </button>
      </div>
    );
  }

  const journal    = data?.data?.journal;
  const entries    = data?.data?.entries ?? [];
  const pagination = data?.pagination ?? {};

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <div>
            <h1 className="text-2xl font-bold">{journal?.name}</h1>
            {journal?.description && (
              <p className="text-base-content/60 text-sm mt-1">{journal.description}</p>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-wrap gap-3">
          <MemberChip user={journal?.owner}        label="owner" />
          <MemberChip user={journal?.collaborator} label="collaborator" />
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-base-300">
          <div className="text-sm text-base-content/60">
            <span className="font-semibold text-base-content">{pagination.total ?? 0}</span>{" "}
            {(pagination.total ?? 0) === 1 ? "entry" : "entries"}
          </div>
        </div>
      </div>

      {/* Encryption notice */}
      <div className="alert alert-warning rounded-2xl text-sm mb-6 py-2">
        <span>🔓</span>
        <span>Entries here are <strong>not encrypted</strong> — both members can read them.</span>
      </div>

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