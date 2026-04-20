// frontend/src/hooks/useSemanticSearch.js
//
// Option A change: useSelector reads state.user.encKey (was state.user.dataKey)

import { useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { semanticSearch } from "../utils/semanticSearch";
import { decryptText } from "../utils/crypto";

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

export const useSemanticSearch = (allEntries = []) => {
  // Option A: read encKey (was dataKey)
  const encKey = useSelector((s) => s.user.encKey);
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
          query:     trimmed,
          entries:   allEntries,
          decryptFn: decryptText,
          encKey,    // Option A: pass encKey
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
    [allEntries, encKey, apiKey, lastQuery, results]
  );

  const debouncedSearch = useDebounce(runSearch, 600);

  const clear = useCallback(() => {
    setResults(null);
    setError(null);
    setLastQuery("");
  }, []);

  return { results, isSearching, error, search: debouncedSearch, searchNow: runSearch, clear, lastQuery };
};