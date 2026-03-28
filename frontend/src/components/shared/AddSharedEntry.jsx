// frontend/src/components/shared/AddSharedEntry.jsx
// Changes from original:
//   • import socket singleton
//   • emit typing:start on every keystroke (content field only)
//   • debounced typing:stop after 2 s of silence
//   • stop typing on modal close / successful submit
//   • everything else is identical to the original

import { useState, useRef, useCallback } from "react";
import { useAddSharedEntryMutation } from "../../redux/api/sharedJournalApiSlice";
import { toast } from "react-toastify";
import ModalLayout from "../ModalLayout";
import { FaPlus } from "react-icons/fa";
import socket from "../../utils/socket";         // NEW

const MOODS = [
  { value: "🙂", label: "🙂 Happy"   },
  { value: "😔", label: "😔 Sad"     },
  { value: "😡", label: "😡 Angry"   },
  { value: "😐", label: "😐 Neutral" },
];

const TYPING_DEBOUNCE_MS = 2000; // stop event fires 2 s after last keystroke

const AddSharedEntry = ({ journalId }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title:   "",
    mood:    "🙂",
    content: "",
    date:    new Date().toISOString().slice(0, 10),
  });

  const [addSharedEntry, { isLoading }] = useAddSharedEntryMutation();

  // ── Typing indicator refs ─────────────────────────────────────
  // isTypingRef tracks whether we've already sent typing:start so we
  // don't spam the server with identical events on every keystroke.
  const isTypingRef   = useRef(false);
  const stopTimerRef  = useRef(null);

  // ── Emit typing:stop and reset state ─────────────────────────
  const emitStop = useCallback(() => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    socket.emit("typing:stop", { journalId });
  }, [journalId]);

  // ── Called on every content keystroke ─────────────────────────
  const handleContentChange = useCallback(
    (e) => {
      setForm((p) => ({ ...p, content: e.target.value }));

      // Emit typing:start only on the first keystroke of a burst
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socket.emit("typing:start", { journalId });
      }

      // Reset the debounce timer
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(emitStop, TYPING_DEBOUNCE_MS);
    },
    [journalId, emitStop]
  );

  // ── General field change (non-content fields) ─────────────────
  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ── Reset form + stop any in-flight typing state ──────────────
  const resetForm = () => {
    setForm({
      title:   "",
      mood:    "🙂",
      content: "",
      date:    new Date().toISOString().slice(0, 10),
    });
    clearTimeout(stopTimerRef.current);
    emitStop();
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Stop typing indicator before the entry lands on the other screen
    clearTimeout(stopTimerRef.current);
    emitStop();

    try {
      const res = await addSharedEntry({ journalId, data: form }).unwrap();
      toast.success(res.message);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add entry.");
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="btn btn-circle w-14 h-14 bg-primary text-white hover:scale-105 animate-bounce"
      >
        <FaPlus className="text-2xl" />
      </button>

      <ModalLayout isOpen={open} close={handleClose}>
        <div className="card-body">
          <h2 className="card-title block text-center text-lg mb-1">
            Add to Shared Journal
          </h2>

          {/* Encryption notice */}
          <div className="alert alert-warning rounded-xl text-xs mb-3 py-2">
            <span>🔓</span>
            <span>
              This entry will <strong>not</strong> be encrypted — your
              collaborator can read it.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input w-full rounded-xl"
              placeholder="Entry title"
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
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Content — typing indicator emitted here */}
            <textarea
              name="content"
              value={form.content}
              onChange={handleContentChange}   // NEW handler
              className="textarea w-full rounded-xl h-44 resize-none"
              placeholder="Write about your day, thoughts, or experiences…"
              maxLength={1500}
              required
            />

            <button
              type="submit"
              className="btn btn-primary w-full rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? "Saving…" : "Add Entry"}
            </button>
          </form>
        </div>
      </ModalLayout>
    </>
  );
};

export default AddSharedEntry;