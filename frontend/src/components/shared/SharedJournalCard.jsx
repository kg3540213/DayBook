import { useNavigate } from "react-router-dom";
import { FaUsers, FaTrash } from "react-icons/fa";
import { useDeleteSharedJournalMutation } from "../../redux/api/sharedJournalApiSlice";
import { toast } from "react-toastify";

// ── Tiny member chip ──────────────────────────────────────────────
const MemberChip = ({ user, label }) => {
  if (!user) return null;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="flex items-center gap-1.5">
      {user.profilePhoto ? (
        <img
          src={user.profilePhoto}
          alt=""
          className="w-5 h-5 rounded-full object-cover"
        />
      ) : (
        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
      )}
      <div className="text-xs">
        <p className="font-medium leading-tight">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-base-content/40 capitalize leading-tight">{label}</p>
      </div>
    </div>
  );
};

const SharedJournalCard = ({ journal, currentUserId }) => {
  const navigate = useNavigate();
  const [deleteSharedJournal, { isLoading: deleting }] = useDeleteSharedJournalMutation();

  const isOwner = journal.owner._id === currentUserId;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this shared journal? This action cannot be undone.")) {
      try {
        await deleteSharedJournal(journal._id).unwrap();
        toast.success("Shared journal deleted successfully");
      } catch (error) {
        toast.error(error?.data?.message || "Failed to delete shared journal");
      }
    }
  };

  const handleNavigate = () => {
    navigate(`/shared-journals/${journal._id}`);
  };

  return (
    <div
      onClick={handleNavigate}
      className="card bg-base-200 shadow-md hover:shadow-xl hover:scale-102 transition-all duration-200 rounded-2xl cursor-pointer border border-base-300 relative overflow-hidden group"
    >
      {/* Delete button - only for owner */}
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          className="absolute top-3 right-3 btn btn-sm btn-ghost btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <FaTrash />
        </button>
      )}

      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <FaUsers className="text-primary text-lg mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="card-title text-base leading-tight truncate">{journal.name}</h3>
            {journal.description && (
              <p className="text-xs text-base-content/60 line-clamp-2 mt-1">
                {journal.description}
              </p>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="space-y-2 mb-3 pb-3 border-b border-base-300">
          <MemberChip user={journal.owner} label="Owner" />
          {journal.collaborator && (
            <MemberChip user={journal.collaborator} label="Collaborator" />
          )}
          {!journal.collaborator && journal.status === "pending" && (
            <div className="text-xs text-warning font-medium">⏳ Waiting for acceptance</div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={`badge badge-sm ${
            journal.status === "active" ? "badge-success" : "badge-warning"
          }`}>
            {journal.status === "active" ? "Active" : "Pending"}
          </span>
          <span className="text-xs text-base-content/50">
            {new Date(journal.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SharedJournalCard;
