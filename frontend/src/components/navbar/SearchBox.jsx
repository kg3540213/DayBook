import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetEntriesQuery } from "../../redux/api/entriesApiSlice";
import { decryptText } from "../../utils/crypto";
import { FaMagic, FaTimes, FaSearch, FaKeyboard } from "react-icons/fa";

// ── Gemini config ─────────────────────────────────────────────────
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MAX_CHARS  = 500;
const BATCH_SIZE = 25;

const stripHtml = (html) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const buildPrompt = (query, entries) => {
  const list = entries
    .map((e, i) => {
      const plainText = (e.plain || e.plainContent || "").slice(0, MAX_CHARS);
      return `[${i}] "${e.title}": ${plainText}`;
    })
    .join("\n");
  return `You are a semantic search engine for a private journal app.
Query: "${query}"
Entries:
${list}
Return ONLY a JSON array sorted by relevance, most relevant first.
Each item: {"index":<int>,"score":<0.0-1.0>}
Include ALL entries. Irrelevant = 0.0. No markdown, no explanation.`;
};

const rankBatch = async (query, entries, apiKey) => {
  if (!entries || entries.length === 0) {
    return [];
  }
  
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not configured. Add it to your frontend .env file.");
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(query, entries) }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
      }),
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorMsg = err?.error?.message || `Gemini API error ${res.status}`;
      console.error("[rankBatch]", errorMsg, err);
      throw new Error(errorMsg);
    }
    
    const data = await res.json();
    
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn("[rankBatch] Unexpected Gemini response structure:", data);
      return entries.map((_, i) => ({ index: i, score: 0 }));
    }
    
    const raw = data.candidates[0].content.parts[0].text;
    const cleaned = raw.replace(/```json|```/g, "").trim();
    
    try {
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) {
        console.warn("[rankBatch] Gemini response is not an array:", parsed);
        return entries.map((_, i) => ({ index: i, score: 0 }));
      }
      return parsed;
    } catch (parseErr) {
      console.error("[rankBatch] Failed to parse JSON:", cleaned, parseErr);
      return entries.map((_, i) => ({ index: i, score: 0 }));
    }
  } catch (err) {
    console.error("[rankBatch] Search failed:", err);
    throw err;
  }
};

const MOOD_OPTIONS = [
  { value: "",   label: "All moods"  },
  { value: "🙂", label: "🙂 Happy"   },
  { value: "😔", label: "😔 Sad"     },
  { value: "😡", label: "😡 Angry"   },
  { value: "😐", label: "😐 Neutral" },
];

