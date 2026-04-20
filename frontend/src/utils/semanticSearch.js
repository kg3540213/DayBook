// frontend/src/utils/semanticSearch.js
//
// Option A change: parameter renamed from `dataKey` / `password` to `encKey`

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const MAX_CHARS_PER_ENTRY = 600;
const BATCH_SIZE          = 30;

const buildPrompt = (query, entries) => {
  const entryList = entries
    .map((e, i) => `[${i}] Title: ${e.title}\nContent: ${e.plainContent.slice(0, MAX_CHARS_PER_ENTRY)}`)
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

const rankBatch = async (query, entries, apiKey) => {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(query, entries) }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error ${response.status}`);
  }
  const data = await response.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return entries.map((_, i) => ({ index: i, score: 0 }));
  }
};

const stripHtml = (html) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const CACHE_PREFIX = "_db_sem:";
const cacheGet = (key) => { try { const r = sessionStorage.getItem(CACHE_PREFIX + key); return r ? JSON.parse(r) : null; } catch { return null; } };
const cacheSet = (key, value) => { try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value)); } catch { /* full */ } };

/**
 * @param {string}   query
 * @param {Array}    entries    - raw entries (content still encrypted)
 * @param {Function} decryptFn  - (ciphertext, encKey) => plaintext
 * @param {string}   encKey     - from Redux state.user.encKey (Option A: derived from password)
 * @param {string}   apiKey     - VITE_GEMINI_API_KEY
 */
export const semanticSearch = async ({ query, entries, decryptFn, encKey, apiKey }) => {
  if (!query.trim()) return entries;
  if (!apiKey)  throw new Error("VITE_GEMINI_API_KEY is not set in your .env file.");
  if (!encKey)  throw new Error("Encryption key unavailable. Please log out and log in again.");

  const plain = entries.map((entry) => {
    let plainContent = entry.content || "";
    try {
      const decrypted = decryptFn(entry.content, encKey);
      if (decrypted) plainContent = decrypted;
    } catch { /* legacy plain-text entry */ }
    return { ...entry, plainContent: stripHtml(plainContent) };
  });

  const cacheKey = `${query.trim().toLowerCase()}:${plain.map((e) => e._id).join(",")}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const batches = [];
  for (let i = 0; i < plain.length; i += BATCH_SIZE)
    batches.push(plain.slice(i, i + BATCH_SIZE));

  const batchResults = await Promise.all(
    batches.map((batch, batchIdx) =>
      rankBatch(query, batch, apiKey).then((scores) =>
        scores.map((s) => ({ globalIndex: batchIdx * BATCH_SIZE + s.index, score: s.score }))
      )
    )
  );

  const scoreMap = {};
  batchResults.flat().forEach(({ globalIndex, score }) => { scoreMap[globalIndex] = score; });

  const sorted = plain
    .map((entry, i) => ({ ...entry, _score: scoreMap[i] ?? 0 }))
    .sort((a, b) => b._score - a._score);

  cacheSet(cacheKey, sorted);
  return sorted;
};