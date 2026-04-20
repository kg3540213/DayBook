// frontend/src/pages/CalendarView.jsx
//
// Fix: include content + contentFormat in calendarData grouping,
// decrypt on click using encKey, and render full entry text in DayModal.

import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { useGetEntriesQuery } from "../redux/api/entriesApiSlice";
import { decryptText } from "../utils/crypto";
import Loader from "../components/Loader";
import ModalLayout from "../components/ModalLayout";
import { FaChevronLeft, FaChevronRight, FaThumbtack } from "react-icons/fa";

const DAY_NAMES   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MOOD_DOT = {
  "🙂": "bg-emerald-500",
  "😔": "bg-blue-500",
  "😡": "bg-rose-500",
  "😐": "bg-amber-500",
};

// ── Render decrypted HTML or plain content ────────────────────────
const EntryContent = ({ content, contentFormat }) => {
  if (!content || content.trim() === "") {
    return (
      <p className="text-base-content/40 text-sm italic">No content.</p>
    );
  }

  if (contentFormat === "html") {
    return (
      <div
        className={`
          text-sm break-words leading-relaxed
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:first:mt-0
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_li]:my-0.5
          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50
          [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-base-content/70
          [&_b]:font-bold [&_strong]:font-bold
          [&_i]:italic [&_em]:italic
          [&_u]:underline
          [&_s]:line-through
          [&_p]:mb-1
        `}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">
      {content}
    </p>
  );
};

// ── Single entry expanded view inside the modal ───────────────────
const EntryDetail = ({ entry, encKey, isExpanded, onToggle, onNavigate }) => {
  // Decrypt lazily — only when the card is expanded
  const decrypted = useMemo(() => {
    if (!isExpanded) return null;
    if (!entry.content) return "";
    if (!encKey) return entry.content; // no key — show raw (won't be readable)
    return decryptText(entry.content, encKey) || entry.content;
  }, [isExpanded, entry.content, entry.contentFormat, encKey]); // eslint-disable-line

  const MOOD_BADGE = {
    "🙂": "badge-success",
    "😔": "badge-info",
    "😡": "badge-error",
    "😐": "badge-warning",
  };

  return (
    <li className="rounded-2xl border border-base-content/10 overflow-hidden">
      {/* ── Entry header (always visible) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex items-start gap-3 px-4 py-3 bg-base-200 hover:bg-base-300 transition-colors"
      >
        <span className="text-xl mt-0.5 shrink-0">{entry.mood}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight flex items-center gap-1.5 flex-wrap">
            {entry.isPinned && (
              <FaThumbtack className="text-warning text-[10px] shrink-0" />
            )}
            <span className="truncate">{entry.title}</span>
            <span
              className={`badge badge-xs ml-auto ${MOOD_BADGE[entry.mood] ?? "badge-ghost"}`}
            >
              {entry.mood}
            </span>
          </p>
          {entry.tags?.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {entry.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="badge badge-xs badge-ghost">
                  #{tag}
                </span>
              ))}
              {entry.tags.length > 4 && (
                <span className="badge badge-xs badge-ghost">
                  +{entry.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
        {/* expand / collapse chevron */}
        <span
          className={`text-base-content/40 text-xs shrink-0 mt-1 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* ── Expanded content ── */}
      {isExpanded && (
        <div className="px-4 py-3 bg-base-100 border-t border-base-content/8">
          {!encKey ? (
            <p className="text-warning text-xs">
              Session key not found. Please log out and log back in to read
              your entries.
            </p>
          ) : (
            <EntryContent
              content={decrypted}
              contentFormat={entry.contentFormat}
            />
          )}
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={() => onNavigate(entry.title)}
              className="btn btn-xs btn-outline btn-primary rounded-xl"
            >
              Open in Entries →
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

// ── Day detail modal ──────────────────────────────────────────────
const DayModal = ({ date, entries, open, close, onEntryNavigate, encKey }) => {
  const [expandedId, setExpandedId] = useState(null);

  // Reset expanded state when the modal opens for a new date
  useMemo(() => { setExpandedId(null); }, [date]); // eslint-disable-line

  if (!date) return null;

  const label = new Date(date + "T12:00:00").toLocaleDateString("default", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });

  const handleToggle = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <ModalLayout isOpen={open} close={close} wide>
      <div>
        {/* Header */}
        <h2 className="font-bold text-lg mb-1 pr-8">{label}</h2>
        <p className="text-xs text-base-content/50 mb-4">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} —
          click an entry to read it
        </p>

        {entries.length === 0 ? (
          <p className="text-base-content/50 text-sm text-center py-6">
            No entries on this day.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <EntryDetail
                key={entry._id}
                entry={entry}
                encKey={encKey}
                isExpanded={expandedId === entry._id}
                onToggle={() => handleToggle(entry._id)}
                onNavigate={(title) => {
                  close();
                  onEntryNavigate(title);
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </ModalLayout>
  );
};

// ── Calendar grid ─────────────────────────────────────────────────
const CalendarGrid = ({ year, month, calendarData, onDayClick }) => {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-base-content/40 py-1 select-none"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const entries   = calendarData[dateStr] ?? [];
          const isToday   = dateStr === today;
          const moodSet   = [...new Set(entries.map((e) => e.mood))].slice(0, 3);
          const hasPinned = entries.some((e) => e.isPinned);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDayClick(dateStr, entries)}
              className={`
                relative flex flex-col items-center justify-start
                min-h-[54px] p-1.5 rounded-xl text-sm transition-all select-none border
                ${isToday
                  ? "border-primary bg-primary/10 font-bold"
                  : entries.length > 0
                  ? "border-base-content/15 bg-base-200 hover:bg-base-300 cursor-pointer"
                  : "border-transparent hover:bg-base-200/50 cursor-pointer"
                }
              `}
            >
              <span className={isToday ? "text-primary" : "text-base-content/70"}>
                {day}
              </span>
              {moodSet.length > 0 && (
                <div className="flex gap-0.5 mt-1 justify-center flex-wrap">
                  {moodSet.map((mood) => (
                    <span
                      key={mood}
                      className={`w-1.5 h-1.5 rounded-full ${MOOD_DOT[mood] ?? "bg-base-content/30"}`}
                    />
                  ))}
                </div>
              )}
              {entries.length > 0 && (
                <span className="text-[9px] text-base-content/40 mt-0.5 leading-tight">
                  {entries.length}{" "}
                  {entries.length === 1 ? "entry" : "entries"}
                </span>
              )}
              {hasPinned && (
                <FaThumbtack className="absolute top-1 right-1 text-[8px] text-warning opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Calendar page ────────────────────────────────────────────
const CalendarView = () => {
  const user   = useSelector((s) => s.user.data);
  const encKey = useSelector((s) => s.user.encKey);   // ← for decryption
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [selectedDay,     setSelectedDay]     = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [modalOpen,       setModalOpen]       = useState(false);

  const { data: allEntriesData, isLoading, isError } = useGetEntriesQuery();
  const allEntries = allEntriesData?.data ?? [];

  // Group entries for the current viewed month.
  // FIX: now includes content + contentFormat so the modal can decrypt them.
  const calendarData = useMemo(() => {
    const grouped = {};
    allEntries.forEach((entry) => {
      const d      = new Date(entry.date);
      const entryY = d.getFullYear();
      const entryM = d.getMonth();
      if (entryY !== viewYear || entryM !== viewMonth) return;

      const key = d.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        _id:           entry._id,
        title:         entry.title,
        mood:          entry.mood,
        isPinned:      entry.isPinned      ?? false,
        tags:          entry.tags          ?? [],
        content:       entry.content       ?? "",   // ← encrypted ciphertext
        contentFormat: entry.contentFormat ?? "plain",
      });
    });
    return grouped;
  }, [allEntries, viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };
  const goToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const handleDayClick = (dateStr, entries) => {
    setSelectedDay(dateStr);
    setSelectedEntries(entries);
    setModalOpen(true);
  };

  const handleEntryNavigate = (title) => {
    navigate(`/entries?search=${encodeURIComponent(title)}`);
  };

  // Monthly stats
  const totalEntries = Object.values(calendarData).reduce((s, a) => s + a.length, 0);
  const activeDays   = Object.keys(calendarData).length;
  const moodCounts   = { "🙂": 0, "😔": 0, "😡": 0, "😐": 0 };
  Object.values(calendarData)
    .flat()
    .forEach((e) => { if (e.mood) moodCounts[e.mood]++; });
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8"
      style={{ minHeight: "calc(100dvh - 64px - 52px)" }}
    >
      {/* Header + nav */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-base-content/50 text-sm mt-0.5">
            Click any date with entries to read them
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn btn-sm btn-ghost rounded-xl">
            <FaChevronLeft />
          </button>
          <span className="font-semibold text-base min-w-[148px] text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="btn btn-sm btn-ghost rounded-xl">
            <FaChevronRight />
          </button>
          <button onClick={goToToday} className="btn btn-xs btn-outline rounded-xl">
            Today
          </button>
        </div>
      </div>

      {/* Monthly stats */}
      {totalEntries > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-base-200 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalEntries}</p>
            <p className="text-xs text-base-content/50 mt-0.5">Entries</p>
          </div>
          <div className="bg-base-200 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-secondary">{activeDays}</p>
            <p className="text-xs text-base-content/50 mt-0.5">Active days</p>
          </div>
          <div className="bg-base-200 rounded-2xl p-3 text-center">
            <p className="text-2xl">{dominantMood?.[0] ?? "—"}</p>
            <p className="text-xs text-base-content/50 mt-0.5">Top mood</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 flex-wrap mb-4">
        {Object.entries(MOOD_DOT).map(([mood, cls]) => (
          <div key={mood} className="flex items-center gap-1.5 text-xs text-base-content/50">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            {mood}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      ) : isError ? (
        <p className="text-error text-center py-10">Failed to load entries.</p>
      ) : (
        <div className="bg-base-200 rounded-3xl p-4 sm:p-5 border border-base-300">
          <CalendarGrid
            year={viewYear}
            month={viewMonth}
            calendarData={calendarData}
            onDayClick={handleDayClick}
          />
        </div>
      )}

      {!isLoading && !isError && totalEntries === 0 && (
        <p className="text-center text-base-content/40 text-sm mt-4">
          No entries this month. Start writing to see them here!
        </p>
      )}

      {/* Day modal — now receives encKey for decryption */}
      <DayModal
        date={selectedDay}
        entries={selectedEntries}
        open={modalOpen}
        close={() => setModalOpen(false)}
        onEntryNavigate={handleEntryNavigate}
        encKey={encKey}
      />
    </div>
  );
};

export default CalendarView;