const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze journal entry text and detect mood using Gemini AI
 * @param {string} text - The journal entry content to analyze
 * @returns {Promise<string|null>} - Detected mood or null if analysis fails
 */
const analyzeMood = async (text) => {
  // Skip if no API key configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not configured, skipping mood analysis");
    return null;
  }

  // Skip analysis for very short entries
  if (!text || text.length < 10) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze the emotional tone of this journal entry and respond with ONLY ONE of these mood words (lowercase, no punctuation):
happy, sad, stressed, anxious, calm, excited, angry, neutral

Journal entry:
"${text.slice(0, 1000)}"

Respond with only the single mood word, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const moodText = response.text().trim().toLowerCase();

    // Validate the response is one of our expected moods
    const validMoods = [
      "happy",
      "sad",
      "stressed",
      "anxious",
      "calm",
      "excited",
      "angry",
      "neutral",
    ];
    if (validMoods.includes(moodText)) {
      return moodText;
    }

    // Try to extract a valid mood from the response if it contains extra text
    for (const mood of validMoods) {
      if (moodText.includes(mood)) {
        return mood;
      }
    }

    console.warn("Unexpected mood response from Gemini:", moodText);
    return "neutral";
  } catch (error) {
    console.error("Error analyzing mood with Gemini:", error.message);
    return null;
  }
};

module.exports = {
  analyzeMood,
};
