// frontend/src/pages/Entries.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import {
  useGetEntriesQuery,
  useSaveSavedSearchMutation,
} from "../redux/api/entriesApiSlice";
import EntryCard from "../components/entry/EntryCard";
import AddEntry from "../components/entry/AddEntry";
import DailyPromptCard from "../components/entry/DailyPromptCard";
import Loader from "../components/Loader";
import { decryptText } from "../utils/crypto";
import {
  FaThumbtack,
  FaSearch,
  FaFolderPlus,
  FaTimes,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ENTRIES_PER_PAGE = 6;

const ActiveFilters = ({ search, mood, dateFrom, dateTo, tags, pinned, onClear }) => {
  const parts = [];
  if (search)   parts.push(`Keyword: "${search}"`);
  if (mood)     parts.push(`Mood: ${mood}`);
  if (dateFrom) parts.push(`From: ${dateFrom}`);
  if (dateTo)   parts.push(`To: ${dateTo}`);
  if (tags && tags.length > 0) {
    tags.forEach((t) => parts.push(`#${t}`));
  }
  if (pinned)   parts.push("📌 Pinned only");
  if (!parts.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 bg-base-200/50 p-3 rounded-2xl border border-base-content/5">
      <span className="text-xs font-semibold text-base-content/60">Active Filters:</span>
      {parts.map((p) => (
        <span key={p} className="badge badge-primary badge-sm py-1 px-2.5 rounded-xl font-medium shadow-sm">
          {p}
        </span>
      ))}
      <button onClick={onClear} className="btn btn-xs btn-ghost text-error rounded-xl hover:bg-error/10 font-bold ml-auto">
        Clear all ✕
      </button>
    </div>
  );
};

const Pagination = ({ page, totalPages, totalEntries, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from  = (page - 1) * ENTRIES_PER_PAGE + 1;
  const to    = Math.min(page * ENTRIES_PER_PAGE, totalEntries);
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end   = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <div className="flex flex-col items-center gap-3 my-8">
      <p className="text-sm text-base-content/50">
        Showing {from}–{to} of {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
      </p>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button className="btn btn-sm btn-ghost" disabled={page === 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
        {start > 1 && <><button className="btn btn-sm btn-ghost" onClick={() => onPageChange(1)}>1</button>{start > 2 && <span className="px-1 text-base-content/40">…</span>}</>}
        {pages.map((p) => <button key={p} className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`} onClick={() => onPageChange(p)}>{p}</button>)}
        {end < totalPages && <>{end < totalPages - 1 && <span className="px-1 text-base-content/40">…</span>}<button className="btn btn-sm btn-ghost" onClick={() => onPageChange(totalPages)}>{totalPages}</button></>}
        <button className="btn btn-sm btn-ghost" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
      </div>
    </div>
  );
};

const stripHtml = (html) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const MOOD_OPTIONS = [
  { value: "🙂", label: "🙂 Happy"   },
  { value: "😔", label: "😔 Sad"     },
  { value: "😡", label: "😡 Angry"   },
  { value: "😐", label: "😐 Neutral" },
];

const Entries = () => {
  const user = useSelector((s) => s.user.data);
  const encKey = useSelector((s) => s.user.encKey);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  // API Data
  const { data: allEntriesData, isLoading } = useGetEntriesQuery();
  const allEntries = allEntriesData?.data ?? [];

  const [saveSavedSearch, { isLoading: savingSearch }] = useSaveSavedSearchMutation();

  // Local Filter UI State
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [mood, setMood] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pinned, setPinned] = useState(false);

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const tagsDropdownRef = useRef(null);

  // Sync state with searchParams on load/change
  useEffect(() => {
    setSearchText(searchParams.get("search") ?? "");
    setMood(searchParams.get("mood") ?? "");
    setDateFrom(searchParams.get("dateFrom") ?? "");
    setDateTo(searchParams.get("dateTo") ?? "");
    setPinned(searchParams.get("pinned") === "true");

    const tagsParam = searchParams.get("tags") ?? "";
    setSelectedTags(tagsParam ? tagsParam.split(",") : []);
  }, [searchParams]);


  // Handle click outside tag dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(e.target)) {
        setIsTagsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync local filters to URL parameters
  const applyFiltersToUrl = (updates = {}) => {
    const nextParams = new URLSearchParams(searchParams);

    const merged = {
      search: searchText,
      mood,
      dateFrom,
      dateTo,
      pinned: pinned ? "true" : "",
      tags: selectedTags.join(","),
      page: "1",
      ...updates,
    };

    Object.entries(merged).forEach(([key, val]) => {
      if (val) {
        nextParams.set(key, String(val));
      } else {
        nextParams.delete(key);
      }
    });

    setSearchParams(nextParams);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    // Sync text to URL debounced/directly
    const nextParams = new URLSearchParams(searchParams);
    if (val.trim()) nextParams.set("search", val.trim());
    else nextParams.delete("search");
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  };

  const toggleTag = (t) => {
    let nextTags;
    if (selectedTags.includes(t)) {
      nextTags = selectedTags.filter((tag) => tag !== t);
    } else {
      nextTags = [...selectedTags, t];
    }
    setSelectedTags(nextTags);
    applyFiltersToUrl({ tags: nextTags.join(",") });
  };

  const handleMoodSelect = (val) => {
    const nextMood = mood === val ? "" : val;
    setMood(nextMood);
    applyFiltersToUrl({ mood: nextMood });
  };

  const handleDateChange = (type, val) => {
    if (type === "from") {
      setDateFrom(val);
      applyFiltersToUrl({ dateFrom: val });
    } else {
      setDateTo(val);
      applyFiltersToUrl({ dateTo: val });
    }
  };

  const handlePinnedToggle = () => {
    const nextPinned = !pinned;
    setPinned(nextPinned);
    applyFiltersToUrl({ pinned: nextPinned ? "true" : "" });
  };

  const handleClearFilters = () => {
    setSearchText("");
    setMood("");
    setDateFrom("");
    setDateTo("");
    setSelectedTags([]);
    setPinned(false);
    navigate("/entries");
  };

  const handleSaveSearchSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      await saveSavedSearch({
        name: folderName.trim(),
        searchText: searchText.trim(),
        mood,
        dateFrom,
        dateTo,
        tags: selectedTags,
      }).unwrap();

      toast.success(`Smart folder "${folderName.trim()}" saved successfully!`);
      setFolderName("");
      setIsSaveModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save smart folder.");
    }
  };

  // Compile active tags list from all entries
  const allUniqueTags = useMemo(() => {
    const set = new Set();
    allEntries.forEach((e) => (e.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allEntries]);

  // Compute final filtered entries list client-side
  const allFilteredEntries = useMemo(() => {
    if (isLoading) return [];

    // 1. Determine base entries order
    let base = [...allEntries];

    // 2. Filter by Mood
    if (mood) {
      base = base.filter((e) => e.mood === mood);
    }

    // 3. Filter by Pinned
    if (pinned) {
      base = base.filter((e) => e.isPinned);
    }

    // 4. Filter by Multi-select Tags (All selected tags must be included in the entry)
    if (selectedTags.length > 0) {
      base = base.filter((e) =>
        selectedTags.every((t) => (e.tags ?? []).includes(t))
      );
    }

    // 5. Filter by Date Range (Local Timezone Respected)
    if (dateFrom || dateTo) {
      const fromMs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
      const toDate = dateTo ? new Date(dateTo + "T23:59:59.999") : null;
      const toMs = toDate ? toDate.getTime() : null;

      base = base.filter((e) => {
        const entryMs = new Date(e.date).getTime();
        if (fromMs !== null && entryMs < fromMs) return false;
        if (toMs !== null && entryMs > toMs) return false;
        return true;
      });
    }

    // 6. Filter by Title/Content keyword when query is provided
    if (searchText.trim()) {
      const needle = searchText.trim().toLowerCase();
      base = base.filter((entry) => {
        if (entry.title.toLowerCase().includes(needle)) return true;
        if (entry.mood && entry.mood.includes(needle)) return true;
        if (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(needle))) return true;

        const plain = stripHtml(decryptText(entry.content, encKey));
        return plain.toLowerCase().includes(needle);
      });
    }

    // 7. Sort entries: pinned first, then by date descending
    base.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });

    return base;
  }, [isLoading, allEntries, searchText, mood, pinned, selectedTags, dateFrom, dateTo, encKey]);

  // Pagination calculation
  const totalEntries = allFilteredEntries.length;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const totalPages = Math.max(1, Math.ceil(totalEntries / ENTRIES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageEntries = allFilteredEntries.slice(
    (safePage - 1) * ENTRIES_PER_PAGE,
    safePage * ENTRIES_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    applyFiltersToUrl({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isSearchActive = !!(
    searchText ||
    mood ||
    dateFrom ||
    dateTo ||
    selectedTags.length > 0 ||
    pinned
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: "calc(100dvh - 64px - 52px)" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24 px-4 sm:px-7 max-w-7xl mx-auto" style={{ minHeight: "calc(100dvh - 64px - 52px)" }}>
      <div className="fixed bottom-20 right-8 z-10">
        <AddEntry />
      </div>

      <DailyPromptCard />

      {/* Modern Search Control Panel */}
      <div className="bg-base-200/40 border border-base-content/10 shadow-sm rounded-3xl p-5 mt-6 mb-6 flex flex-col gap-4">
        {/* Keyword Row */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative w-full md:flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30" />
            <input
              type="text"
              value={searchText}
              onChange={handleTextChange}
              placeholder="Search title, tags, mood, or entry content..."
              className="input w-full pl-11 pr-10 rounded-2xl bg-base-100 border-base-content/15 focus:border-primary/50 text-sm h-12"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => handleTextChange({ target: { value: "" } })}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
            {/* Save Current Search Button */}
            <button
              onClick={() => {
                setFolderName("");
                setIsSaveModalOpen(true);
              }}
              className="btn btn-sm h-11 px-4 btn-primary rounded-2xl gap-2 font-medium"
              title="Save current search config as smart folder"
            >
              <FaFolderPlus className="text-xs" />
              <span className="hidden sm:inline">Save Search</span>
            </button>

            {/* Expand Advanced Filters Toggle */}
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="btn btn-sm h-11 px-3 btn-ghost border border-base-content/10 rounded-2xl gap-1.5"
            >
              <FaFilter className="text-xs text-base-content/50" />
              <span className="hidden sm:inline">Filters</span>
              {isFiltersExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {(isFiltersExpanded || mood || dateFrom || dateTo || selectedTags.length > 0 || pinned) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-base-content/5">
            {/* Tag Selection Dropdown */}
            <div className="flex flex-col gap-1.5 relative" ref={tagsDropdownRef}>
              <label className="text-xs text-base-content/60 font-semibold tracking-wide">Filter by Tags</label>
              <button
                type="button"
                onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                className="btn btn-sm h-10 w-full rounded-xl bg-base-100 border border-base-content/15 hover:bg-base-100 flex justify-between font-normal text-xs"
              >
                <span className="truncate max-w-[85%]">
                  {selectedTags.length === 0
                    ? "Select tags..."
                    : selectedTags.map((t) => `#${t}`).join(", ")}
                </span>
                <FaChevronDown className="text-[9px] opacity-40 shrink-0" />
              </button>

              {isTagsDropdownOpen && (
                <div className="absolute top-16 left-0 z-30 w-full max-h-48 overflow-y-auto bg-base-100 border border-base-content/10 rounded-xl shadow-xl p-2 flex flex-col gap-1">
                  {allUniqueTags.length === 0 ? (
                    <span className="text-xs text-base-content/40 p-2 text-center">No tags in journal</span>
                  ) : (
                    allUniqueTags.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-base-200 cursor-pointer text-xs select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="checkbox checkbox-xs checkbox-primary"
                        />
                        <span className="truncate">#{tag}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Mood Emojis Row */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-base-content/60 font-semibold tracking-wide">Filter by Mood</label>
              <div className="flex gap-1.5 h-10 items-center">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMoodSelect(opt.value)}
                    className={`flex-1 h-9 rounded-xl text-base transition-all hover:scale-105 ${
                      mood === opt.value
                        ? "bg-primary text-primary-content shadow-sm ring-1 ring-primary/45"
                        : "bg-base-100 border border-base-content/15 hover:bg-base-200"
                    }`}
                    title={opt.label}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Pickers */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-base-content/60 font-semibold tracking-wide">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateChange("from", e.target.value)}
                className="input input-sm rounded-xl h-10 bg-base-100 border-base-content/15 text-xs w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-base-content/60 font-semibold tracking-wide">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateChange("to", e.target.value)}
                className="input input-sm rounded-xl h-10 bg-base-100 border-base-content/15 text-xs w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Active Filters and Summaries */}
      {isSearchActive && (
        <ActiveFilters
          search={searchText}
          mood={mood}
          dateFrom={dateFrom}
          dateTo={dateTo}
          tags={selectedTags}
          pinned={pinned}
          onClear={handleClearFilters}
        />
      )}

      {/* Pinned Entries Toggler Quick Badge */}
      {(allEntries.some((e) => e.isPinned) || pinned) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handlePinnedToggle}
            className={`btn btn-xs gap-1.5 rounded-xl border ${
              pinned ? "btn-warning border-transparent" : "btn-ghost border-base-content/15"
            }`}
          >
            <FaThumbtack className="text-[10px]" /> Pinned Entries
          </button>
        </div>
      )}

      {/* Search Stats */}
      <p className="text-xs text-base-content/50 mb-4 font-medium">
        {isSearchActive
          ? `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} found`
          : `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} total`}
        {totalPages > 1 && ` — page ${safePage} of ${totalPages}`}
      </p>

      {/* No Entries View */}
      {allFilteredEntries.length === 0 ? (
        <div className="relative text-center mt-12 pb-24 flex-1 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-2xl font-bold mb-2">No journal entries found</p>
          {isSearchActive ? (
            <p className="text-base-content/60 max-w-md">
              No entries match your search criteria. Try modifying your keywords, adjusting the dates, or clearing your active filters.
            </p>
          ) : (
            <p className="text-base-content/60 max-w-md">
              Your journal is empty. Click the &apos;+&apos; button below to write your first secure client-side encrypted journal entry!
            </p>
          )}
          {isSearchActive && (
            <button onClick={handleClearFilters} className="btn btn-sm btn-outline btn-primary rounded-xl mt-4">
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        /* Entries Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-4">
          {pageEntries.map((entry) => (
            <EntryCard
              key={entry._id}
              id={entry._id}
              date={entry.date}
              title={entry.title}
              mood={entry.mood}
              content={entry.content}
              updatedAt={entry.updatedAt}
              highlightText={searchText}
              isPinned={entry.isPinned ?? false}
              tags={entry.tags ?? []}
              contentFormat={entry.contentFormat ?? "plain"}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        onPageChange={handlePageChange}
      />

      {/* Save Search Modal Dialog */}
      {isSaveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsSaveModalOpen(false);
          }}
        >
          <div className="bg-base-100 border border-base-content/10 shadow-2xl rounded-3xl p-6 w-full max-w-md flex flex-col gap-4 animate-scaleUp">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FaFolderPlus className="text-primary text-sm" /> Save Search Config
            </h3>
            <p className="text-xs text-base-content/50">
              Create a smart folder to save your current search query and filters for instant access.
            </p>

            <form onSubmit={handleSaveSearchSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-base-content/75">Folder Name</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. Sad Campus Updates"
                  className="input input-sm h-10 w-full rounded-xl bg-base-200 border-transparent focus:border-primary/40 text-sm"
                />
              </div>

              {/* Filters Preview */}
              <div className="bg-base-200/50 rounded-2xl p-3.5 border border-base-content/5 mt-2 flex flex-col gap-2 text-xs">
                <span className="font-bold text-base-content/50">Saved Filters Preview:</span>
                {searchText && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-base-content/40 shrink-0">Query:</span>
                    <span className="italic truncate">&quot;{searchText}&quot;</span>
                  </div>
                )}
                {mood && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-base-content/40 shrink-0">Mood:</span>
                    <span>{mood}</span>
                  </div>
                )}
                {(dateFrom || dateTo) && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-base-content/40 shrink-0">Range:</span>
                    <span>
                      {dateFrom || "Any"} to {dateTo || "Any"}
                    </span>
                  </div>
                )}
                {selectedTags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <span className="font-semibold text-base-content/40 shrink-0">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map((t) => (
                        <span key={t} className="badge badge-xs badge-ghost">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!searchText && !mood && !dateFrom && !dateTo && selectedTags.length === 0 && (
                  <span className="text-base-content/30 italic">No active filters (matches all entries)</span>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={savingSearch || !folderName.trim()}
                  className="btn btn-sm h-10 btn-primary rounded-xl flex-1 font-semibold"
                >
                  {savingSearch ? "Saving..." : "Save Smart Folder"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="btn btn-sm h-10 btn-ghost rounded-xl text-base-content/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entries;