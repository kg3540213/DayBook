import { useState } from "react";
import { useSelector } from "react-redux";
import {
  useDeleteSharedEntryMutation,
  useUpdateSharedEntryMutation,
} from "../../redux/api/sharedJournalApiSlice";
import ModalLayout from "../ModalLayout";
import { FaTrashAlt, FaPencilAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const MOODS = [
  { value: "🙂", label: "🙂 Happy"   },
  { value: "😔", label: "😔 Sad"     },
  { value: "😡", label: "😡 Angry"   },
  { value: "😐", label: "😐 Neutral" },
];

// ── Small author avatar ───────────────────────────────────────────
const Avatar = ({ author }) => {
  if (author?.profilePhoto) {
    return (
      <img
        src={author.profilePhoto}
        alt="avatar"
        className="w-7 h-7 rounded-full object-cover border border-primary/30"
      />
    );
  }
  const initials =
    `${author?.firstName?.[0] ?? ""}${author?.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <span className="w-7 h-7 rounded-full bg-secondary/20 text-secondary text-xs font-bold flex items-center justify-center border border-secondary/30 select-none">
      {initials}
    </span>
  );
};

// ── Read More modal ───────────────────────────────────────────────
const ReadMoreModal = ({ open, close, entry }) => (
  <ModalLayout isOpen={open} close={close}>
    <div>
      <div className="text-center card-title pb-2 block">
        <span>{entry.mood} </span>
        <span>{entry.title} </span>
        <span>{entry.mood}</span>
      </div>
      <div className="flex items-center gap-2 px-2 py-1 text-sm text-base-content/60">
        <Avatar author={entry.author} />
        <span>{entry.author?.firstName} {entry.author?.lastName}</span>
        <span>·</span>
        <span>{new Date(entry.date).toLocaleDateString("default", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
      <div className="card-body p-2 pt-1">
        <p className="break-words whitespace-pre-wrap">{entry.content}</p>
      </div>
    </div>
  </ModalLayout>
);

// ── Edit modal ────────────────────────────────────────────────────
const EditModal = ({ open, close, entry, journalId }) => {
  const [form, setForm] = useState({
    title:   entry.title,
    mood:    entry.mood,
    content: entry.content,
    date:    new Date(entry.date).toISOString().slice(0, 10),
  });
  const [updateSharedEntry, { isLoading }] = useUpdateSharedEntryMutation();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateSharedEntry({ entryId: entry._id, journalId, data: form }).unwrap();
      toast.success(res.message);
      close();
    } catch (err) {
      toast.error(err?.data?.message || "Update failed.");
    }
  };

  return (
    <ModalLayout isOpen={open} close={close}>
      <div className="card-body">
        <h2 className="card-title block text-center text-lg mb-2">Edit Entry</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="input w-full rounded-xl"
            placeholder="Title"
            maxLength={20}
            required
          />
          <div className="flex gap-3">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="input flex-1 rounded-xl"
            />
            <select
              name="mood"
              value={form.mood}
              onChange={handleChange}
              className="select rounded-xl"
            >
              {MOODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            className="textarea w-full rounded-xl h-40 resize-none"
            placeholder="Write about your day…"
            maxLength={1500}
            required
          />
          <button
            type="submit"
            className="btn btn-primary w-full rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </ModalLayout>
  );
};

// ── Main card ─────────────────────────────────────────────────────
const SharedEntryCard = ({ entry, journalId, currentUserId }) => {
  const [readOpen,   setReadOpen]   = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deleteSharedEntry, { isLoading: deleting }] = useDeleteSharedEntryMutation();

  const isAuthor = entry.author?._id === currentUserId;

  const formattedDate = new Date(entry.date).toLocaleDateString("default", {
    day: "numeric", month: "long", year: "numeric",
  });

  const preview =
    entry.content.length > 280
      ? `${entry.content.slice(0, 280)}…`
      : entry.content;

  const handleDelete = async () => {
    try {
      const res = await deleteSharedEntry({ entryId: entry._id, journalId }).unwrap();
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed.");
    }
  };

  return (
    <>
      <div className="card bg-base-200 shadow-lg hover:shadow-xl rounded-3xl transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-center pt-4 px-4">
          <div className="flex items-center gap-2 text-sm text-base-content/60">
            <Avatar author={entry.author} />
            <span className="font-medium text-base-content">
              {entry.author?.firstName} {entry.author?.lastName}
            </span>
          </div>
          {isAuthor && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="text-success hover:scale-110 transition-transform"
              >
                <FaPencilAlt />
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="text-error hover:scale-110 transition-transform"
              >
                <FaTrashAlt />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="card-body p-4 pt-2">
          <p className="text-xs text-base-content/50 mb-1">{formattedDate}</p>
          <h2 className="card-title text-base">
            {entry.mood} {entry.title}
          </h2>
          <p className="text-sm break-words text-base-content/80 leading-relaxed">
            {preview}
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setReadOpen(true)}
            className="btn btn-sm btn-outline btn-primary rounded-xl w-full"
          >
            Read More
          </button>
        </div>

        {/* Unencrypted badge */}
        <div className="absolute top-3 right-3 opacity-0">
          {/* hidden — visible only in full-page view */}
        </div>
      </div>

      <ReadMoreModal
        open={readOpen}
        close={() => setReadOpen(false)}
        entry={entry}
      />

      {editOpen && (
        <EditModal
          open={editOpen}
          close={() => setEditOpen(false)}
          entry={entry}
          journalId={journalId}
        />
      )}

      {/* Delete confirm */}
      <ModalLayout isOpen={deleteOpen} close={() => setDeleteOpen(false)}>
        <h1 className="text-lg">Delete this shared entry?</h1>
        <div className="modal-action">
          <button onClick={() => setDeleteOpen(false)} className="btn btn-success">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn btn-error">
            {deleting ? "Deleting…" : "Confirm"}
          </button>
        </div>
      </ModalLayout>
    </>
  );
};

export default SharedEntryCard;