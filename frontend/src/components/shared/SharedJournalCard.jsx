import { useNavigate } from "react-router-dom";
import { useDeleteSharedJournalMutation } from "../../redux/api/sharedJournalApiSlice";
import ModalLayout from "../ModalLayout";
import { useState } from "react";
import { toast } from "react-toastify";
import { FaTrashAlt, FaSignOutAlt, FaUsers, FaClock } from "react-icons/fa";

// Tiny avatar pill
const MemberPill = ({ user, label }) => {
  if (!user) return null;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="flex items-center gap-1.5 text-xs text-base-content/60">
      {user.profilePhoto ? (
        <img
          src={user.profilePhoto}
          alt=""
          className="w-5 h-5 rounded-full object-cover"
        />
      ) : (
        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
          {initials}
        </span>
      )}
      <span>{user.firstName} {user.lastName}</span>
      <span className="text-base-content/30">({label})</span>
    </div>
  );
};

const SharedJournalCard = ({ journal, currentUserId }) => {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteSharedJournal, { isLoading }] = useDeleteSharedJournalMutation();

  const isOwner = journal.owner?._id === currentUserId;

  const statusColors = {
    active:   "badge-success",
    pending:  "badge-warning",
    declined: "badge-error",
  };

  const handleDeleteOrLeave = async () => {
    try {
      const res = await deleteSharedJournal(journal._id).unwrap();
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || "Action failed.");
    }
  };

  const formattedDate = new Date(journal.updatedAt).toLocaleDateString("default", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <>
      <div
        className="card bg-base-200 shadow-lg hover:shadow-xl rounded-3xl border border-base-300 hover:border-primary/30 transition-all cursor-pointer group"
        onClick={() =>
          journal.status === "active" &&
          navigate(`/shared-journals/${journal._id}`)
        }
      >
        <div className="card-body p-5">
          {/* Header row */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <FaUsers className="text-primary opacity-70" />
              <h2 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                {journal.name}
              </h2>
            </div>
            <span className={`badge badge-sm ${statusColors[journal.status] ?? "badge-ghost"}`}>
              {journal.status}
            </span>
          </div>

          {/* Description */}
          {journal.description && (
            <p className="text-sm text-base-content/60 mb-3 leading-relaxed">
              {journal.description}
            </p>
          )}

          {/* Members */}
          <div className="flex flex-col gap-1.5 mb-3">
            <MemberPill user={journal.owner}        label="owner" />
            {journal.collaborator ? (
              <MemberPill user={journal.collaborator} label="collaborator" />
            ) : (
              <p className="text-xs text-base-content/40 italic">
                Waiting for {journal.inviteEmail} to accept…
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-base-300">
            <div className="flex items-center gap-1 text-xs text-base-content/40">
              <FaClock className="text-[10px]" />
              <span>Updated {formattedDate}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              className={`btn btn-xs btn-ghost ${isOwner ? "text-error" : "text-warning"}`}
              title={isOwner ? "Delete journal" : "Leave journal"}
            >
              {isOwner ? <FaTrashAlt /> : <FaSignOutAlt />}
              {isOwner ? "Delete" : "Leave"}
            </button>
          </div>
        </div>
      </div>

      <ModalLayout isOpen={confirmOpen} close={() => setConfirmOpen(false)}>
        <h1 className="text-lg">
          {isOwner
            ? "Delete this shared journal and all its entries?"
            : "Leave this shared journal?"}
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          {isOwner
            ? "This action is permanent and cannot be undone."
            : "You will lose access. The owner can re-invite you later."}
        </p>
        <div className="modal-action">
          <button onClick={() => setConfirmOpen(false)} className="btn btn-success">Cancel</button>
          <button
            onClick={handleDeleteOrLeave}
            disabled={isLoading}
            className="btn btn-error"
          >
            {isLoading ? "Please wait…" : isOwner ? "Delete" : "Leave"}
          </button>
        </div>
      </ModalLayout>
    </>
  );
};

export default SharedJournalCard;