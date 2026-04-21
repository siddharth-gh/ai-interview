import { GoogleGenerativeAI } from "@google/generative-ai";
import { addLog } from "../store/debugStore.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

let genAI = null;
let model = null;

function getModel() {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env");
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  return model;
}

/**
 * Send a prompt to Gemini and parse the JSON response.
 * @param {string} prompt - The full prompt text
 * @returns {{ json: object }} - Parsed JSON from the response
 */
export async function geminiJson(prompt) {
  const geminiModel = getModel();

  addLog("info", `Gemini evaluation request sent (${prompt.length} chars)`);

  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 1024
    }
  });

  const response = result.response;
  const text = response.text();

  addLog("info", `Gemini response received (${text.length} chars)`);

  try {
    const json = JSON.parse(text);
    return { json };
  } catch (parseErr) {
    // Try to extract JSON from the response text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { json: JSON.parse(jsonMatch[0]) };
    }
    addLog("error", `Gemini JSON parse failed: ${text.slice(0, 200)}`);
    throw new Error("Failed to parse Gemini response as JSON");
  }
}
