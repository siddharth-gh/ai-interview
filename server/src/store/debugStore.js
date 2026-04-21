export const debugLogs = [];
export const debugMeta = {
  openrouterRateLimit: null,
  openrouterKeyRateLimit: null,
  openrouterKeyError: null,
  llm: {
    provider: null,
    model: null,
    status: null,
    lastError: null,
    seenRateLimitHeaders: [],
    updatedAt: null
  }
};

export function clearLogs() {
  debugLogs.length = 0;
  debugMeta.openrouterRateLimit = null;
  debugMeta.openrouterKeyRateLimit = null;
  debugMeta.openrouterKeyError = null;
  debugMeta.llm = {
    provider: null,
    model: null,
    status: null,
    lastError: null,
    seenRateLimitHeaders: [],
    updatedAt: null
  };
}

export function addLog(type, content) {
  debugLogs.push({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type,
    content: typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content)
  });

  if (debugLogs.length > 50) {
    debugLogs.shift();
  }
}

export function setOpenRouterRateLimit(headers) {
  if (!headers) return;

  const pick = (...names) => {
    for (const name of names) {
      const value = headers.get(name);
      if (value) return value;
    }
    return null;
  };

  const limit = pick(
    "x-ratelimit-limit",
    "x-ratelimit-limit-requests",
    "x-ratelimit-requests-limit"
  );
  const remaining = pick(
    "x-ratelimit-remaining",
    "x-ratelimit-remaining-requests",
    "x-ratelimit-requests-remaining"
  );
  const reset = pick(
    "x-ratelimit-reset",
    "x-ratelimit-reset-requests",
    "x-ratelimit-requests-reset"
  );
  const tokenLimit = pick(
    "x-ratelimit-limit-tokens",
    "x-ratelimit-tokens-limit"
  );
  const tokenRemaining = pick(
    "x-ratelimit-remaining-tokens",
    "x-ratelimit-tokens-remaining"
  );

  if (!limit && !remaining && !reset && !tokenLimit && !tokenRemaining) return;

  debugMeta.openrouterRateLimit = {
    limit: limit ?? null,
    remaining: remaining ?? null,
    reset: reset ?? null,
    tokenLimit: tokenLimit ?? null,
    tokenRemaining: tokenRemaining ?? null,
    updatedAt: new Date().toISOString()
  };
}

export function setOpenRouterKeyRateLimit(rateLimit, error = null) {
  debugMeta.openrouterKeyRateLimit = rateLimit || null;
  debugMeta.openrouterKeyError = error || null;
}

export function setLlmMeta(patch = {}) {
  debugMeta.llm = {
    ...debugMeta.llm,
    ...patch,
    updatedAt: new Date().toISOString()
  };
}

export function setSeenRateLimitHeaders(headers) {
  if (!headers) return;
  const keys = [];
  headers.forEach((_, key) => {
    const lower = String(key).toLowerCase();
    if (lower.includes("ratelimit") || lower.includes("rate-limit")) {
      keys.push(lower);
    }
  });
  debugMeta.llm = {
    ...debugMeta.llm,
    seenRateLimitHeaders: Array.from(new Set(keys)).sort(),
    updatedAt: new Date().toISOString()
  };
}
