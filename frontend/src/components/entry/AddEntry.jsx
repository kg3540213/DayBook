// frontend/src/components/entry/AddEntry.jsx
//
// Option A change: useSelector reads state.user.encKey (was state.user.dataKey)

import ModalLayout from "../ModalLayout";
import { useEffect, useRef, useState } from "react";
import { FaPlus, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { useAddEntryMutation, useAnalyzeMoodMutation, useGetEntriesQuery } from "../../redux/api/entriesApiSlice";
import { encryptText } from "../../utils/crypto.js";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import RichTextEditor from "./RichTextEditor";
import EntryTemplates from "./EntryTemplates";
import TagInput from "./TagInput";

const MOODS = [
  { value: "🙂", label: "🙂 Happy"   },
  { value: "😔", label: "😔 Sad"     },
  { value: "😡", label: "😡 Angry"   },
  { value: "😐", label: "😐 Neutral" },
];

const MOOD_THEMES = {
  "🙂": "from-emerald-500/10 to-transparent",
  "😔": "from-blue-500/10 to-transparent",
  "😡": "from-rose-500/10 to-transparent",
  "😐": "from-amber-500/10 to-transparent",
};

function AddEntry() {
  const [open, setOpen]                             = useState(false);
  const [addEntry,    { isLoading }]                = useAddEntryMutation();
  const [analyzeMood, { isLoading: isAnalyzing }]   = useAnalyzeMoodMutation();

  // Option A: read encKey (was dataKey)
  const encKey = useSelector((s) => s.user.encKey);

  const { data: allEntriesData } = useGetEntriesQuery();
  const existingTags = [...new Set((allEntriesData?.data ?? []).flatMap((e) => e.tags ?? []))];

  const [formData, setFormData] = useState({
    title: "", mood: "🙂", content: "",
    date: new Date().toISOString().slice(0, 10),
    tags: [], templateUsed: null,
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported]              = useState(
    () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window
  );
  const recognitionRef = useRef(null);

  useEffect(() => {
    setFormData({
      title: "", mood: "🙂", content: "",
      date: new Date().toISOString().slice(0, 10),
      tags: [], templateUsed: null,
    });
    setSelectedTemplate(null);
    stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleTemplateSelect = (tpl) => {
    setSelectedTemplate(tpl.id);
    setFormData((prev) => ({
      ...prev,
      content:      tpl.content,
      mood:         tpl.defaultMood  || prev.mood,
      title:        tpl.defaultTitle !== undefined ? tpl.defaultTitle : prev.title,
      templateUsed: tpl.id,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-IN"; r.continuous = true; r.interimResults = false;
    r.onstart  = () => setIsRecording(true);
    r.onend    = () => setIsRecording(false);
    r.onerror  = (ev) => { console.error("Speech error:", ev.error); setIsRecording(false); toast.error("Voice recognition failed."); };
    r.onresult = (ev) => {
      const transcript = Array.from(ev.results).map((res) => res[0].transcript).join(" ");
      setFormData((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content}<p>${transcript}</p>` : transcript,
      }));
    };
    recognitionRef.current = r;
    r.start();
  };

  const stopRecording  = () => { recognitionRef.current?.stop(); setIsRecording(false); };
  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  const handleAnalyzeMood = async () => {
    const plain = formData.content.replace(/<[^>]+>/g, " ").trim();
    if (!plain) { toast.warning("Write something first before detecting mood!"); return; }
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
    if (!encKey) {
      toast.error("Session expired. Please log out and log in again to save entries.");
      return;
    }
    const plainText = formData.content.replace(/<[^>]+>/g, " ").trim();
    if (!plainText) { toast.warning("Entry content cannot be empty."); return; }
    try {
      const encryptedContent = encryptText(formData.content, encKey);
      const response = await addEntry({
        ...formData,
        content:       encryptedContent,
        contentFormat: "html",
      }).unwrap();
      setOpen(false);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.data?.message || "An error occurred");
    }
  };

  const moodTheme = MOOD_THEMES[formData.mood] ?? MOOD_THEMES["😐"];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-circle w-16 h-16 bg-primary text-white hover:scale-105 animate-bounce hover:cursor-pointer"
      >
        <FaPlus className="text-3xl" />
      </button>

      <ModalLayout isOpen={open} close={() => setOpen(false)} wide>
        <div className={`card-body bg-gradient-to-b ${moodTheme} transition-all duration-500`}>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h2 className="card-title text-lg">New Entry</h2>
            <div className="flex gap-2 flex-wrap">
              <EntryTemplates onSelect={handleTemplateSelect} selected={selectedTemplate} />
              {voiceSupported && (
                <button
                  type="button" onClick={toggleRecording}
                  title={isRecording ? "Stop voice recording" : "Start voice-to-text"}
                  className={`btn btn-xs rounded-lg gap-1.5 ${isRecording ? "btn-error animate-pulse" : "btn-outline btn-error"}`}
                >
                  {isRecording
                    ? <><FaMicrophoneSlash className="text-[10px]" /> Stop</>
                    : <><FaMicrophone    className="text-[10px]" /> Voice</>
                  }
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text" name="title" value={formData.title} onChange={handleChange}
              className="input w-full rounded-xl" required maxLength={20}
              placeholder="Give your entry a title"
            />

            <div className="flex gap-3 flex-wrap">
              <input
                type="date" name="date" value={formData.date} onChange={handleChange}
                className="input flex-1 rounded-xl"
              />
              <select name="mood" value={formData.mood} onChange={handleChange} className="select rounded-xl">
                {MOODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium">
                  Your Entry <span className="text-error">*</span>
                </label>
                <button
                  type="button" onClick={handleAnalyzeMood} disabled={isAnalyzing}
                  className="btn btn-xs btn-outline btn-secondary rounded-lg"
                >
                  {isAnalyzing ? "Analyzing…" : "✨ AI Mood"}
                </button>
              </div>
              <RichTextEditor
                value={formData.content}
                onChange={(html) => setFormData((p) => ({ ...p, content: html }))}
                maxLength={10000}
                minHeight="180px"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Tags</label>
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData((p) => ({ ...p, tags }))}
                suggestions={existingTags}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full rounded-xl mt-1" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save Entry"}
            </button>
          </form>
        </div>
      </ModalLayout>
    </>
  );
}

export default AddEntry;