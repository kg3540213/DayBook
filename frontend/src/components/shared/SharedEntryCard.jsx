import { FaTrash, FaEdit } from "react-icons/fa";
import { useDeleteSharedEntryMutation, useUpdateSharedEntryMutation } from "../../redux/api/sharedJournalApiSlice";
import { toast } from "react-toastify";
import { useState } from "react";

// Strip HTML to plain text for card preview
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

// ── Mood → card accent colour ──────────────────────────────────────
const MOOD_THEME = {
  "🙂": { border: "border-l-emerald-500/60",  badge: "badge-success" },
  "😔": { border: "border-l-blue-500/60",     badge: "badge-info"    },
  "😡": { border: "border-l-rose-500/60",     badge: "badge-error"   },
  "😐": { border: "border-l-amber-500/60",    badge: "badge-warning" },
};

const SharedEntryCard = ({
  entry,
  journalId,
  currentUserId,
  onEntryUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editContent, setEditContent] = useState(entry.content);
  const [editMood, setEditMood] = useState(entry.mood || "😐");

  const [updateSharedEntry, { isLoading: updating }] = useUpdateSharedEntryMutation();
  const [deleteSharedEntry, { isLoading: deleting }] = useDeleteSharedEntryMutation();

  const isAuthor = entry.author._id === currentUserId;

  const plainContent = stripHtml(entry.content);
  const preview = plainContent.length > 240
    ? `${plainContent.slice(0, 240)}…`
    : plainContent;

  const formattedDate = new Date(entry.date).toLocaleDateString("default", {
    day: "numeric", month: "long", year: "numeric",
  });

  const theme = MOOD_THEME[entry.mood || "😐"] || MOOD_THEME["😐"];

  const handleUpdate = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    try {
      await updateSharedEntry({
        journalId,
        entryId: entry._id,
        data: {
          title: editTitle,
          content: editContent,
          mood: editMood,
        },
      }).unwrap();
      toast.success("Entry updated successfully");
      setIsEditing(false);
      onEntryUpdate?.();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update entry");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteSharedEntry({
          journalId,
          entryId: entry._id,
        }).unwrap();
        toast.success("Entry deleted successfully");
        onEntryUpdate?.();
      } catch (error) {
        toast.error(error?.data?.message || "Failed to delete entry");
      }
    }
  };

  if (isEditing) {
    return (
      <div className="card bg-base-200 shadow-md rounded-3xl border-l-4 border-primary p-4">
        <div className="space-y-3">
          <select
            value={editMood}
            onChange={(e) => setEditMood(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="🙂">🙂 Happy</option>
            <option value="😔">😔 Sad</option>
            <option value="😡">😡 Angry</option>
            <option value="😐">😐 Neutral</option>
          </select>

          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Entry title"
            maxLength={20}
            className="input input-bordered input-sm w-full"
          />

          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Entry content"
            maxLength={1500}
            className="textarea textarea-bordered textarea-sm w-full h-24"
          />

          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setIsEditing(false)}
              disabled={updating}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        card bg-base-200 shadow-md hover:shadow-xl rounded-3xl
        border-l-4 ${theme.border}
        transition-shadow duration-200
        relative flex flex-col h-full
      `}
    >
      {/* Header with date and actions */}
      <div className="flex justify-between items-start pt-4 px-4">
        <p className="text-xs text-base-content/50">{formattedDate}</p>
        {isAuthor && (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setIsEditing(true)}
              disabled={updating || deleting}
              title="Edit"
              className="text-base-content/50 hover:text-primary transition-colors text-sm"
            >
              <FaEdit />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || updating}
              title="Delete"
              className="text-base-content/50 hover:text-error transition-colors text-sm"
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>

      {/* Author info */}
      <div className="px-4 pt-2 pb-1">
        <p className="text-xs text-base-content/60">
          by {entry.author.firstName} {entry.author.lastName}
        </p>
      </div>

      {/* Body */}
      <div className="card-body p-4 pt-2 flex-1">
        <h2 className="card-title text-base leading-snug">
          <span className="mr-1">{entry.mood || "😐"}</span>
          {entry.title}
        </h2>
        <p className="text-sm break-words text-base-content/75 leading-relaxed">
          {preview}
        </p>
      </div>

      {/* Footer */}
      <div className="pb-4 px-4 border-t border-base-content/5 pt-2">
        <p className="text-xs text-base-content/40">
          Shared Entry • {new Date(entry.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default SharedEntryCard;
