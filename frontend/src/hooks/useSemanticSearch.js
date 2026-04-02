// frontend/src/hooks/useSemanticSearch.js
import { useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { semanticSearch } from "../utils/semanticSearch";
import { decryptText } from "../utils/crypto";

// Debounce helper — prevents spamming Gemini on every keystroke
const useDebounce = (fn, delay) => {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay]
  );
};

// ── Hook ──────────────────────────────────────────────────────────
// Usage:
//   const { results, isSearching, error, search, clear } = useSemanticSearch(allEntries);
//
//   search("entries where I felt anxious about exams")
//   → sets results to semantically ranked entry array
//   → each entry has a ._score (0.0–1.0) you can show as a relevance badge
//
//   clear() → resets back to original allEntries order
export const useSemanticSearch = (allEntries = []) => {
  // BUG FIX: was pulling `userPassword` — now correctly uses `dataKey`
  const dataKey = useSelector((s) => s.user.dataKey);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const [results,     setResults]     = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error,       setError]       = useState(null);
  const [lastQuery,   setLastQuery]   = useState("");

  const runSearch = useCallback(
    async (query) => {
      const trimmed = query.trim();
      if (!trimmed) { setResults(null); setError(null); return; }
      if (trimmed === lastQuery && results !== null) return;

      setIsSearching(true);
      setError(null);

      try {
        const sorted = await semanticSearch({
          query: trimmed,
          entries: allEntries,
          decryptFn: decryptText,
          dataKey,   // BUG FIX: correct param name
          apiKey,
        });
        setResults(sorted);
        setLastQuery(trimmed);
      } catch (err) {
        console.error("[useSemanticSearch]", err);
        setError(err.message || "Semantic search failed. Check your Gemini API key.");
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    },
    [allEntries, dataKey, apiKey, lastQuery, results]
  );

  const debouncedSearch = useDebounce(runSearch, 600);

  const clear = useCallback(() => {
    setResults(null);
    setError(null);
    setLastQuery("");
  }, []);

  return {
    results,
    isSearching,
    error,
    search: debouncedSearch,
    searchNow: runSearch,
    clear,
    lastQuery,
  };
};