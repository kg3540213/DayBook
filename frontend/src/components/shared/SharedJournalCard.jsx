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

const SharedJournalCard = ({ journal, currentUserId, currentUserEmail }) => {
  const isPendingInvitee = 
    journal.status === "pending" && 
    journal.inviteEmail === currentUserEmail &&
    journal.owner._id !== currentUserId;

  // In the card body, show accept/decline if pending invitee
  if (isPendingInvitee) {
    return (
      // Card with accept/decline buttons instead of navigation
      <div className="card ...">
        {/* journal name, owner info */}
        <div className="flex gap-2 mt-3">
          <button onClick={handleAccept} className="btn btn-primary btn-sm flex-1">
            Accept
          </button>
          <button onClick={handleDecline} className="btn btn-ghost btn-sm text-error">
            Decline
          </button>
        </div>
      </div>
    );
  }
  // ... rest of card
};

export default SharedJournalCard;
