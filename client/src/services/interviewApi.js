const API = import.meta.env.VITE_API_BASE_URL || "/api";
const DIRECT_LOCAL_API = "http://localhost:4000/api";

async function parseJsonOrThrow(response) {
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const fallback = raw?.startsWith("<!DOCTYPE")
      ? "Server returned HTML instead of JSON. Check backend/proxy and restart the server."
      : "Request failed.";
    throw new Error(data?.message || fallback);
  }

  if (data === null) {
    const fallback = raw?.startsWith("<!DOCTYPE")
      ? "Server returned HTML instead of JSON. Check backend/proxy and restart the server."
      : "Invalid JSON response from server.";
    throw new Error(fallback);
  }

  return data;
}

async function requestJson(path, init) {
  const primary = await fetch(`${API}${path}`, init);
  const contentType = primary.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html");

  // If dev proxy is not active, /api can return index.html.
  // Retry once against direct backend URL for local testing.
  if (isHtml && API.startsWith("/")) {
    const fallback = await fetch(`${DIRECT_LOCAL_API}${path}`, init);
    return parseJsonOrThrow(fallback);
  }

  return parseJsonOrThrow(primary);
}

export async function evaluateCv(formData, token) {
  return requestJson("/evaluate-cv", {
    method: "POST",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData
  });
}

export async function submitInterviewAnswer(payload, token) {
  return requestJson("/answer", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(payload)
  });
}

export async function finishInterviewEarly(payload, token) {
  return requestJson("/finish-early", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(payload)
  });
}

export async function fetchSessionState(sessionId, token) {
  return requestJson(`/session/${sessionId}`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
  });
}

export async function fetchDebugLogs() {
  try {
    const data = await requestJson("/debug-logs");
    if (Array.isArray(data)) {
      return {
        logs: data,
        openrouterRateLimit: null,
        openrouterKeyRateLimit: null,
        openrouterKeyError: null,
        llm: null
      };
    }
    return {
      logs: Array.isArray(data?.logs) ? data.logs : [],
      openrouterRateLimit: data?.openrouterRateLimit || null,
      openrouterKeyRateLimit: data?.openrouterKeyRateLimit || null,
      openrouterKeyError: data?.openrouterKeyError || null,
      llm: data?.llm || null
    };
  } catch {
    return {
      logs: [],
      openrouterRateLimit: null,
      openrouterKeyRateLimit: null,
      openrouterKeyError: null,
      llm: null
    };
  }
}
