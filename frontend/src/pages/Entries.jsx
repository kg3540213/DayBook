// frontend/src/pages/Entries.jsx
//
// Option A change: useSelector reads state.user.encKey (was state.user.dataKey)

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useGetEntriesQuery } from "../redux/api/entriesApiSlice";
import EntryCard from "../components/entry/EntryCard";
import AddEntry from "../components/entry/AddEntry";
import Loader from "../components/Loader";
import { decryptText } from "../utils/crypto";
import { FaThumbtack } from "react-icons/fa";

const ENTRIES_PER_PAGE = 6;

const ActiveFilters = ({ search, mood, dateFrom, dateTo, tag, pinned, onClear }) => {
  const parts = [];
  if (search)   parts.push(`"${search}"`);
  if (mood)     parts.push(`mood: ${mood}`);
  if (dateFrom) parts.push(`from: ${dateFrom}`);
  if (dateTo)   parts.push(`to: ${dateTo}`);
  if (tag)      parts.push(`#${tag}`);
  if (pinned)   parts.push("📌 Pinned only");
  if (!parts.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-base-content/60">Filters:</span>
      {parts.map((p) => (
        <span key={p} className="badge badge-outline badge-sm">{p}</span>
      ))}
      <button onClick={onClear} className="btn btn-xs btn-ghost text-error">Clear all ✕</button>
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
      <div className="flex gap-1.5 mt-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button key={i} onClick={() => onPageChange(i + 1)}
            className={`rounded-full transition-all duration-200 ${i + 1 === page ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-base-content/20 hover:bg-base-content/40"}`}
          />
        ))}
      </div>
    </div>
  );
};

const stripHtml = (html) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const Entries = () => {
  const user    = useSelector((s) => s.user.data);
  // Option A: read encKey (was dataKey)
  const encKey  = useSelector((s) => s.user.encKey);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const searchText = searchParams.get("search")   ?? "";
  const mood       = searchParams.get("mood")     ?? "";
  const dateFrom   = searchParams.get("dateFrom") ?? "";
  const dateTo     = searchParams.get("dateTo")   ?? "";
  const tag        = searchParams.get("tag")      ?? "";
  const pinned     = searchParams.get("pinned") === "true";
  const page       = Math.max(1, parseInt(searchParams.get("page") || "1"));

  const isSearchActive = !!(searchText || mood || dateFrom || dateTo || tag || pinned);

  const { data: allEntriesData, isLoading } = useGetEntriesQuery();
  const allEntries = allEntriesData?.data ?? [];

  const popularTags = useMemo(() => {
    const counts = {};
    allEntries.forEach((e) => (e.tags ?? []).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, [allEntries]);

  const allFilteredEntries = useMemo(() => {
    if (isLoading) return [];
    let base = [...allEntries];

    if (mood)   base = base.filter((e) => e.mood === mood);
    if (pinned) base = base.filter((e) => e.isPinned);
    if (tag)    base = base.filter((e) => (e.tags ?? []).includes(tag));

    if (dateFrom || dateTo) {
      const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      if (toDate) toDate.setUTCHours(23, 59, 59, 999);
      const toMs = toDate ? toDate.getTime() : null;
      base = base.filter((e) => {
        const entryMs = new Date(e.date).getTime();
        if (fromMs !== null && entryMs < fromMs) return false;
        if (toMs   !== null && entryMs > toMs)   return false;
        return true;
      });
    }

    if (searchText.trim()) {
      const needle = searchText.trim().toLowerCase();
      base = base.filter((entry) => {
        if (entry.title.toLowerCase().includes(needle)) return true;
        // Decrypt content to search in plaintext
        const plain = stripHtml(decryptText(entry.content, encKey));
        return plain.toLowerCase().includes(needle);
      });
    }

    return base.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });
  }, [isLoading, allEntries, mood, pinned, tag, dateFrom, dateTo, searchText, encKey]);

  const totalEntries = allFilteredEntries.length;
  const totalPages   = Math.max(1, Math.ceil(totalEntries / ENTRIES_PER_PAGE));
  const safePage     = Math.min(page, totalPages);
  const pageEntries  = allFilteredEntries.slice(
    (safePage - 1) * ENTRIES_PER_PAGE,
    safePage * ENTRIES_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.set("page", "1");
    setSearchParams(p);
  };

  const handleClearFilters = () => navigate("/entries");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: "calc(100dvh - 64px - 52px)" }}>
        <Loader />
      </div>
    );
  }

  if (allFilteredEntries.length === 0) {
    return (
      <div className="relative text-center mt-10 mx-7 pb-24" style={{ minHeight: "calc(100dvh - 64px - 52px)" }}>
        {isSearchActive ? (
          <>
            <ActiveFilters search={searchText} mood={mood} dateFrom={dateFrom} dateTo={dateTo} tag={tag} pinned={pinned} onClear={handleClearFilters} />
            <p className="text-2xl font-semibold mb-2">No entries match your filters.</p>
            <p className="text-lg">Try adjusting your search or clearing the filters.</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold mb-2">Welcome, {user.data.firstName}</p>
            <p className="text-lg mb-2">You haven&apos;t added any entries yet.</p>
            <p className="text-lg">Start your journey by clicking the &apos;+&apos; button below!</p>
          </>
        )}
        <div className="fixed bottom-20 right-8 z-10"><AddEntry /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24" style={{ minHeight: "calc(100dvh - 64px - 52px)" }}>
      <div className="fixed bottom-20 right-8 z-10"><AddEntry /></div>

      <div className="mt-6 px-7">
        {isSearchActive && (
          <ActiveFilters search={searchText} mood={mood} dateFrom={dateFrom} dateTo={dateTo} tag={tag} pinned={pinned} onClear={handleClearFilters} />
        )}

        {(popularTags.length > 0 || allEntries.some((e) => e.isPinned)) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {allEntries.some((e) => e.isPinned) && (
              <button
                onClick={() => setFilter("pinned", pinned ? "" : "true")}
                className={`btn btn-xs gap-1.5 rounded-xl ${pinned ? "btn-warning" : "btn-ghost border border-base-content/15"}`}
              >
                <FaThumbtack className="text-[10px]" /> Pinned
              </button>
            )}
            {popularTags.map((t) => (
              <button
                key={t}
                onClick={() => setFilter("tag", tag === t ? "" : t)}
                className={`btn btn-xs rounded-xl ${tag === t ? "btn-primary" : "btn-ghost border border-base-content/15"}`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        <p className="text-sm text-base-content/50 mb-2">
          {isSearchActive
            ? `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} found`
            : `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} total`}
          {totalPages > 1 && ` — page ${safePage} of ${totalPages}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-7 my-4">
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

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Entries;