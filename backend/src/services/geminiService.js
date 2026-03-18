const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Maps Gemini's free-text response to our 4 supported mood emojis
const normalizeMood = (raw) => {
  const text = raw.toLowerCase().trim();
  if (text.includes("happy") || text.includes("joy") || text.includes("positive")) return "🙂";
  if (text.includes("sad") || text.includes("depressed") || text.includes("unhappy")) return "😔";
  if (text.includes("angry") || text.includes("frustrated") || text.includes("rage")) return "😡";
  return "😐"; // neutral fallback
};

const analyzeMood = async (content) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const prompt = `Analyze the emotional tone of the following journal entry and respond with ONLY one word: happy, sad, angry, or neutral. No explanation, no punctuation, just the single word.

Journal entry:
"""
${content}
"""`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Gemini API error: ${error?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  // Extract the text from Gemini's response structure
  const rawMood =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "neutral";

  return normalizeMood(rawMood);
};

module.exports = { analyzeMood };