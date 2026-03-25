import ModalLayout from "../ModalLayout";
import { FaPencilAlt, FaThumbtack } from "react-icons/fa";
import { useEffect, useState } from "react";
import {
  useGetEntryQuery,
  useUpdateEntryMutation,
  useGetEntriesQuery,
} from "../../redux/api/entriesApiSlice";
import { encryptText, decryptText } from "../../utils/crypto.js";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";

const MOODS = [
  { value: "🙂", label: "🙂 Happy"   },
  { value: "😔", label: "😔 Sad"     },
  { value: "😡", label: "😡 Angry"   },
  { value: "😐", label: "😐 Neutral" },
];

const EditEntry = ({ id }) => {
  const [open, setOpen] = useState(false);

  const { data: getEntry, isLoading: entryLoading } = useGetEntryQuery(id, { skip: !open });
  const [updateEntry, { isLoading: entryUpdating }] = useUpdateEntryMutation();
  const { data: allEntriesData }                    = useGetEntriesQuery();
  const userPassword = useSelector((s) => s.user.userPassword);

  const isLoading = entryLoading || entryUpdating;

  // Tag suggestions derived from all cached entries — no extra endpoint
  const existingTags = [...new Set(
    (allEntriesData?.data ?? []).flatMap((e) => e.tags ?? [])
  )];

  const [formData, setFormData] = useState({
    title: "", mood: "", content: "", date: "",
    tags: [], isPinned: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Populate form when entry loads
  useEffect(() => {
    if (!getEntry) return;
    const entry = getEntry.data;
    let decryptedContent = entry?.content || "";

    if (userPassword && decryptedContent) {
      try {
        const result = decryptText(decryptedContent, userPassword);
        decryptedContent = result || decryptedContent;
      } catch {
        // leave raw — old unencrypted entry
      }
    }

    setFormData({
      title:    entry?.title    || "",
      mood:     entry?.mood     || "😐",
      content:  decryptedContent,
      date:     new Date(entry?.date).toISOString().slice(0, 10) || "",
      tags:     entry?.tags     || [],
      isPinned: entry?.isPinned || false,
    });
  }, [getEntry, userPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userPassword) {
      toast.error("Session expired. Please log out and log in again to edit entries.");
      return;
    }
    const plainText = formData.content.replace(/<[^>]+>/g, " ").trim();
    if (!plainText) { toast.warning("Entry content cannot be empty."); return; }
    try {
      const encryptedContent = encryptText(formData.content, userPassword);
      const response = await updateEntry({
        id,
        data: {
          ...formData,
          content:       encryptedContent,
          contentFormat: "html",
        },
      }).unwrap();
      setOpen(false);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.data?.message || "An error occurred");
    }
  };

  return (
    <>
      <p onClick={() => setOpen(true)} className="text-success hover:cursor-pointer">
        <FaPencilAlt />
      </p>

      <ModalLayout isOpen={open} close={() => setOpen(false)} wide>
        <div className="card-body">

          {/* ── Header with inline pin toggle ───────────────────── */}
          <div className="flex items-center justify-between mb-1">
            <h2 className="card-title text-lg">Edit Entry</h2>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, isPinned: !p.isPinned }))}
              title={formData.isPinned ? "Unpin this entry" : "Pin this entry"}
              className={`btn btn-xs gap-1.5 rounded-lg ${
                formData.isPinned ? "btn-warning" : "btn-ghost text-base-content/35"
              }`}
            >
              <FaThumbtack className={`text-[11px] transition-transform ${formData.isPinned ? "rotate-0" : "rotate-45"}`} />
              {formData.isPinned ? "Pinned" : "Pin"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Title */}
            <input
              type="text" name="title" value={formData.title} onChange={handleChange}
              className="input w-full rounded-xl" required maxLength={20} placeholder="Entry title"
            />

            {/* Date + Mood */}
            <div className="flex gap-3 flex-wrap">
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="input flex-1 rounded-xl" />
              <select name="mood" value={formData.mood} onChange={handleChange} className="select rounded-xl">
                {MOODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {/* Rich text editor — only mount once entry data has loaded */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Content</label>
              {!entryLoading && (
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => setFormData((p) => ({ ...p, content: html }))}
                  maxLength={10000}
                  minHeight="180px"
                />
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Tags</label>
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData((p) => ({ ...p, tags }))}
                suggestions={existingTags}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full rounded-xl mt-1" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </ModalLayout>
    </>
  );
};
export default EditEntry;