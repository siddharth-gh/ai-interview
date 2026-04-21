import { AI_PROVIDER, MAX_QUESTIONS } from "../config/constants.js";
import { ollamaJson } from "./ollamaService.js";
import { clampText, normalize } from "../utils/text.js";
import { addLog } from "../store/debugStore.js";

let globalQuestionId = 100;

function isUsableQuestion(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (value.length < 8) return false;
  return true;
}

function sanitizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];
  return rawQuestions
    .map((item) => {
      if (typeof item === "string") {
        globalQuestionId += 1;
        return { id: globalQuestionId, text: item.trim() };
      }
      if (item && typeof item === "object") {
        globalQuestionId += 1;
        return {
          id: globalQuestionId,
          text: String(item.text || "").trim()
        };
      }
      return null;
    })
    .filter((item) => item && isUsableQuestion(item.text));
}

export async function generateQuestions(session, count = 1) {
  const { report, resumeText, ollamaContext, answers, introQuestion, questionQueue } = session;
  const existingQuestions = [
    introQuestion,
    ...questionQueue,
    ...answers.map((a) => ({ text: a.question }))
  ];

  const difficulty = session.difficulty || "medium";
  const interviewType = session.interviewType || "technical";

  const difficultyGuide = {
    easy: "Ask simple, straightforward questions. Focus on basic concepts, definitions, and common practices. Suitable for junior candidates.",
    medium: "Ask moderately challenging questions that test practical experience and problem-solving. Expect real-world examples.",
    hard: "Ask advanced, in-depth questions that probe system design, architecture decisions, trade-offs, and edge cases. Senior-level difficulty."
  };

  const typeGuide = {
    technical: "Focus on coding, system design, tools, frameworks, and technical problem-solving.",
    behavioral: "Focus on teamwork, leadership, conflict resolution, and past experiences. Use 'Describe a time...' or 'How would you handle...' format.",
    mixed: "Mix technical and behavioral questions equally. Alternate between coding/design questions and situational/teamwork questions."
  };

  const exampleJson = Array.from({ length: count }, (_, i) => `{"id":${i + 1},"text":"..."}`).join(",");

  let prompt;
  if (AI_PROVIDER === "ollama" && ollamaContext) {
    prompt = [
      `Write ${count} more unique ${interviewType} interview questions.`,
      `Difficulty: ${difficulty}. ${difficultyGuide[difficulty]}`,
      `Style: ${typeGuide[interviewType]}`,
      `Respond with ONLY this exact JSON structure, nothing else:`,
      `{"questions":[${exampleJson}]}`,
      `Each object has exactly two fields: "id" (integer) and "text" (string).`,
      "Do NOT include answers, explanations, thinking, or any text outside the JSON.",
      `Do not repeat these: ${existingQuestions.map((item) => item.text).slice(-4).join(" | ")}`,
      "Keep each question under 15 words."
    ].join("\n");
  } else {
    prompt = [
      `Generate exactly ${count} ${interviewType} interview question${count > 1 ? 's' : ''}.`,
      `Difficulty: ${difficulty}. ${difficultyGuide[difficulty]}`,
      `Style: ${typeGuide[interviewType]}`,
      `Respond with ONLY this exact JSON structure, nothing else:`,
      `{"questions":[${exampleJson}]}`,
      `Each object has exactly two fields: "id" (integer) and "text" (string).`,
      "Do NOT include answers, explanations, thinking, notes, or any text outside the JSON object.",
      "Questions must be relevant to the CV and not duplicate existing questions.",
      "Keep each question under 15 words.",
      `Candidate name: ${report.name}`,
      `CV keywords: ${report.keywords.join(", ") || "none"}`,
      `CV summary: ${clampText(report.summary, 180)}`,
      `Existing questions: ${existingQuestions.map((item) => item.text).join(" | ") || "none"}`,
      `CV text: ${clampText(resumeText, 1200)}`
    ].join("\n");
  }

  const { json, context } = await ollamaJson(prompt, {
    num_predict: count * 80 + 40,
    context: AI_PROVIDER === "ollama" ? ollamaContext : undefined
  });

  const parsed = sanitizeQuestions(json.questions);
  return { questions: parsed.slice(0, count), context };
}

export async function ensureQueue(session, targetSize, fetchBatchSize = 2) {
  if (session.generationInFlight) return;
  if (session.currentQuestion >= MAX_QUESTIONS) return;
  session.questionBacklog = Array.isArray(session.questionBacklog) ? session.questionBacklog : [];

  const currentCount = session.questionQueue.length;
  if (currentCount >= targetSize && session.questionBacklog.length > 0) return;

  session.generationInFlight = true;
  try {
    const existingText = new Set([
      session.introQuestion.text,
      ...session.questionQueue.map((q) => q.text),
      ...session.questionBacklog.map((q) => q.text),
      ...session.answers.map((a) => a.question)
    ].map((t) => normalize(t)));

    let fetched = 0;
    let attempts = 0;
    while (fetched < fetchBatchSize && attempts < 6) {
      attempts += 1;
      const result = await generateQuestions(session, fetchBatchSize - fetched);
      if (!result.questions || !result.questions.length) continue;

      for (const item of result.questions) {
        const normalized = normalize(item.text);
        if (!normalized || existingText.has(normalized)) continue;
        session.questionBacklog.push(item);
        existingText.add(normalized);
        fetched += 1;
        addLog("info", `Stored in backlog: ${item.text}`);
        if (fetched >= fetchBatchSize) break;
      }

      if (result.context) {
        session.ollamaContext = result.context;
      }
    }

    while (session.questionQueue.length < targetSize && session.questionBacklog.length > 0) {
      const item = session.questionBacklog.shift();
      session.questionQueue.push(item);
      addLog("info", `Moved backlog to queue: ${item.text}`);
    }
  } catch (err) {
    addLog("error", `Batch generation failed: ${err.message}`);
  } finally {
    session.generationInFlight = false;
  }

  return session.questionQueue.length >= targetSize;
}
