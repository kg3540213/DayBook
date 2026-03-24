import { useState } from "react";
import { useAddSharedEntryMutation } from "../../redux/api/sharedJournalApiSlice";
import { toast } from "react-toastify";
import ModalLayout from "../ModalLayout";
import { FaPlus } from "react-icons/fa";

const MOODS = [
  { value: "🙂", label: "🙂 Happy"   },
  { value: "😔", label: "😔 Sad"     },
  { value: "😡", label: "😡 Angry"   },
  { value: "😐", label: "😐 Neutral" },
];

const AddSharedEntry = ({ journalId }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title:   "",
    mood:    "🙂",
    content: "",
    date:    new Date().toISOString().slice(0, 10),
  });

  const [addSharedEntry, { isLoading }] = useAddSharedEntryMutation();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleOpen = () => {
    setForm({
      title:   "",
      mood:    "🙂",
      content: "",
      date:    new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await addSharedEntry({ journalId, data: form }).unwrap();
      toast.success(res.message);
      setOpen(false);
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

      <ModalLayout isOpen={open} close={() => setOpen(false)}>
        <div className="card-body">
          <h2 className="card-title block text-center text-lg mb-1">
            Add to Shared Journal
          </h2>

          {/* Encryption notice */}
          <div className="alert alert-warning rounded-xl text-xs mb-3 py-2">
            <span>🔓</span>
            <span>This entry will <strong>not</strong> be encrypted — your collaborator can read it.</span>
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
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
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