// ── Main SearchBox ────────────────────────────────────────────────
const SearchBox = ({ toggle, expanded = false }) => {
  const navigate     = useNavigate();
  const userPassword = useSelector((s) => s.user.userPassword);
  const user         = useSelector((s) => s.user.data);
  const apiKey       = import.meta.env.VITE_GEMINI_API_KEY;

  const { data: allEntriesData } = useGetEntriesQuery(undefined, { skip: !user });
  const allEntries = allEntriesData?.data ?? [];

  // ── Modal / tab state ─────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState("classic");

  // ── Classic filter state ──────────────────────────────────────
  const [text,     setText]     = useState("");
  const [mood,     setMood]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [tag,      setTag]      = useState("");

  // ── AI state ─────────────────────────────────────────────────
  // KEY FIX: store aiQuery in a ref as well as state.
  // useCallback captured stale state; a plain async function reading
  // from a ref always gets the latest value without needing deps.
  const [aiQuery,   setAiQuery]   = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState("");
  const aiQueryRef     = useRef("");   // always-fresh mirror of aiQuery
  const allEntriesRef  = useRef([]);   // always-fresh mirror of allEntries
  const userPasswordRef = useRef(null);

  const inputRef   = useRef(null);
  const aiInputRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { aiQueryRef.current      = aiQuery;      }, [aiQuery]);
  useEffect(() => { allEntriesRef.current   = allEntries;   }, [allEntries]);
  useEffect(() => { userPasswordRef.current = userPassword; }, [userPassword]);

  // Focus on open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      (tab === "ai" ? aiInputRef : inputRef).current?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [open, tab]);

  // Ctrl/Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const closeModal = () => {
    setOpen(false);
    setAiResults(null);
    setAiError("");
  };

  // ── Classic submit ────────────────────────────────────────────
  const handleClassicSubmit = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (text.trim())  params.set("search",  text.trim());
    if (mood)         params.set("mood",     mood);
    if (dateFrom)     params.set("dateFrom", dateFrom);
    if (dateTo)       params.set("dateTo",   dateTo);
    if (tag.trim())   params.set("tag",      tag.trim().toLowerCase());
    params.set("page", "1");
    const hasFilter = text.trim() || mood || dateFrom || dateTo || tag.trim();
    navigate(hasFilter ? `/entries?${params.toString()}` : "/entries");
    closeModal();
    toggle?.();
  };

  const handleClearClassic = () => {
    setText(""); setMood(""); setDateFrom(""); setDateTo(""); setTag("");
    navigate("/entries");
    closeModal();
    toggle?.();
  };

  // ── AI semantic search ────────────────────────────────────────
  // Plain async function (not useCallback) — reads from refs so it
  // always has the latest query/entries/password without stale closures.
  const runAiSearch = async () => {
    const q        = aiQueryRef.current.trim();
    const entries  = allEntriesRef.current;
    const password = userPasswordRef.current;

    if (!q) {
      setAiError("Please type a search query first.");
      return;
    }
    if (!apiKey) {
      setAiError("VITE_GEMINI_API_KEY is not configured. Add it to your frontend .env file.");
      return;
    }
    if (entries.length === 0) {
      setAiError("No journal entries found. Write some entries first!");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiResults(null);

    try {
      // Decrypt content in memory — never leaves the browser
      const plain = entries.map((e) => {
        let p = e.content || "";
        if (password && p) {
          try {
            const d = decryptText(p, password);
            if (d) p = d;
          } catch (decryptErr) {
            console.warn("[runAiSearch] Decrypt failed for entry", e._id, decryptErr);
            /* legacy plain-text entry — use as-is */
          }
        }
        const plainContent = stripHtml(p);
        if (!plainContent.trim()) {
          console.warn("[runAiSearch] Entry has empty content:", e.title);
        }
        return { ...e, plain: plainContent };
      });

      // Batch and send to Gemini
      const batches = [];
      for (let i = 0; i < plain.length; i += BATCH_SIZE) {
        batches.push(plain.slice(i, i + BATCH_SIZE));
      }

      const batchResults = await Promise.all(
        batches.map((batch, bi) =>
          rankBatch(q, batch, apiKey).then((scores) =>
            scores.map((s) => ({
              globalIndex: bi * BATCH_SIZE + s.index,
              score: s.score,
            }))
          )
        )
      );

      const scoreMap = {};
      batchResults.flat().forEach(({ globalIndex, score }) => {
        scoreMap[globalIndex] = score;
      });

      const sorted = plain
        .map((e, i) => ({ ...e, _score: scoreMap[i] ?? 0 }))
        .sort((a, b) => b._score - a._score);

      // Always show top 10; also include extras above 0.15
      const top10  = sorted.slice(0, 10);
      const extras = sorted.slice(10).filter((e) => e._score > 0.15);
      setAiResults([...top10, ...extras]);

    } catch (err) {
      console.error("[runAiSearch] Error:", err);
      const msg = err?.message || err?.toString?.() || "Semantic search failed. Check your Gemini API key and network.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  // Navigate to entry by title (works with fixed Entries.jsx)
  const goToEntry = (title) => {
    navigate(`/entries?search=${encodeURIComponent(title)}&page=1`);
    closeModal();
    toggle?.();
  };

  // ── Only show search if authenticated ─────────────────────────
  if (!user) {
    return null;
  }

  // ── Sidebar expanded mode ─────────────────────────────────────
  if (expanded) {
    return (
      <form onSubmit={handleClassicSubmit} className="flex flex-col gap-3 mb-4">
        <div>
          <label className="label label-text text-xs">Keyword</label>
          <input className="input input-sm w-full bg-base-100" placeholder="Search title or content…"
            value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <label className="label label-text text-xs">Tag</label>
          <input className="input input-sm w-full bg-base-100" placeholder="e.g. college, gratitude"
            value={tag} onChange={(e) => setTag(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <label className="label label-text text-xs">Mood</label>
          <select className="select select-sm w-full bg-base-100" value={mood} onChange={(e) => setMood(e.target.value)}>
            {MOOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          <button type="button" onClick={handleClearClassic} className="btn btn-ghost btn-sm flex-1">Clear</button>
        </div>
      </form>
    );
  }

  // ── Navbar mode ───────────────────────────────────────────────
  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl
          bg-base-100 border border-base-content/10
          hover:border-primary/40 hover:bg-base-200
          transition-all duration-200 cursor-pointer
          text-base-content/50 hover:text-base-content/80
          min-w-[200px]"
      >
        <FaSearch className="text-xs shrink-0 group-hover:text-primary transition-colors duration-200" />
        <span className="text-sm flex-1 text-left">Search entries…</span>
        <span className="hidden lg:flex items-center gap-0.5">
          <kbd className="kbd kbd-xs opacity-50 group-hover:opacity-80 transition-opacity">⌘</kbd>
          <kbd className="kbd kbd-xs opacity-50 group-hover:opacity-80 transition-opacity">K</kbd>
        </span>
        <span className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-base-100 border border-base-content/10 shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-base-content/8">
              <div className="flex items-center gap-1 bg-base-200 rounded-xl p-1">
                <button type="button" onClick={() => setTab("classic")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    tab === "classic" ? "bg-base-100 text-base-content shadow-sm" : "text-base-content/50 hover:text-base-content/80"
                  }`}
                >
                  <FaSearch className="text-[10px]" /> Classic
                </button>
                <button type="button" onClick={() => setTab("ai")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    tab === "ai" ? "bg-primary text-primary-content shadow-sm" : "text-base-content/50 hover:text-base-content/80"
                  }`}
                >
                  <FaMagic className="text-[10px]" /> AI Search
                </button>
              </div>
              <div className="flex-1" />
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-base-content/30">
                <FaKeyboard className="text-[10px]" />
                <kbd className="kbd kbd-xs">Esc</kbd> to close
              </span>
              <button type="button" onClick={closeModal}
                className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content">
                <FaTimes className="text-xs" />
              </button>
            </div>

            {/* Classic tab */}
            {tab === "classic" && (
              <div className="flex flex-col overflow-y-auto">
                <div className="px-4 pt-4 pb-3">
                  <div className="relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30 text-sm" />
                    <input ref={inputRef} type="text" value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleClassicSubmit(); } }}
                      placeholder="Search by title or content…"
                      className="input w-full pl-10 rounded-xl bg-base-200 border-transparent focus:border-primary/40 text-sm"
                    />
                    {text && (
                      <button type="button" onClick={() => setText("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content">
                        <FaTimes className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-base-content/50 font-medium">Tag</label>
                    <input type="text" value={tag} onChange={(e) => setTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleClassicSubmit(); } }}
                      placeholder="e.g. college"
                      className="input input-sm rounded-xl bg-base-200 border-transparent focus:border-primary/40" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-base-content/50 font-medium">Mood</label>
                    <select value={mood} onChange={(e) => setMood(e.target.value)}
                      className="select select-sm rounded-xl bg-base-200 border-transparent focus:border-primary/40">
                      {MOOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-base-content/50 font-medium">From date</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      className="input input-sm rounded-xl bg-base-200 border-transparent focus:border-primary/40" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-base-content/50 font-medium">To date</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      className="input input-sm rounded-xl bg-base-200 border-transparent focus:border-primary/40" />
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2 border-t border-base-content/5 pt-3">
                  <button type="button" onClick={handleClassicSubmit}
                    className="btn btn-primary btn-sm flex-1 rounded-xl gap-1.5">
                    <FaSearch className="text-xs" /> Search
                  </button>
                  <button type="button" onClick={handleClearClassic}
                    className="btn btn-ghost btn-sm rounded-xl text-base-content/50">
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* AI tab */}
            {tab === "ai" && (
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="px-4 pt-4 pb-3">
                  {/* Input */}
                  <div className="flex gap-2 items-center bg-base-200 rounded-xl px-3.5 py-2.5">
                    <FaMagic className={`text-xs shrink-0 ${aiLoading ? "text-primary animate-pulse" : "text-primary/60"}`} />
                    <input
                      ref={aiInputRef}
                      type="text"
                      value={aiQuery}
                      onChange={(e) => {
                        setAiQuery(e.target.value);
                        aiQueryRef.current = e.target.value;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          runAiSearch();
                        }
                      }}
                      placeholder="Describe what you're looking for…"
                      className="flex-1 bg-transparent outline-none text-sm placeholder:text-base-content/30"
                    />
                    {aiQuery && !aiLoading && (
                      <button type="button"
                        onClick={() => { setAiQuery(""); aiQueryRef.current = ""; setAiResults(null); setAiError(""); }}
                        className="text-base-content/30 hover:text-base-content">
                        <FaTimes className="text-xs" />
                      </button>
                    )}
                  </div>

                  {/* Example chips */}
                  {!aiResults && !aiLoading && !aiError && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["days I felt stressed about exams", "happy memories with friends", "times I was proud of myself", "when I felt lonely"].map((ex) => (
                        <button key={ex} type="button"
                          onClick={() => { setAiQuery(ex); aiQueryRef.current = ex; }}
                          className="badge badge-ghost badge-sm hover:badge-primary cursor-pointer text-xs">
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="mt-2.5 text-[10px] text-base-content/30 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
                    Plaintext stays in your browser — never sent to the server
                  </p>
                </div>

                {/* Search button — disabled only while loading, NOT based on query length */}
                <div className="px-4 pb-3">
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); runAiSearch(); }}
                    className="btn btn-primary btn-sm w-full rounded-xl gap-2"
                  >
                    {aiLoading
                      ? <><span className="loading loading-spinner loading-xs" /> Gemini is reading your journal…</>
                      : <><FaMagic className="text-xs" /> Search with AI</>
                    }
                  </button>
                </div>

                {/* Error */}
                {aiError && (
                  <div className="mx-4 mb-3 alert alert-error rounded-xl py-2 text-xs">{aiError}</div>
                )}

                {/* Results */}
                {aiResults !== null && (
                  <div className="overflow-y-auto flex-1 px-2 pb-3">
                    {aiResults.length === 0 ? (
                      <p className="text-center text-base-content/40 text-sm py-8">No results. Try rephrasing your query.</p>
                    ) : (
                      <>
                        <p className="text-[10px] text-base-content/30 px-2 pb-2">
                          {aiResults.length} entries ranked by relevance — click to open
                        </p>
                        <ul className="flex flex-col gap-1">
                          {aiResults.map((entry) => {
                            const pct = Math.round((entry._score ?? 0) * 100);
                            const scoreColor = pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-base-content/20";
                            const date = new Date(entry.date).toLocaleDateString("default", { day: "numeric", month: "short", year: "numeric" });
                            return (
                              <li key={entry._id}>
                                <button type="button" onClick={() => goToEntry(entry.title)}
                                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-base-200 rounded-xl transition-colors group">
                                  <div className="flex flex-col items-center gap-1 shrink-0 w-8">
                                    <span className="text-xs font-bold text-base-content/60">{pct}%</span>
                                    <div className="w-1.5 h-8 bg-base-300 rounded-full overflow-hidden">
                                      <div className={`w-full rounded-full ${scoreColor}`}
                                        style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                                      <span>{entry.mood}</span><span>{entry.title}</span>
                                    </p>
                                    <p className="text-xs text-base-content/40 mt-0.5 truncate">
                                      {date}
                                      {(entry.tags ?? []).length > 0 && (
                                        <span className="ml-2">{entry.tags.slice(0, 2).map((t) => `#${t}`).join(" ")}</span>
                                      )}
                                    </p>
                                    {entry.plain && (
                                      <p className="text-xs text-base-content/40 mt-0.5 truncate">{entry.plain.slice(0, 80)}…</p>
                                    )}
                                  </div>
                                  <span className="text-base-content/20 group-hover:text-base-content/50 text-xs shrink-0">→</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchBox;