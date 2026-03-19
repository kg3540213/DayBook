import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Mood options — must match the backend VALID_MOODS list exactly
const MOOD_OPTIONS = [
  { value: "",   label: "All moods" },
  { value: "🙂", label: "🙂 Happy"  },
  { value: "😔", label: "😔 Sad"    },
  { value: "😡", label: "😡 Angry"  },
  { value: "😐", label: "😐 Neutral"},
];

// SearchBox renders in two modes:
//   compact  — single text input + Search button (navbar, default)
//   expanded — full panel with mood + date filters (sidebar drawer)
//
// The `expanded` prop switches between the two.
// `toggle` closes the mobile drawer when provided.
const SearchBox = ({ toggle, expanded = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialise from current URL so the fields are pre-filled on the
  // Entries page when the user opens the sidebar to refine filters.
  const [text,     setText]     = useState(searchParams.get("search")   ?? "");
  const [mood,     setMood]     = useState(searchParams.get("mood")     ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo,   setDateTo]   = useState(searchParams.get("dateTo")   ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    // Only append params that have a value — keeps URLs clean
    if (text.trim())     params.set("search",   text.trim());
    if (mood)            params.set("mood",      mood);
    if (dateFrom)        params.set("dateFrom",  dateFrom);
    if (dateTo)          params.set("dateTo",    dateTo);
    // Always reset to page 1 when filters change
    params.set("page", "1");

    const hasAnyFilter = text.trim() || mood || dateFrom || dateTo;

    // Navigate to /entries with the new search params.
    // If nothing was filled in, just go to the plain entries list.
    navigate(hasAnyFilter ? `/entries?${params.toString()}` : "/entries");
    toggle && toggle();
  };

  const handleClear = () => {
    setText("");
    setMood("");
    setDateFrom("");
    setDateTo("");
    navigate("/entries");
    toggle && toggle();
  };

  // ── Compact mode (navbar) ────────────────────────────────────────
  if (!expanded) {
    return (
      <form onSubmit={handleSubmit}>
        <div className="join">
          <input
            name="search"
            className="input join-item bg-base-100"
            placeholder="Search Entries..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn join-item rounded-r-full bg-base-100"
          >
            Search
          </button>
        </div>
      </form>
    );
  }

  // ── Expanded mode (sidebar drawer) ──────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
      {/* Keyword */}
      <div>
        <label className="label label-text text-xs">Keyword</label>
        <input
          name="search"
          className="input input-sm w-full bg-base-100"
          placeholder="Search title or content…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Mood */}
      <div>
        <label className="label label-text text-xs">Mood</label>
        <select
          className="select select-sm w-full bg-base-100"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        >
          {MOOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date range */}
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

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button type="submit" className="btn btn-primary btn-sm flex-1">
          Search
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="btn btn-ghost btn-sm flex-1"
        >
          Clear
        </button>
      </div>
    </form>
  );
};

export default SearchBox;