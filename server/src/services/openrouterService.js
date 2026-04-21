import { OPENROUTER_API_KEY } from "../config/constants.js";

const OPENROUTER_KEY_URL = "https://openrouter.ai/api/v1/key";
const CACHE_TTL_MS = 15000;

const cache = {
  value: null,
  fetchedAt: 0
};

function normalizeKeyPayload(payload) {
  const data = payload?.data || payload || {};
  const rate = data?.rate_limit || data?.rateLimit || {};

  const limit =
    rate?.limit ??
    rate?.requests ??
    data?.limit ??
    data?.requests ??
    null;

  const remaining =
    rate?.remaining ??
    data?.remaining ??
    null;

  const reset =
    rate?.reset ??
    rate?.interval ??
    data?.reset ??
    null;

  const tokenLimit =
    rate?.token_limit ??
    rate?.tokens_limit ??
    data?.token_limit ??
    data?.tokens_limit ??
    null;

  const tokenRemaining =
    rate?.token_remaining ??
    rate?.tokens_remaining ??
    data?.token_remaining ??
    data?.tokens_remaining ??
    null;

  return {
    limit: limit == null ? null : String(limit),
    remaining: remaining == null ? null : String(remaining),
    reset: reset == null ? null : String(reset),
    tokenLimit: tokenLimit == null ? null : String(tokenLimit),
    tokenRemaining: tokenRemaining == null ? null : String(tokenRemaining),
    source: "key_endpoint"
  };
}

export async function getOpenRouterKeyRateLimit(force = false) {
  if (!OPENROUTER_API_KEY) {
    return {
      rateLimit: null,
      error: "OPENROUTER_API_KEY is not configured.",
      fromCache: false
    };
  }

  const fresh = Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (!force && fresh && cache.value) {
    return { ...cache.value, fromCache: true };
  }

  try {
    const response = await fetch(OPENROUTER_KEY_URL, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      const value = {
        rateLimit: null,
        error: `Key endpoint error (${response.status}): ${text.slice(0, 120)}`
      };
      cache.value = value;
      cache.fetchedAt = Date.now();
      return { ...value, fromCache: false };
    }

    const json = await response.json();
    const value = {
      rateLimit: normalizeKeyPayload(json),
      error: null
    };
    cache.value = value;
    cache.fetchedAt = Date.now();
    return { ...value, fromCache: false };
  } catch (err) {
    const value = {
      rateLimit: null,
      error: `Key endpoint fetch failed: ${err.message}`
    };
    cache.value = value;
    cache.fetchedAt = Date.now();
    return { ...value, fromCache: false };
  }
}

