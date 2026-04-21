import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { randomUUID } from "node:crypto";
import {
  INTERVIEW_MODE,
  MAX_QUESTIONS,
  QUEUE_TARGET,
  INITIAL_QUEUE_TARGET,
  INITIAL_FETCH_BATCH,
  REFILL_FETCH_BATCH,
  READY_QUEUE_TARGET,
  AI_PROVIDER,
  OPENROUTER_API_KEY
} from "../config/constants.js";
import { sessions } from "../store/sessionStore.js";
import { evaluateCvWithAi } from "../services/cvService.js";
import Interview from "../models/Interview.js";
import { ensureQueue } from "../services/questionService.js";
import { calculateSummary, evaluateFullInterview, runEvaluation } from "../services/evaluationService.js";
import { ensureMockQueue, initializeMockPool } from "../services/mockQuestionService.js";
import { getOpenRouterKeyRateLimit } from "../services/openrouterService.js";
import { debugLogs, debugMeta, addLog, clearLogs, setOpenRouterKeyRateLimit } from "../store/debugStore.js";
import { protect } from "../middleware/authMiddleware.js";

const upload = multer({ storage: multer.memoryStorage() });

export const interviewRouter = express.Router();

async function saveInterviewToDb(session) {
  if (!session.userId || session.saved) return;
  try {
    const summary = calculateSummary(session.answers);
    const interview = new Interview({
      user: session.userId,
      role: session.report?.role || "Developer",
      finalScore: summary.averageScore,
      evaluatedCount: summary.evaluatedCount,
      softSkills: summary.softSkills,
      notes: summary.notes,
      answers: session.answers.map(a => ({
        questionId: a.questionId,
        question: a.question,
        answer: a.answer,
        score: a.score,
        feedback: a.feedback,
        metrics: a.metrics
      }))
    });
    await interview.save();
    session.saved = true;
    addLog("info", `Saved interview ${session.id} to DB for user ${session.userId}`);
  } catch (err) {
    addLog("error", `Failed to save interview to DB: ${err.message}`);
  }
}

function ensureQuestions(session) {
  const isInitial = session.currentQuestion === 0;
  const target = isInitial ? INITIAL_QUEUE_TARGET : QUEUE_TARGET;
  const fetchBatch = isInitial ? INITIAL_FETCH_BATCH : REFILL_FETCH_BATCH;
  const mode = session.mode || INTERVIEW_MODE;
  if (mode === "mock") {
    return ensureMockQueue(session, target, fetchBatch);
  }
  return ensureQueue(session, target, fetchBatch);
}

interviewRouter.post("/evaluate-cv", protect, upload.single("cv"), async (req, res) => {
  try {
    clearLogs();
    const { name, devMode, difficulty, interviewType } = req.body;
    if (!name || !req.file) {
      return res.status(400).json({ message: "Name and CV are required." });
    }

    let text = req.file.buffer.toString("utf8");
    if (req.file.mimetype === "application/pdf") {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text || "";
    }

    const report = await evaluateCvWithAi(text, name);
    const sessionId = randomUUID();
    const introText = "Give me a short introduction and walk through your background.";

    const session = {
      name,
      report,
      resumeText: text,
      introQuestion: {
        id: 1,
        text: introText
      },
      questionQueue: [{
        id: 1,
        text: introText
      }],
      questionBacklog: [],
      answers: [],
      currentQuestion: 0,
      generationInFlight: false,
      nextAnswerId: 1,
      mode: devMode === "true" ? "mock" : "live",
      ollamaContext: null,
      id: sessionId,
      userId: req.user._id,
      difficulty: difficulty || "medium",
      interviewType: interviewType || "technical"
    };

    if (session.mode === "mock") {
      initializeMockPool(session);
    }

    sessions.set(sessionId, session);

    addLog("info", `Session ${sessionId} created for ${name}. Starting background question generation.`);

    // Fire question generation in background and do not block response.
    // User sees a short countdown while AI fills the queue.
    ensureQuestions(session)
      .then(() => {
        addLog("info", `First batch done. Queue has ${session.questionQueue.length} questions. Firing second batch.`);
        // As soon as first 5 arrive, fire off generation for the remaining 4
        return ensureQuestions(session);
      })
      .catch((err) => {
        addLog("error", `Background question generation failed: ${err.message}`);
      });

    res.json({
      sessionId,
      report,
      introQuestion: session.introQuestion,
      readyQuestions: []
    });
  } catch (err) {
    addLog("error", `evaluate-cv error: ${err.message}`);
    res.status(500).json({ message: "Failed to evaluate CV." });
  }
});

