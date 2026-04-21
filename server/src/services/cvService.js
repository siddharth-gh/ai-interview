import { COMMON_KEYWORDS } from "../config/constants.js";
import { normalize, clampText } from "../utils/text.js";
import { ollamaJson } from "./ollamaService.js";

export function extractKeywords(text) {
  const lowered = normalize(text);
  const found = COMMON_KEYWORDS.filter((keyword) => lowered.includes(keyword));
  return [...new Set(found)];
}

/**
 * Heuristic fallback if AI parsing fails
 */
export function evaluateCv(text, name) {
  const keywords = extractKeywords(text);
  const wordCount = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const score = Math.min(100, 20 + keywords.length * 8 + Math.min(20, Math.floor(wordCount / 80)));

  return {
    name,
    role: "Developer",
    score,
    keywords,
    summary:
      keywords.length > 0
        ? `Strong signal around ${keywords.slice(0, 4).join(", ")}.`
        : "The CV is readable, but the keyword signal is light.",
    strengths: keywords.slice(0, 5),
    gaps: COMMON_KEYWORDS.filter((k) => !keywords.includes(k)).slice(0, 5)
  };
}

/**
 * Modern AI-powered CV parsing
 */
export async function evaluateCvWithAi(text, candidateName) {
  const prompt = [
    "You are an expert technical recruiter. Analyze the following CV text and extract key information.",
    "Respond with ONLY this exact JSON structure, nothing else:",
    '{"name":"Full Name","role":"e.g. Senior Frontend Engineer","score":85,"keywords":["react","node"],"summary":"Short professional summary","strengths":["skill1","skill2"],"gaps":["missing skill1"]}',
    "Rules:",
    "1. name: extract from CV or use the provided name.",
    "2. role: determine the most likely current or target role.",
    "3. score: 0-100 based on CV quality and depth.",
    "4. keywords: list top 8-10 technical skills found.",
    "5. summary: 2 sentences max.",
    "6. strengths: top 3-4 professional strengths.",
    "7. gaps: 2-3 areas for improvement or missing skills for the detected role.",
    "Do NOT include any text outside the JSON.",
    `Provided Name: ${candidateName}`,
    `CV Text: ${clampText(text, 3000)}`
  ].join("\n");

  try {
    const { json } = await ollamaJson(prompt, { num_predict: 500 });
    return {
      name: json.name || candidateName,
      role: json.role || "Developer",
      score: Math.max(0, Math.min(100, Number(json.score) || 70)),
      keywords: Array.isArray(json.keywords) ? json.keywords : [],
      summary: String(json.summary || "Parsed via AI.").trim(),
      strengths: Array.isArray(json.strengths) ? json.strengths : [],
      gaps: Array.isArray(json.gaps) ? json.gaps : []
    };
  } catch (err) {
    console.error("AI CV Parsing failed, using heuristic fallback:", err.message);
    return evaluateCv(text, candidateName);
  }
}
