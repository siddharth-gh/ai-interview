import { normalize } from "../utils/text.js";

function scoreLength(words) {
  if (words >= 70) return 4;
  if (words >= 45) return 3;
  if (words >= 25) return 2;
  if (words >= 10) return 1;
  return 0;
}

function keywordMatchScore(answer, keywords = []) {
  const normalized = normalize(answer || "");
  let matches = 0;
  for (const keyword of keywords) {
    if (normalized.includes(normalize(keyword))) {
      matches += 1;
    }
  }
  return Math.min(6, matches * 2);
}

function evaluateIntro(answer, report) {
  const normalized = normalize(answer || "");
  const words = normalized.split(/\s+/).filter(Boolean).length;
  const keywordHits = report.keywords.filter((keyword) => normalized.includes(keyword)).length;
  const score = Math.min(10, Math.min(6, keywordHits * 2) + scoreLength(words));
  return {
    score,
    feedback:
      score >= 7
        ? "Strong intro with relevant skills and good detail."
        : "Mention more CV keywords and add concrete detail."
  };
}

function evaluateQuestionAnswer(answer, questionMeta) {
  const words = normalize(answer || "").split(/\s+/).filter(Boolean).length;
  const keywordScore = keywordMatchScore(answer, questionMeta?.keywords || []);
  const lengthScore = scoreLength(words);
  const score = Math.min(10, keywordScore + lengthScore);

  return {
    score,
    feedback:
      score >= 7
        ? "Good relevance and detail for this question."
        : "Add more keywords and a clearer, longer example."
  };
}

export function runMockEvaluation(session, answerId, answer, isIntro, questionMeta) {
  setTimeout(() => {
    const target = session.answers.find((item) => item.id === answerId);
    if (!target) return;
    const result = isIntro
      ? evaluateIntro(answer || "", session.report)
      : evaluateQuestionAnswer(answer || "", questionMeta);

    target.status = "scored";
    target.score = result.score;
    target.feedback = result.feedback;
  }, 0);
}

export function evaluateAllPending(session) {
  session.answers = session.answers.map((item, index) => {
    if (item.status === "scored") return item;
    const isIntro = index === 0;
    const result = isIntro
      ? evaluateIntro(item.answer || "", session.report)
      : evaluateQuestionAnswer(item.answer || "", {
          keywords: Array.isArray(item.keywords) ? item.keywords : []
        });
    return {
      ...item,
      status: "scored",
      score: result.score,
      feedback: result.feedback
    };
  });
}
