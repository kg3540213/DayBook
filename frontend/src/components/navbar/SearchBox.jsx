import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaSearch, FaTimes, FaKeyboard } from "react-icons/fa";

const MOOD_OPTIONS = [
  { value: "", label: "All moods" },
  { value: "🙂", label: "🙂 Happy" },
  { value: "😔", label: "😔 Sad" },
  { value: "😡", label: "😡 Angry" },
  { value: "😐", label: "😐 Neutral" },
];

const SearchBox = ({ toggle, expanded = false }) => {
  const navigate = useNavigate();
  const user = useSelector((s) => s.user.data);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tag, setTag] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeModal = () => {
    setOpen(false);
  };

  const applySearch = () => {
    const params = new URLSearchParams();
    if (text.trim()) params.set("search", text.trim());
    if (mood) params.set("mood", mood);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (tag.trim()) params.set("tags", tag.trim().toLowerCase());
    params.set("page", "1");

    const path = params.toString() ? `/entries?${params.toString()}` : "/entries";
    navigate(path);
    closeModal();
    toggle?.();
  };

  const handleSubmit = (event) => {
    event?.preventDefault();
    applySearch();
  };

  const handleClear = () => {
    setText("");
    setMood("");
    setDateFrom("");
    setDateTo("");
    setTag("");
    navigate("/entries");
    closeModal();
    toggle?.();
  };

  if (!user) return null;

  if (expanded) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
        <div>
          <label className="label label-text text-xs">Keyword</label>
          <input
            ref={inputRef}
            className="input input-sm w-full bg-base-100"
            placeholder="Search title, tags, mood, or content…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label label-text text-xs">Tag</label>
          <input
            className="input input-sm w-full bg-base-100"
            placeholder="e.g. college, gratitude"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label label-text text-xs">Mood</label>
          <select
            className="select select-sm w-full bg-base-100"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          >
            {MOOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label label-text text-xs">From</label>
            <input
              type="date"
              className="input input-sm w-full bg-base-100"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="label label-text text-xs">To</label>
            <input
              type="date"
              className="input input-sm w-full bg-base-100"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <button type="submit" className="btn btn-primary btn-sm flex-1">
            Search
          </button>
          <button type="button" onClick={handleClear} className="btn btn-ghost btn-sm flex-1">
            Clear
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-base-100 border border-base-content/10 hover:border-primary/40 hover:bg-base-200 transition-all duration-200 cursor-pointer text-base-content/50 hover:text-base-content/80 min-w-[200px]"
      >
        <FaSearch className="text-xs shrink-0 group-hover:text-primary transition-colors duration-200" />
        <span className="text-sm flex-1 text-left">Search entries…</span>
        <span className="hidden lg:flex items-center gap-0.5">
          <kbd className="kbd kbd-xs opacity-50">⌘</kbd>
          <kbd className="kbd kbd-xs opacity-50">K</kbd>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-base-100 border border-base-content/10 shadow-2xl overflow-hidden" style={{ maxHeight: "80vh" }}>
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-base-content/8">
              <div className="text-sm font-semibold">Search Entries</div>
              <div className="flex-1" />
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-base-content/30">
                <FaKeyboard className="text-[10px]" />
                <kbd className="kbd kbd-xs">Esc</kbd> to close
              </span>
              <button type="button" onClick={closeModal} className="btn btn-ghost btn-xs btn-circle text-base-content/40">
                <FaTimes className="text-xs" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto px-4 pb-4">
              <div className="py-4">
                <div className="relative">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30 text-sm" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Search by title, tags, mood, or content…"
                    className="input w-full pl-10 rounded-xl bg-base-200 border-transparent focus:border-primary/40 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-base-content/50 font-medium">Tag</label>
                  <input
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. college"
                    className="input input-sm rounded-xl bg-base-200 border-transparent focus:border-primary/40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-base-content/50 font-medium">Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="select select-sm rounded-xl bg-base-200 border-transparent"
                  >
                    {MOOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-base-content/50 font-medium">From date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="input input-sm rounded-xl bg-base-200 border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-base-content/50 font-medium">To date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="input input-sm rounded-xl bg-base-200 border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm flex-1 rounded-xl">
                  Search
                </button>
                <button type="button" onClick={handleClear} className="btn btn-ghost btn-sm rounded-xl flex-1">
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBox;
