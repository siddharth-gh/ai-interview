import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_QUESTIONS } from "../config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUESTION_FILE = path.resolve(__dirname, "../data/mockQuestions.json");
const QUESTION_BANK = JSON.parse(fs.readFileSync(QUESTION_FILE, "utf8"));

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getUsedIds(session) {
  const usedFromAnswers = session.answers.map((item) => item.questionId).filter(Boolean);
  const usedFromQueue = session.questionQueue.map((item) => item.id).filter(Boolean);
  return new Set([...usedFromAnswers, ...usedFromQueue]);
}

export function initializeMockPool(session) {
  session.mockPool = shuffle(QUESTION_BANK);
  session.questionBacklog = Array.isArray(session.questionBacklog) ? session.questionBacklog : [];
}

export async function ensureMockQueue(session, targetSize, fetchBatchSize = 2) {
  if (session.generationInFlight) return;
  if (session.currentQuestion >= MAX_QUESTIONS) return;
  session.questionBacklog = Array.isArray(session.questionBacklog) ? session.questionBacklog : [];
  if (session.questionQueue.length >= targetSize && session.questionBacklog.length > 0) return;

  session.generationInFlight = true;
  try {
    if (!Array.isArray(session.mockPool) || session.mockPool.length === 0) {
      initializeMockPool(session);
    }

    const usedIds = new Set([
      ...getUsedIds(session),
      ...session.questionBacklog.map((item) => item.id).filter(Boolean)
    ]);

    let fetched = 0;
    while (fetched < fetchBatchSize) {
      if (!session.mockPool.length) {
        initializeMockPool(session);
      }
      const candidate = session.mockPool.shift();
      if (!candidate) break;
      if (usedIds.has(candidate.id)) continue;
      session.questionBacklog.push(candidate);
      usedIds.add(candidate.id);
      fetched += 1;
    }

    while (session.questionQueue.length < targetSize && session.questionBacklog.length > 0) {
      session.questionQueue.push(session.questionBacklog.shift());
    }
  } finally {
    session.generationInFlight = false;
  }
}
