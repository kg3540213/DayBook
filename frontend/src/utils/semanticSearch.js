// frontend/src/utils/semanticSearch.js
// ─────────────────────────────────────────────────────────────────
// Semantic search via Gemini — runs ENTIRELY in the browser.
//
// Security model:
//   - Plaintext is decrypted in memory from the Redux userPassword.
//   - It is sent ONLY to Gemini's API (api.generativelanguage.googleapis.com).
//   - It NEVER touches your Express backend, so zero-knowledge is preserved.
//   - VITE_GEMINI_API_KEY is exposed in the browser bundle (visible in DevTools),
//     but that only risks Gemini quota abuse — not user data privacy.
// ─────────────────────────────────────────────────────────────────

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Maximum characters of plaintext sent per entry to Gemini.
// Keeps prompt size manageable; 600 chars is enough for semantic matching.
const MAX_CHARS_PER_ENTRY = 600;

// Maximum entries sent in one Gemini call.
// If the user has more, we batch and merge scores.
const BATCH_SIZE = 30;

// ── Build the ranking prompt ──────────────────────────────────────
const buildPrompt = (query, entries) => {
  const entryList = entries
    .map(
      (e, i) =>
        `[${i}] Title: ${e.title}\nContent: ${e.plainContent.slice(0, MAX_CHARS_PER_ENTRY)}`
    )
    .join("\n\n");

  return `You are a semantic search engine for a personal journal app.

User query: "${query}"

Journal entries (index: title + content preview):
${entryList}

Task: Return ONLY a JSON array of objects sorted by semantic relevance to the query (most relevant first).
Each object must have exactly two fields:
  "index": the original entry index (integer)
  "score": relevance score from 0.0 to 1.0 (float, two decimal places)

Include ALL entries in the output — irrelevant entries get score 0.0.
Return ONLY the raw JSON array. No markdown, no explanation, no backticks.

Example output format:
[{"index":2,"score":0.95},{"index":0,"score":0.60},{"index":1,"score":0.10}]`;
};

// ── Call Gemini for one batch ─────────────────────────────────────
const rankBatch = async (query, entries, apiKey) => {
  const prompt = buildPrompt(query, entries);

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,   // low temp → deterministic ranking
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

  // Strip any accidental markdown fences Gemini sometimes adds
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    console.warn("[semanticSearch] Failed to parse Gemini response:", raw);
    return entries.map((_, i) => ({ index: i, score: 0 }));
  }
};

// ── Strip HTML tags from entry content ───────────────────────────
const stripHtml = (html) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ── Session-level embedding cache ────────────────────────────────
// Key: `${query}:${entryIds.join(",")}` → sorted entry array
// Cleared automatically when the tab is closed (sessionStorage).
const CACHE_PREFIX = "_db_sem:";

const cacheGet = (key) => {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const cacheSet = (key, value) => {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // sessionStorage full — fail silently
  }
};

// ── Main export ───────────────────────────────────────────────────
// Parameters:
//   query      — user's natural language search string
//   entries    — raw entry objects from Redux (content is still ciphertext)
//   decryptFn  — (ciphertext, dataKey) => plaintext string
//   dataKey    — from Redux state.user.dataKey
//   apiKey     — import.meta.env.VITE_GEMINI_API_KEY
//
// Returns: entries array sorted by semantic relevance (score attached as _score)
export const semanticSearch = async ({
  query,
  entries,
  decryptFn,
  dataKey,
  apiKey,
}) => {
  if (!query.trim()) return entries;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not set in your .env file.");
  if (!dataKey) throw new Error("Encryption key unavailable. Please log out and log in again.");

  // Build plain-text index (decrypt in memory — never sent to backend)
  const plain = entries.map((entry) => {
    let plainContent = entry.content || "";
    try {
      const decrypted = decryptFn(entry.content, password);
      if (decrypted) plainContent = decrypted;
    } catch {
      // leave ciphertext as-is for old/unencrypted entries
    }
    return {
      ...entry,
      plainContent: stripHtml(plainContent),
    };
  });

  // Cache key based on query + entry IDs (not content — content is private)
  const cacheKey = `${query.trim().toLowerCase()}:${plain.map((e) => e._id).join(",")}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // Split into batches if needed
  const batches = [];
  for (let i = 0; i < plain.length; i += BATCH_SIZE) {
    batches.push(plain.slice(i, i + BATCH_SIZE));
  }

  // Run all batches (parallel for speed)
  const batchResults = await Promise.all(
    batches.map((batch, batchIdx) =>
      rankBatch(query, batch, apiKey).then((scores) =>
        // Re-map local batch indices to global indices
        scores.map((s) => ({
          globalIndex: batchIdx * BATCH_SIZE + s.index,
          score: s.score,
        }))
      )
    )
  );

  // Flatten and build a score map: globalIndex → score
  const scoreMap = {};
  batchResults.flat().forEach(({ globalIndex, score }) => {
    scoreMap[globalIndex] = score;
  });

  // Sort entries by score descending, attach _score for UI use
  const sorted = plain
    .map((entry, i) => ({ ...entry, _score: scoreMap[i] ?? 0 }))
    .sort((a, b) => b._score - a._score);

  cacheSet(cacheKey, sorted);
  return sorted;
};