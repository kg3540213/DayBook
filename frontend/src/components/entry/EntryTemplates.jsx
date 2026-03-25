import { useState } from "react";
import { FaMagic, FaChevronDown, FaChevronUp } from "react-icons/fa";

// ── Template definitions ──────────────────────────────────────────
// content is HTML — supports rich text formatting
export const ENTRY_TEMPLATES = [
  {
    id: "gratitude",
    label: "🙏 Gratitude Journal",
    description: "Three things you're grateful for today",
    defaultTitle: "Grateful Today",
    defaultMood: "🙂",
    content: `<h3>Three things I'm grateful for today</h3>
<ol>
  <li></li>
  <li></li>
  <li></li>
</ol>
<h3>One person who made my day better</h3>
<p></p>
<h3>Something small I appreciated</h3>
<p></p>`,
  },
  {
    id: "daily-reflection",
    label: "🔍 Daily Reflection",
    description: "Morning intention + evening review",
    defaultTitle: "Daily Reflection",
    defaultMood: "😐",
    content: `<h3>Morning intention</h3>
<p>Today I want to focus on…</p>
<h3>What went well today?</h3>
<p></p>
<h3>What could have gone better?</h3>
<p></p>
<h3>One thing I learned</h3>
<p></p>
<h3>How am I feeling right now?</h3>
<p></p>`,
  },
  {
    id: "weekly-review",
    label: "📅 Weekly Review",
    description: "Wins, challenges, and goals for next week",
    defaultTitle: "Weekly Review",
    defaultMood: "😐",
    content: `<h3>This week's wins 🏆</h3>
<ul>
  <li></li>
  <li></li>
</ul>
<h3>Challenges I faced</h3>
<ul>
  <li></li>
  <li></li>
</ul>
<h3>What drained my energy?</h3>
<p></p>
<h3>What gave me energy?</h3>
<p></p>
<h3>Goals for next week</h3>
<ol>
  <li></li>
  <li></li>
  <li></li>
</ol>`,
  },
  {
    id: "problem-solving",
    label: "🧩 Problem Solving",
    description: "Break down a challenge you're facing",
    defaultTitle: "Working Through It",
    defaultMood: "😡",
    content: `<h3>The problem I'm facing</h3>
<p></p>
<h3>Why does this matter to me?</h3>
<p></p>
<h3>Possible approaches</h3>
<ol>
  <li></li>
  <li></li>
  <li></li>
</ol>
<h3>What would I tell a friend in this situation?</h3>
<p></p>
<h3>My next action step</h3>
<p></p>`,
  },
  {
    id: "free-write",
    label: "✍️ Free Write",
    description: "Blank canvas — just write",
    defaultTitle: "",
    defaultMood: "😐",
    content: "",
  },
  {
    id: "memory",
    label: "📸 Capture a Memory",
    description: "Document a moment you want to remember",
    defaultTitle: "A Moment to Remember",
    defaultMood: "🙂",
    content: `<h3>What happened?</h3>
<p></p>
<h3>Who was there?</h3>
<p></p>
<h3>How did it feel?</h3>
<p></p>
<h3>Why is this worth remembering?</h3>
<p></p>`,
  },
];

// ── Template selector panel ───────────────────────────────────────
// Props:
//   onSelect — (template) => void  called when user picks a template
//   selected — id of currently selected template (optional)
const EntryTemplates = ({ onSelect, selected }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (tpl) => {
    onSelect(tpl);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-xs btn-outline btn-secondary gap-1.5 rounded-lg"
      >
        <FaMagic className="text-[10px]" />
        Templates
        {open ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-base-100 border border-base-content/15 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-base-content/10">
            <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
              Choose a starting point
            </p>
          </div>
          <ul className="py-1">
            {ENTRY_TEMPLATES.map((tpl) => (
              <li key={tpl.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(tpl)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-base-200 transition-colors flex items-start gap-2.5 ${
                    selected === tpl.id ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight truncate">{tpl.label}</p>
                    <p className="text-xs text-base-content/50 mt-0.5 leading-tight">
                      {tpl.description}
                    </p>
                  </div>
                  {selected === tpl.id && (
                    <span className="text-primary text-xs mt-0.5">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EntryTemplates;