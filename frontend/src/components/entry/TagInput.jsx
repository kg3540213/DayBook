import { useState, useRef, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

// ── TagInput ──────────────────────────────────────────────────────
// Props:
//   tags        — string[]  current tags
//   onChange    — (tags: string[]) => void
//   suggestions — string[]  existing user tags for autocomplete
//   maxTags     — number    default 10
const TagInput = ({ tags = [], onChange, suggestions = [], maxTags = 10 }) => {
  const [input, setInput]         = useState("");
  const [focused, setFocused]     = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef(null);

  const normalise = (v) => v.trim().toLowerCase().replace(/[^a-z0-9\-_\u00C0-\u024F\s]/gi, "").slice(0, 30);

  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s) && s.includes(input.trim().toLowerCase()))
    .slice(0, 6);

  const addTag = (raw) => {
    const tag = normalise(raw);
    if (!tag) return;
    if (tags.includes(tag)) { setInput(""); return; }
    if (tags.length >= maxTags) return;
    onChange([...tags, tag]);
    setInput("");
    setHighlighted(-1);
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (highlighted >= 0 && filteredSuggestions[highlighted]) {
        addTag(filteredSuggestions[highlighted]);
      } else {
        addTag(input);
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filteredSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  // Mood-based tag colour
  const TAG_COLORS = [
    "badge-primary", "badge-secondary", "badge-accent",
    "badge-success", "badge-warning", "badge-info",
  ];
  const tagColor = (tag) => TAG_COLORS[Math.abs(tag.charCodeAt(0) * 3) % TAG_COLORS.length];

  return (
    <div className="relative">
      {/* Tag pills + input row */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex flex-wrap gap-1.5 items-center min-h-9 px-2.5 py-1.5 rounded-xl border cursor-text transition-colors ${
          focused
            ? "border-primary/60 bg-base-100"
            : "border-base-content/20 bg-base-100 hover:border-base-content/35"
        }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className={`badge badge-sm gap-1 ${tagColor(tag)} select-none`}
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="hover:opacity-70 transition-opacity"
            >
              <FaTimes className="text-[9px]" />
            </button>
          </span>
        ))}

        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setHighlighted(-1); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={tags.length === 0 ? "Add tags… (Enter or comma to add)" : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-base-content/30"
          />
        )}

        {/* Tag counter */}
        {tags.length > 0 && (
          <span className="ml-auto text-[10px] text-base-content/30 tabular-nums select-none">
            {tags.length}/{maxTags}
          </span>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {focused && (input.trim() || filteredSuggestions.length > 0) && (
        <div className="absolute left-0 top-full mt-1 z-40 w-full bg-base-100 border border-base-content/15 rounded-xl shadow-lg overflow-hidden">
          {filteredSuggestions.length > 0 ? (
            <ul>
              {filteredSuggestions.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={() => addTag(s)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base-200 transition-colors ${
                      i === highlighted ? "bg-base-200" : ""
                    }`}
                  >
                    <span className="text-base-content/50 mr-1">#</span>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          ) : input.trim() ? (
            <div className="px-3 py-2 text-xs text-base-content/40">
              Press <kbd className="kbd kbd-xs">Enter</kbd> to add "#{normalise(input)}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TagInput;