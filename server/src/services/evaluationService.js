import { clampText, normalize, scoreTextMatch } from "../utils/text.js";
import { ollamaJson } from "./ollamaService.js";
import { addLog } from "../store/debugStore.js";

export function evaluateIntro(answer, report) {
  const text = answer || "";
  const normalized = normalize(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const keywordMatch = report.keywords.filter((keyword) => normalized.includes(keyword)).length;

  const lengthConfidence = wordCount >= 80 ? 3 : wordCount >= 45 ? 2 : wordCount >= 20 ? 1 : 0;
  const sentences = text.split(/[.!?]/).map((s) => s.trim()).filter(Boolean);
  const uniqueWordRatio = wordCount ? new Set(words).size / wordCount : 0;
  const clarityConfidence = sentences.length >= 2 && uniqueWordRatio > 0.45 ? 2 : sentences.length >= 1 ? 1 : 0;
  const confidence = lengthConfidence + clarityConfidence;
  const score = Math.min(10, keywordMatch + confidence);

  return {
    score,
    feedback:
      score >= 7
        ? "Strong intro with relevant skill signal and clarity."
        : "Mention more CV keywords and use clearer, longer intro structure."
  };
}

function evaluateAnswerLocal({ question, answer, report }) {
  const normalizedAnswer = normalize(answer || "");
  const matched = report.keywords.filter((keyword) => normalizedAnswer.includes(keyword));
  const overlap = scoreTextMatch(question.text, answer || "");
  const lengthWords = String(answer || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const lengthScore = Math.min(3, Math.floor(lengthWords / 25));
  const score = Math.min(10, Math.max(1, 3 + matched.length * 2 + overlap + lengthScore));
  const feedback = matched.length
    ? `Good mention of ${matched.slice(0, 2).join(", ")}.`
    : overlap > 0
      ? "Stay concrete and tie it back to the question."
      : "Be more specific and use one real example.";

  return { score, feedback };
}

async function evaluateAnswerWithOllama({ question, answer, report, isIntro }) {
  const prompt = [
    "You are a professional interview evaluator. Evaluate the answer strictly but fairly.",
    "Respond with ONLY this exact JSON structure, nothing else:",
    '{"score":7,"feedback":"short sentence","starAdherence":6,"clarity":7,"technicalDepth":8}',
    "Field rules: score (0-10 overall), feedback (one short sentence), starAdherence (0-10, how well they used Situation/Task/Action/Result), clarity (0-10), technicalDepth (0-10).",
    "If they don't provide a real-world example, STAR adherence must be low.",
    "Do NOT include any text, explanation, or thinking outside the JSON object.",
    `Candidate CV Summary: ${clampText(report.summary, 300)}`,
    `Question: ${question.text}`,
    `Answer: ${clampText(answer || "", 1500)}`
  ].join("\n");

  const { json } = await ollamaJson(prompt, { num_predict: 200, timeout: 20000 });
  return {
    score: Math.max(0, Math.min(10, Number(json.score) || 0)),
    feedback: String(json.feedback || "Reviewed.").trim(),
    starAdherence: Number(json.starAdherence) || 0,
    clarity: Number(json.clarity) || 0,
    technicalDepth: Number(json.technicalDepth) || 0
  };
}

export async function runEvaluation(session, answerId, question, answer, isIntro) {
  const target = session.answers.find((item) => item.id === answerId);
  if (!target) return;

  target.status = "evaluating";
  addLog("info", `Starting evaluation for Q${session.currentQuestion} (ID: ${answerId})`);

  try {
    const result = await evaluateAnswerWithOllama({
      question,
      answer: answer || "",
      report: session.report,
      isIntro
    });
    target.score = result.score;
    target.feedback = result.feedback;
    target.metrics = {
      starAdherence: result.starAdherence,
      clarity: result.clarity,
      technicalDepth: result.technicalDepth
    };
    target.status = "scored";
  } catch (err) {
    addLog("error", `AI evaluation failed: ${err.message}. Marking as failed.`);
    target.status = "failed";
    target.feedback = `AI Evaluation Error: ${err.message}`;
    target.score = 0;
  } finally {
    addLog("info", `Evaluation attempt finished for Q${session.currentQuestion} (Status: ${target.status})`);
  }
}

function calculateSummaryFromScored(answers) {
  const scored = answers.filter((item) => item.status === "scored" && typeof item.score === "number");
  const total = scored.reduce((sum, item) => sum + item.score, 0);
  const average = scored.length ? total / scored.length : 0;
  
  const avgStar = scored.length ? scored.reduce((s, i) => s + (i.metrics?.starAdherence || 0), 0) / scored.length : 0;
  const avgClarity = scored.length ? scored.reduce((s, i) => s + (i.metrics?.clarity || 0), 0) / scored.length : 0;
  const avgTech = scored.length ? scored.reduce((s, i) => s + (i.metrics?.technicalDepth || 0), 0) / scored.length : 0;

  return {
    totalScore: total,
    averageScore: Number(average.toFixed(1)),
    evaluatedCount: scored.length,
    pendingCount: answers.length - scored.length,
    softSkills: {
      starAdherence: Number(avgStar.toFixed(1)),
      clarity: Number(avgClarity.toFixed(1)),
      technicalDepth: Number(avgTech.toFixed(1))
    },
    notes:
      average >= 8
        ? "Excellent interview performance. Demonstrated high technical depth and clear communication."
        : average >= 5
          ? "Solid interview performance. Some examples could be more structured using the STAR method."
          : "Needs clearer, more specific answers and better structured examples."
  };
}

export async function evaluatePendingBatch(session, isDone = false) {
  if (session.evaluationInFlight) return;
  
  const pending = session.answers.filter(a => a.status === "recorded");
  // Only evaluate if we hit the batch size (3) or if the interview is over and we have leftovers
  if (pending.length < 3 && !(isDone && pending.length > 0)) return;

  session.evaluationInFlight = true;

  try {
    const items = pending.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer
    }));

    const prompt = [
      "You are an expert interview evaluator. Evaluate each answer strictly but fairly.",
      "Respond with ONLY this exact JSON structure, nothing else:",
      '{"items":[{"id":1,"score":7,"starAdherence":6,"clarity":7,"technicalDepth":8,"feedback":"short sentence"}]}',
      "Field rules: id (match the input id), score (0-10 overall), starAdherence (0-10), clarity (0-10), technicalDepth (0-10), feedback (under 15 words).",
      "Do NOT include any text, explanation, or thinking outside the JSON object.",
      `CV Summary: ${(session.report?.summary || "").slice(0, 300)}`,
      `Target Role: ${session.report?.role || "Developer"}`,
      `Interview items: ${JSON.stringify(items)}`
    ].join("\n");

    const { json } = await ollamaJson(prompt, { num_predict: 600 });
    
    if (Array.isArray(json.items)) {
      const byId = new Map();
      for (const row of json.items) {
        if (!row.id) continue;
        byId.set(Number(row.id), row);
      }

      session.answers.forEach((item) => {
        if (item.status === "recorded" && byId.has(item.id)) {
          const aiEval = byId.get(item.id);

          const star = Number(aiEval.starAdherence) || 0;
          const clarity = Number(aiEval.clarity) || 0;
          const tech = Number(aiEval.technicalDepth) || 0;
          const score = Math.max(0, Math.min(10, Number(aiEval.score) || Math.round((star + clarity + tech) / 3)));

          item.status = "scored";
          item.score = score;
          item.feedback = String(aiEval.feedback || "Reviewed by AI.").trim();
          item.metrics = { starAdherence: star, clarity, technicalDepth: tech };
        }
      });
    }
  } catch (err) {
    console.error("Batch evaluation failed (AI model)", err.message);
    addLog("error", `AI batch evaluation failed: ${err.message}. Answers will stay pending until next retry.`);
    // Do NOT fall back to local scoring — keep items as "recorded" so they retry next batch
  } finally {
    session.evaluationInFlight = false;
  }
}

export async function evaluateFullInterview(session) {
  // Wait up to 10 seconds for any background evaluations to finish
  let attempts = 0;
  while (session.answers.some(a => a.status === "evaluating") && attempts < 10) {
    await new Promise(r => setTimeout(r, 1000));
    attempts++;
  }

  // Ensure any leftover "recorded" answers are processed (e.g. from failed individual attempts)
  await evaluatePendingBatch(session, true);
  return calculateSummaryFromScored(session.answers);
}

export function calculateSummary(answers) {
  return calculateSummaryFromScored(answers);
}