interviewRouter.post("/answer", protect, async (req, res) => {
  const { sessionId, answer } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ message: "Session not found." });
  }

  if (session.currentQuestion >= MAX_QUESTIONS) {
    return res.status(400).json({ message: "Interview already completed." });
  }

  const question = session.questionQueue[0] || null;
  if (!question) {
    return res.status(400).json({ message: "No question available." });
  }

  // Shift the question out of the queue immediately as it's being answered
  session.questionQueue.shift();

  const reviewId = session.nextAnswerId;
  session.nextAnswerId += 1;

  session.answers.push({
    id: reviewId,
    questionId: question.id,
    question: question.text,
    answer,
    keywords: Array.isArray(question.keywords) ? question.keywords : [],
    status: "recorded",
    score: null,
    feedback: "Response recorded."
  });

  session.currentQuestion += 1;

  const done = session.currentQuestion >= MAX_QUESTIONS;

  const nextQuestion = done ? null : session.questionQueue[0] || null;

  addLog("info", `Answer submitted for Q${session.currentQuestion}. Queue has ${session.questionQueue.length} questions.`);

  // Replenish queue in the background if needed
  if (!done && session.questionQueue.length < READY_QUEUE_TARGET) {
    ensureQuestions(session).catch((err) => {
      addLog("error", `Post-answer question generation failed: ${err.message}`);
    });
  }

  // Trigger immediate evaluation for this answer
  runEvaluation(session, reviewId, question, answer, false).catch(err => {
    addLog("error", `Evaluation failed for Q${session.currentQuestion}: ${err.message}`);
  });

  const summary = done
    ? await evaluateFullInterview(session)
    : null;

  if (done) {
    await saveInterviewToDb(session);
  }

  // Trigger background generation if queue is getting low
  if (!done && session.questionQueue.length < 10) {
    ensureQuestions(session).catch(() => {});
  }

  res.json({
    done,
    waitingForQuestion: !done && !nextQuestion,
    nextQuestion,
    submittedReview: session.answers.find(a => a.id === reviewId),
    readyQuestions: session.questionQueue.slice(0, READY_QUEUE_TARGET),
    summary,
    answers: done ? session.answers : undefined
  });
});

interviewRouter.post("/finish-early", protect, async (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ message: "Session not found." });
  }

  if (session.currentQuestion >= MAX_QUESTIONS) {
    return res.json({
      done: true,
      summary: calculateSummary(session.answers),
      answers: session.answers
    });
  }

  await evaluateFullInterview(session);

  session.currentQuestion = MAX_QUESTIONS;
  await saveInterviewToDb(session);

  return res.json({
    done: true,
    summary: calculateSummary(session.answers),
    answers: session.answers
  });
});

interviewRouter.get("/session/:id", protect, (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ message: "Session not found." });
  }

  // Fire-and-forget: trigger generation if queue is low, but never block the poll
  if (session.currentQuestion < MAX_QUESTIONS && session.questionQueue.length < 10 && !session.generationInFlight) {
    ensureQuestions(session).catch((err) => {
      addLog("error", `Poll-triggered question generation failed: ${err.message}`);
    });
  }

  res.json({
    currentQuestion: session.currentQuestion,
    queue: session.questionQueue,
    nextQuestion: session.questionQueue[0] || null,
    readyQuestions: session.questionQueue.slice(0, READY_QUEUE_TARGET),
    generationInFlight: session.generationInFlight,
    queueStalled: !session.generationInFlight && session.questionQueue.length === 0 && session.currentQuestion > 0 && session.currentQuestion < MAX_QUESTIONS,
    done: session.currentQuestion >= MAX_QUESTIONS,
    answers: session.answers,
    summary: calculateSummary(session.answers)
  });
});

interviewRouter.get("/debug-logs", async (req, res) => {
  const shouldFetchOpenRouterKey = AI_PROVIDER === "openrouter" && !!OPENROUTER_API_KEY;
  if (shouldFetchOpenRouterKey) {
    const keyInfo = await getOpenRouterKeyRateLimit();
    setOpenRouterKeyRateLimit(keyInfo.rateLimit, keyInfo.error);
  }

  res.json({
    logs: debugLogs,
    openrouterRateLimit: debugMeta.openrouterRateLimit,
    openrouterKeyRateLimit: debugMeta.openrouterKeyRateLimit,
    openrouterKeyError: debugMeta.openrouterKeyError,
    llm: debugMeta.llm
  });
});
