import { useState } from "react";
import { useCreateSharedJournalMutation } from "../../redux/api/sharedJournalApiSlice";
import { toast } from "react-toastify";
import ModalLayout from "../ModalLayout";
import { FaUsers } from "react-icons/fa";

const CreateSharedJournal = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name:        "",
    description: "",
    inviteEmail: "",
  });

  const [createSharedJournal, { isLoading }] = useCreateSharedJournalMutation();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createSharedJournal(form).unwrap();
      toast.success(res.message);
      setOpen(false);
      setForm({ name: "", description: "", inviteEmail: "" });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create shared journal.");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary gap-2 rounded-2xl"
      >
        <FaUsers />
        New Shared Journal
      </button>

      <ModalLayout isOpen={open} close={() => setOpen(false)}>
        <div className="card-body">
          <h2 className="card-title block text-center text-lg mb-1">
            Create Shared Journal
          </h2>
          <p className="text-center text-sm text-base-content/50 mb-4">
            Invite one LPU student to write together.
          </p>

          {/* Encryption warning */}
          <div className="alert alert-warning rounded-xl text-sm mb-4 py-2">
            <span>⚠️</span>
            <span>
              Shared journal entries are <strong>not encrypted</strong> — both
              collaborators can read them. Keep private thoughts in your
              personal journal.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Journal Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input w-full rounded-xl"
                placeholder="e.g. Our College Diary"
                maxLength={50}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Description{" "}
                <span className="text-base-content/40 text-xs">(optional)</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="textarea w-full rounded-xl resize-none h-20"
                placeholder="What's this journal about?"
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Invite Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                name="inviteEmail"
                value={form.inviteEmail}
                onChange={handleChange}
                className="input w-full rounded-xl"
                placeholder="friend@lpu.in"
                required
              />
              <p className="text-xs text-base-content/40 mt-1">
                Must be an @lpu.in address. They'll receive an email invite.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full rounded-xl mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="loading loading-spinner loading-xs" /> Sending invite…</>
              ) : (
                "Create & Send Invite"
              )}
            </button>
          </form>
        </div>
      </ModalLayout>
    </>
  );
};

export default CreateSharedJournal;