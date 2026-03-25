import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const MOOD_OPTIONS = [
  { value: "",   label: "All moods" },
  { value: "🙂", label: "🙂 Happy"  },
  { value: "😔", label: "😔 Sad"    },
  { value: "😡", label: "😡 Angry"  },
  { value: "😐", label: "😐 Neutral"},
];

const SearchBox = ({ toggle, expanded = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [text,     setText]     = useState(searchParams.get("search")   ?? "");
  const [mood,     setMood]     = useState(searchParams.get("mood")     ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo,   setDateTo]   = useState(searchParams.get("dateTo")   ?? "");
  const [tag,      setTag]      = useState(searchParams.get("tag")      ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (text.trim())    params.set("search",   text.trim());
    if (mood)           params.set("mood",      mood);
    if (dateFrom)       params.set("dateFrom",  dateFrom);
    if (dateTo)         params.set("dateTo",    dateTo);
    if (tag.trim())     params.set("tag",       tag.trim().toLowerCase());
    params.set("page", "1");
    const hasAnyFilter = text.trim() || mood || dateFrom || dateTo || tag.trim();
    navigate(hasAnyFilter ? `/entries?${params.toString()}` : "/entries");
    toggle && toggle();
  };

  const handleClear = () => {
    setText(""); setMood(""); setDateFrom(""); setDateTo(""); setTag("");
    navigate("/entries");
    toggle && toggle();
  };

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
          <button type="submit" className="btn join-item rounded-r-full bg-base-100">
            Search
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
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
          {MOOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="label label-text text-xs">From</label>
          <input type="date" className="input input-sm w-full bg-base-100" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label label-text text-xs">To</label>
          <input type="date" className="input input-sm w-full bg-base-100" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <button type="submit" className="btn btn-primary btn-sm flex-1">Search</button>
        <button type="button" onClick={handleClear} className="btn btn-ghost btn-sm flex-1">Clear</button>
      </div>
    </form>
  );
};

export default SearchBox;