const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Maps Gemini's free-text response to one of the 4 supported mood emojis
const normalizeMood = (rawText) => {
  const text = rawText.toLowerCase().trim();
  if (text.includes("happy") || text.includes("joy") || text.includes("excited"))
    return "🙂";
  if (text.includes("sad") || text.includes("grief") || text.includes("depress"))
    return "😔";
  if (
    text.includes("angry") ||
    text.includes("anger") ||
    text.includes("furious") ||
    text.includes("frustrated")
  )
    return "😡";
  if (
    text.includes("neutral") ||
    text.includes("calm") ||
    text.includes("okay") ||
    text.includes("fine")
  )
    return "😐";
  return "😐"; // safe default
};

const analyzeMood = async (content) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const prompt = `Analyze the mood of the following journal entry and respond with exactly one word from this list: happy, sad, angry, neutral.

Journal entry:
"""
${content}
"""

Respond with only one word.`;

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
      error?.error?.message || "Failed to get response from Gemini API."
    );
  }

  const data = await response.json();
  const rawMood =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "neutral";

  return normalizeMood(rawMood);
};

module.exports = { analyzeMood };