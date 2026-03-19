import { useSelector } from "react-redux";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import {
  useGetEntriesQuery,
  useSearchEntryQuery,
} from "../redux/api/entriesApiSlice";
import EntryCard from "../components/entry/EntryCard";
import AddEntry from "../components/entry/AddEntry";
import Loader from "../components/Loader";
import { decryptText } from "../utils/crypto";

// ── Active-filter pill ────────────────────────────────────────────
// Shows a small summary of which filters are active and a "Clear all"
// button so the user always knows what they're looking at.
const ActiveFilters = ({ search, mood, dateFrom, dateTo, onClear }) => {
  const parts = [];
  if (search)   parts.push(`"${search}"`);
  if (mood)     parts.push(`mood: ${mood}`);
  if (dateFrom) parts.push(`from: ${dateFrom}`);
  if (dateTo)   parts.push(`to: ${dateTo}`);

  if (parts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 mx-7">
      <span className="text-sm text-base-content/60">Filters:</span>
      {parts.map((p) => (
        <span key={p} className="badge badge-outline badge-sm">{p}</span>
      ))}
      <button
        onClick={onClear}
        className="btn btn-xs btn-ghost text-error"
      >
        Clear all ✕
      </button>
    </div>
  );
};

// ── Pagination bar ────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Show at most 5 page buttons, centred around the current page
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end   = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex justify-center items-center gap-1 my-8">
      {/* Previous */}
      <button
        className="btn btn-sm btn-ghost"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        ←
      </button>

      {/* Leading ellipsis */}
      {start > 1 && (
        <>
          <button className="btn btn-sm btn-ghost" onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <span className="px-1 text-base-content/40">…</span>}
        </>
      )}

      {/* Page buttons */}
      {pages.map((p) => (
        <button
          key={p}
          className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {/* Trailing ellipsis */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-base-content/40">…</span>}
          <button className="btn btn-sm btn-ghost" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      {/* Next */}
      <button
        className="btn btn-sm btn-ghost"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        →
      </button>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────
const Entries = () => {
  const user         = useSelector((state) => state.user.data);
  const userPassword = useSelector((state) => state.user.userPassword);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate     = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  // Read all filter values from the URL
  const searchText = searchParams.get("search")   ?? "";
  const mood       = searchParams.get("mood")     ?? "";
  const dateFrom   = searchParams.get("dateFrom") ?? "";
  const dateTo     = searchParams.get("dateTo")   ?? "";
  const page       = Math.max(1, parseInt(searchParams.get("page") || "1"));

  // A search is "active" if any filter param is present
  const isSearchActive = searchText || mood || dateFrom || dateTo;

  // ── Data fetching ────────────────────────────────────────────────
  // getEntries is always fetched — we need the full decrypted list for
  // the client-side content keyword pass even when filters are active.
  // RTK Query caches it so there's no extra network request on repeat visits.
  const {
    data: allEntriesData,
    isLoading: isLoadingAll,
  } = useGetEntriesQuery();

  const {
    data: searchData,
    isLoading: isLoadingSearch,
  } = useSearchEntryQuery(
    { text: searchText, mood, dateFrom, dateTo, page, limit: 10 },
    // Only fire the search endpoint when a filter that the server handles
    // is active: mood, dateFrom, dateTo.  A keyword-only search is handled
    // entirely client-side so we skip the server call for that case.
    { skip: !mood && !dateFrom && !dateTo }
  );

  // Declared here (before the loading guard) because isLoading depends on it
  const hasServerFilter = !!(mood || dateFrom || dateTo);
  const isLoading = isLoadingAll || (hasServerFilter && isLoadingSearch);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  // ── Derive entries + pagination from whichever query ran ─────────
  // Three modes:
  //   A) No filters active     → show all entries from getEntries
  //   B) Server filters active → server narrows by mood/date, client
  //                              extends with content keyword matches
  //   C) Keyword only          → skip server search, full client pass

  const serverEntries = hasServerFilter
    ? (searchData?.data ?? [])
    : (allEntriesData?.data ?? []);

  // Pagination only makes sense for server-filtered results
  const pagination = hasServerFilter ? searchData?.pagination : null;

  // ── Client-side content filter ────────────────────────────────────
  // The server only searches `title` (content is AES-encrypted in DB).
  // When a keyword is present we do a second pass here: keep every entry
  // the server returned (title matched) PLUS any entry in the full list
  // whose *decrypted* content also contains the keyword.
  //
  // For mood/date-only filters (no keyword) this pass is a no-op and
  // `entries` === `serverEntries`.
  let entries = serverEntries;

  if (isSearchActive && searchText && userPassword) {
    const needle = searchText.trim().toLowerCase();
    const allEntries = allEntriesData?.data ?? [];

    if (!hasServerFilter) {
      // Keyword-only: scan the full list client-side
      entries = allEntries.filter((entry) => {
        // Always check title first (plaintext)
        if (entry.title.toLowerCase().includes(needle)) return true;
        // Then check decrypted content
        try {
          const plain = decryptText(entry.content, userPassword);
          return plain.toLowerCase().includes(needle);
        } catch {
          return false;
        }
      });
    } else {
      // Server already filtered by mood/date — extend with content matches
      // from the FULL list that weren't in the server results.
      // IMPORTANT: re-apply the same date range and mood guards here so
      // a content match from outside the selected window is not added back.
      const serverIds = new Set(serverEntries.map((e) => e._id));

      const fromMs  = dateFrom ? new Date(dateFrom).getTime() : null;
      const toDate  = dateTo   ? new Date(dateTo)             : null;
      if (toDate) toDate.setUTCHours(23, 59, 59, 999);
      const toMs    = toDate   ? toDate.getTime()             : null;

      const contentMatches = allEntries.filter((entry) => {
        if (serverIds.has(entry._id)) return false;

        // Re-apply date range (match backend's inclusive end-of-day logic)
        const entryMs = new Date(entry.date).getTime();
        if (fromMs !== null && entryMs < fromMs) return false;
        if (toMs   !== null && entryMs > toMs)   return false;

        // Re-apply mood
        if (mood && entry.mood !== mood) return false;

        // Decrypted content keyword check
        try {
          const plain = decryptText(entry.content, userPassword);
          return plain.toLowerCase().includes(needle);
        } catch {
          return false;
        }
      });
      entries = [...serverEntries, ...contentMatches];
    }
  }

  // ── Page-change handler — updates URL, does not cause a remount ──
  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Clear all filters ────────────────────────────────────────────
  const handleClearFilters = () => navigate("/entries");

  // ── Empty states ─────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <div className="text-center mt-10 mx-7 min-h-[calc(100dvh-64px-52px-40px)]">
        {isSearchActive ? (
          <>
            <ActiveFilters
              search={searchText}
              mood={mood}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onClear={handleClearFilters}
            />
            <p className="text-2xl font-semibold mb-2">
              No entries match your filters.
            </p>
            <p className="text-lg">
              Try adjusting your search or clearing the filters.
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold mb-2">
              Welcome, {user.data.firstName}
            </p>
            <p className="text-lg mb-2">
              It looks like you haven't added any entries yet.
            </p>
            <p className="text-lg">
              Start your journey by creating your very first entry by clicking
              the bottom '+' button!
            </p>
          </>
        )}
        <div className="fixed bottom-20 z-10 left-[calc(100vw-7rem)]">
          <AddEntry />
        </div>
      </div>
    );
  }

  // ── Normal render ─────────────────────────────────────────────────
  return (
    <div>
      <div className="fixed bottom-20 z-10 left-[calc(100vw-7rem)]">
        <AddEntry />
      </div>

      {/* Active filter badges */}
      {isSearchActive && (
        <div className="mt-6">
          <ActiveFilters
            search={searchText}
            mood={mood}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onClear={handleClearFilters}
          />
          {pagination && (
            <p className="text-sm text-base-content/50 mx-7 mb-2">
              {pagination.total} {pagination.total === 1 ? "entry" : "entries"} found
              {pagination.totalPages > 1 && ` — page ${pagination.page} of ${pagination.totalPages}`}
            </p>
          )}
        </div>
      )}

      {/* Entry grid */}
      <div className="flex flex-wrap gap-10 justify-center my-6 min-h-[calc(100dvh-64px-52px-80px)] mx-7">
        {entries.map((entry) => (
          <EntryCard
            key={entry._id}
            id={entry._id}
            date={entry.date}
            title={entry.title}
            mood={entry.mood}
            content={entry.content}
            updatedAt={entry.updatedAt}
            highlightText={searchText}
          />
        ))}
      </div>

      {/* Pagination — only shown during a filtered search */}
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default Entries;