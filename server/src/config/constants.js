export const CLIENT_ORIGIN = "http://localhost:5173";

export const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b-it";
export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
export const INTERVIEW_MODE = process.env.INTERVIEW_MODE || "live";

export const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || "";
export const GOOGLE_AI_MODEL = process.env.GOOGLE_AI_MODEL || "gemma-3-4b-it";
export const GOOGLE_AI_URL = "https://generativelanguage.googleapis.com/v1beta";

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-3-4b-it";
export const AI_PROVIDER =
  process.env.AI_PROVIDER ||
  (GOOGLE_AI_API_KEY ? "google" : OPENROUTER_API_KEY ? "openrouter" : "ollama");

export const INITIAL_QUEUE_TARGET = 10;
export const INITIAL_FETCH_BATCH = 5;
export const READY_QUEUE_TARGET = 4;
export const REFILL_FETCH_BATCH = 5;
export const QUEUE_TARGET = 10;
export const MAX_QUESTIONS = 10;

export const COMMON_KEYWORDS = [
  "react",
  "javascript",
  "typescript",
  "node",
  "express",
  "mongodb",
  "sql",
  "python",
  "java",
  "tailwind",
  "css",
  "html",
  "git",
  "api",
  "testing",
  "communication",
  "leadership",
  "problem solving"
];
