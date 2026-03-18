import ModalLayout from "../ModalLayout";
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useAddEntryMutation, useAnalyzeMoodMutation } from "../../redux/api/entriesApiSlice";
import { encryptText } from "../../utils/crypto.js";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const MOODS = [
  { value: "🙂", label: "🙂 Happy" },
  { value: "😔", label: "😔 Sad" },
  { value: "😡", label: "😡 Angry" },
  { value: "😐", label: "😐 Neutral" },
];

function AddEntry() {
  const [open, setOpen] = useState(false);
  const [addEntry, { isLoading }] = useAddEntryMutation();
  const [analyzeMood, { isLoading: isAnalyzing }] = useAnalyzeMoodMutation();
  const userPassword = useSelector((state) => state.user.userPassword);

  const [formData, setFormData] = useState({
    title: "",
    mood: "🙂",
    content: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setFormData({
      title: "",
      mood: "🙂",
      content: "",
      date: new Date().toISOString().slice(0, 10),
    });
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Calls Gemini via backend and auto-fills the mood select
  const handleAnalyzeMood = async () => {
    if (!formData.content.trim()) {
      toast.warning("Write something first before analyzing mood!");
      return;
    }
    try {
      const response = await analyzeMood(formData.content).unwrap();
      setFormData((prev) => ({ ...prev, mood: response.mood }));
      toast.success(`Mood detected: ${response.mood}`);
    } catch (error) {
      toast.error(error?.data?.message || "Mood analysis failed. Try again!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userPassword) {
      toast.error("Session expired. Please log out and log in again to save entries.");
      return;
    }

    try {
      const encryptedContent = encryptText(formData.content, userPassword);
      const response = await addEntry({
        ...formData,
        content: encryptedContent,
      }).unwrap();
      setOpen(false);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.data?.message || "An error occurred");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-circle w-16 h-16 bg-primary text-white hover:scale-105 animate-bounce hover:cursor-pointer"
      >
        <FaPlus className="text-3xl" />
      </button>

      <ModalLayout isOpen={open} close={() => setOpen(false)}>
        <div className="card-body">
          <h2 className="card-title block text-center text-lg mb-2">
            Add New Entry
          </h2>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title">
                Entry Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="input w-full rounded-lg my-3"
                required
                placeholder="Give your entry a title"
              />
            </div>

            <div className="flex gap-5 justify-center items-center">
              <div>
                <label htmlFor="date">
                  Select Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input rounded-lg my-3"
                />
              </div>

              <div>
                <label htmlFor="mood">
                  Your Mood <span className="text-red-500">*</span>
                </label>
                <select
                  name="mood"
                  id="mood"
                  value={formData.mood}
                  onChange={handleChange}
                  className="select rounded-lg my-3"
                >
                  {MOODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="content">
                  Describe Your Day <span className="text-red-500">*</span>
                </label>
                {/* AI Analyze button — only active when content is not empty */}
                <button
                  type="button"
                  onClick={handleAnalyzeMood}
                  disabled={isAnalyzing || !formData.content.trim()}
                  className="btn btn-xs btn-outline btn-secondary"
                >
                  {isAnalyzing ? "Analyzing..." : "✨ AI Detect Mood"}
                </button>
              </div>
              <textarea
                name="content"
                id="content"
                value={formData.content}
                onChange={handleChange}
                className="textarea w-full rounded-lg my-3 h-50"
                required
                placeholder="Write about your day, thoughts, or experiences"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full rounded-lg mt-3"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>
      </ModalLayout>
    </>
  );
}
export default AddEntry;