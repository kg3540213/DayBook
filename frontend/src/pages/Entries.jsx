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

// ── 6 entries per page, 3 per row (2 rows) ───────────────────────
const ENTRIES_PER_PAGE = 6;

// ── Active-filter pill ────────────────────────────────────────────
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
      <button onClick={onClear} className="btn btn-xs btn-ghost text-error">
        Clear all ✕
      </button>
    </div>
  );
};

// ── Pagination bar ────────────────────────────────────────────────
const Pagination = ({ page, totalPages, totalEntries, onPageChange }) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * ENTRIES_PER_PAGE + 1;
  const to   = Math.min(page * ENTRIES_PER_PAGE, totalEntries);

  const delta = 2;
  const start = Math.max(1, page - delta);
  const end   = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex flex-col items-center gap-3 my-8">
      <p className="text-sm text-base-content/50">
        Showing {from}–{to} of {totalEntries}{" "}
        {totalEntries === 1 ? "entry" : "entries"}
      </p>

      <div className="flex items-center gap-1">
        <button
          className="btn btn-sm btn-ghost"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Prev
        </button>

        {start > 1 && (
          <>
            <button className="btn btn-sm btn-ghost" onClick={() => onPageChange(1)}>1</button>
            {start > 2 && <span className="px-1 text-base-content/40">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-base-content/40">…</span>}
            <button className="btn btn-sm btn-ghost" onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}

        <button
          className="btn btn-sm btn-ghost"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>

      <div className="flex gap-1.5 mt-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={`rounded-full transition-all duration-200 ${
              i + 1 === page
                ? "w-5 h-2 bg-primary"
                : "w-2 h-2 bg-base-content/20 hover:bg-base-content/40"
            }`}
          />
        ))}
      </div>
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

  const searchText = searchParams.get("search")   ?? "";
  const mood       = searchParams.get("mood")     ?? "";
  const dateFrom   = searchParams.get("dateFrom") ?? "";
  const dateTo     = searchParams.get("dateTo")   ?? "";
  const page       = Math.max(1, parseInt(searchParams.get("page") || "1"));

  const isSearchActive = searchText || mood || dateFrom || dateTo;

  const { data: allEntriesData, isLoading: isLoadingAll } = useGetEntriesQuery();

  const { data: searchData, isLoading: isLoadingSearch } = useSearchEntryQuery(
    { text: searchText, mood, dateFrom, dateTo, page, limit: 10 },
    { skip: !mood && !dateFrom && !dateTo }
  );

  const hasServerFilter = !!(mood || dateFrom || dateTo);
  const isLoading = isLoadingAll || (hasServerFilter && isLoadingSearch);

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center"
        style={{ minHeight: "calc(100dvh - 64px - 52px)" }}
      >
        <Loader />
      </div>
    );
  }

  const serverEntries = hasServerFilter
    ? (searchData?.data ?? [])
    : (allEntriesData?.data ?? []);

  let allFilteredEntries = serverEntries;

  if (isSearchActive && searchText && userPassword) {
    const needle     = searchText.trim().toLowerCase();
    const allEntries = allEntriesData?.data ?? [];

    if (!hasServerFilter) {
      allFilteredEntries = allEntries.filter((entry) => {
        if (entry.title.toLowerCase().includes(needle)) return true;
        try {
          const plain = decryptText(entry.content, userPassword);
          return plain.toLowerCase().includes(needle);
        } catch { return false; }
      });
    } else {
      const serverIds = new Set(serverEntries.map((e) => e._id));
      const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
      const toDate = dateTo   ? new Date(dateTo)             : null;
      if (toDate) toDate.setUTCHours(23, 59, 59, 999);
      const toMs = toDate ? toDate.getTime() : null;

      const contentMatches = allEntries.filter((entry) => {
        if (serverIds.has(entry._id)) return false;
        const entryMs = new Date(entry.date).getTime();
        if (fromMs !== null && entryMs < fromMs) return false;
        if (toMs   !== null && entryMs > toMs)   return false;
        if (mood && entry.mood !== mood) return false;
        try {
          const plain = decryptText(entry.content, userPassword);
          return plain.toLowerCase().includes(needle);
        } catch { return false; }
      });
      allFilteredEntries = [...serverEntries, ...contentMatches];
    }
  }

  // ── Pagination math ───────────────────────────────────────────────
  const totalEntries = allFilteredEntries.length;
  const totalPages   = Math.max(1, Math.ceil(totalEntries / ENTRIES_PER_PAGE));
  const safePage     = Math.min(page, totalPages);
  const startIndex   = (safePage - 1) * ENTRIES_PER_PAGE;
  const entries      = allFilteredEntries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => navigate("/entries");

  // ── Empty state ───────────────────────────────────────────────────
  if (allFilteredEntries.length === 0) {
    return (
      <div
        className="relative text-center mt-10 mx-7 pb-24"
        style={{ minHeight: "calc(100dvh - 64px - 52px)" }}
      >
        {isSearchActive ? (
          <>
            <ActiveFilters
              search={searchText} mood={mood}
              dateFrom={dateFrom} dateTo={dateTo}
              onClear={handleClearFilters}
            />
            <p className="text-2xl font-semibold mb-2">No entries match your filters.</p>
            <p className="text-lg">Try adjusting your search or clearing the filters.</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold mb-2">Welcome, {user.data.firstName}</p>
            <p className="text-lg mb-2">It looks like you haven't added any entries yet.</p>
            <p className="text-lg">Start your journey by clicking the '+' button below!</p>
          </>
        )}
        {/* FAB — fixed to bottom-right, above footer (footer ~52px + gap) */}
        <div className="fixed bottom-20 right-8 z-10">
          <AddEntry />
        </div>
      </div>
    );
  }

  // ── Normal render ─────────────────────────────────────────────────
  return (
    /*
      min-h ensures the page body always fills at least the visible
      viewport (minus navbar ~64px and footer ~52px), so the footer
      never floats up when there are only 1–3 entries on screen.
      flex + flex-col lets the grid grow naturally while pb-24 keeps
      the last row clear of the fixed FAB button.
    */
    <div
      className="flex flex-col pb-24"
      style={{ minHeight: "calc(100dvh - 64px - 52px)" }}
    >
      {/* FAB — fixed bottom-right, safely above footer */}
      <div className="fixed bottom-20 right-8 z-10">
        <AddEntry />
      </div>

      <div className="mt-6">
        {isSearchActive && (
          <ActiveFilters
            search={searchText} mood={mood}
            dateFrom={dateFrom} dateTo={dateTo}
            onClear={handleClearFilters}
          />
        )}
        {totalEntries > 0 && (
          <p className="text-sm text-base-content/50 mx-7 mb-2">
            {isSearchActive
              ? `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} found`
              : `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} total`}
            {totalPages > 1 && ` — page ${safePage} of ${totalPages}`}
          </p>
        )}
      </div>

      {/* ── 3-column grid, 2 rows = 6 cards per page ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-7 my-6">
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