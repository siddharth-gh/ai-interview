export function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ");
}

export function clampText(text, maxChars) {
  const value = String(text || "");
  return value.length > maxChars ? `${value.slice(0, maxChars)}...` : value;
}

export function scoreTextMatch(source, response) {
  const sourceWords = new Set(normalize(source).split(/\s+/).filter(Boolean));
  const responseWords = new Set(normalize(response).split(/\s+/).filter(Boolean));
  let overlap = 0;
  for (const word of responseWords) {
    if (sourceWords.has(word)) overlap += 1;
  }
  return overlap;
}
