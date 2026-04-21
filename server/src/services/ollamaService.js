import { 
  AI_PROVIDER,
  GOOGLE_AI_API_KEY,
  GOOGLE_AI_MODEL,
  GOOGLE_AI_URL,
  OLLAMA_URL, 
  OLLAMA_MODEL, 
  OLLAMA_TIMEOUT_MS, 
  OPENROUTER_API_KEY, 
  OPENROUTER_URL, 
  OPENROUTER_MODEL 
} from "../config/constants.js";
import { addLog, setOpenRouterRateLimit, setLlmMeta, setSeenRateLimitHeaders } from "../store/debugStore.js";

/**
 * Robustly extract JSON from LLM text that may contain markdown fences,
 * thinking tags, preamble, or other noise around the actual JSON object.
 */
function extractJson(raw) {
  let text = raw || "";

  // 1. Strip markdown code fences: ```json ... ``` or ``` ... ```
  text = text.replace(/```(?:json)?\s*\n?/gi, "").replace(/```/g, "");

  // 2. Strip <think>...</think> or <thinking>...</thinking> blocks
  text = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "");

  // 3. Strip lines that are clearly not JSON (e.g., "Here is the JSON:", "Note: ...")
  text = text.replace(/^[^{\[]*?(\{)/s, "$1"); // trim preamble before first {

  // 4. Try to find the outermost balanced JSON object or array
  const startIdx = text.search(/[{\[]/);
  if (startIdx === -1) {
    throw new Error("No JSON found in response");
  }

  const opener = text[startIdx];
  const closer = opener === "{" ? "}" : "]";
  
  // Find the matching closing bracket using depth counting
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === opener) depth++;
    else if (ch === closer) {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(startIdx, i + 1);
        return JSON.parse(candidate);
      }
    }
  }

  // Fallback: greedy regex match
  const fallback = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (fallback) {
    return JSON.parse(fallback[0]);
  }

  throw new Error("Could not extract valid JSON from response");
}

export async function ollamaJson(prompt, options = {}) {
  const forceLocal = options.forceLocal || false;
  const provider = forceLocal
    ? "ollama"
    : AI_PROVIDER === "google"
      ? "google"
      : AI_PROVIDER === "openrouter"
        ? "openrouter"
        : "ollama";
  const isOpenRouter = provider === "openrouter";
  const isGoogle = provider === "google";
  const controller = new AbortController();
  const timeoutVal = options.timeout || OLLAMA_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutVal);

  try {
    if (isGoogle && !GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is missing.");
    }
    if (isOpenRouter && !OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is missing.");
    }

    setLlmMeta({
      provider,
      model: isGoogle ? GOOGLE_AI_MODEL : isOpenRouter ? OPENROUTER_MODEL : OLLAMA_MODEL,
      status: "requesting",
      lastError: null
    });

    addLog(
      "info",
      `LLM Request: ${isGoogle ? "Google AI Studio (" + GOOGLE_AI_MODEL + ")" : isOpenRouter ? "OpenRouter (" + OPENROUTER_MODEL + ")" : "Local Ollama (" + OLLAMA_MODEL + ")"}`
    );
    addLog("prompt", prompt);

    let response;
    try {
      if (isGoogle) {
        // Gemma 3 works better when instructions are in the main prompt content
        const fullPrompt = `SYSTEM: You are a JSON-only API. You MUST output raw JSON with no markdown, no code fences, no explanations, no thinking, no preamble, and no postamble. Output ONLY the JSON object requested. Never wrap your response in blocks.\n\nUSER: ${prompt}`;
        
        response = await fetch(
          `${GOOGLE_AI_URL}/models/${encodeURIComponent(GOOGLE_AI_MODEL)}:generateContent?key=${encodeURIComponent(GOOGLE_AI_API_KEY)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: fullPrompt }]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: options.num_predict ?? 280
              }
            })
          }
        );
      } else if (isOpenRouter) {
        response = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Interview System"
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: options.num_predict ?? 280
          })
        });
      } else {
        response = await fetch(OLLAMA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt,
            stream: false,
            format: "json",
            context: options.context || undefined,
            options: {
              temperature: 0.4,
              num_predict: options.num_predict ?? 280,
              top_p: 0.9,
              top_k: 40
            }
          })
        });
      }
    } catch (fetchErr) {
      const msg = fetchErr.name === "AbortError" ? "Request timed out" : `Connection failed: ${fetchErr.message}`;
      addLog("error", msg);
      throw new Error(msg);
    }

    if (isOpenRouter) {
      setOpenRouterRateLimit(response.headers);
      setSeenRateLimitHeaders(response.headers);
    }

    if (!response.ok) {
      const errorText = await response.text();
      const errMsg = `API Error (${response.status}): ${errorText.slice(0, 150)}`;
      setLlmMeta({ status: `http_${response.status}`, lastError: errMsg });
      addLog("error", errMsg);
      throw new Error(errMsg);
    }

    const data = await response.json();
    let textStr;
    if (isGoogle) {
      textStr =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text || "")
          .join("") || "{}";
    } else if (isOpenRouter) {
      textStr = data.choices?.[0]?.message?.content;
    } else {
      textStr = data.response;
    }
    textStr = textStr || "{}";
    
    addLog("response", textStr);

    try {
      const parsed = extractJson(textStr);
      setLlmMeta({ status: "ok", lastError: null });
      return { json: parsed, context: provider === "ollama" ? data.context : null };
    } catch (err) {
      addLog("error", `JSON extraction failed. Raw text: ${textStr.slice(0, 300)}`);
      setLlmMeta({ status: "json_parse_error", lastError: err.message });
      throw new Error(`Failed to parse LLM response as JSON: ${err.message}`);
    }
  } catch (err) {
    setLlmMeta({ status: "error", lastError: err.message });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
