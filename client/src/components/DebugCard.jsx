import { useEffect, useState } from "react";
import { fetchDebugLogs } from "../services/interviewApi";

function DebugCard() {
  const [logs, setLogs] = useState([]);
  const [rateLimit, setRateLimit] = useState(null);
  const [keyRateLimit, setKeyRateLimit] = useState(null);
  const [keyRateLimitError, setKeyRateLimitError] = useState(null);
  const [llm, setLlm] = useState(null);

  useEffect(() => {
    fetchDebugLogs()
      .then((data) => {
        setLogs(data.logs || []);
        setRateLimit(data.openrouterRateLimit || null);
        setKeyRateLimit(data.openrouterKeyRateLimit || null);
        setKeyRateLimitError(data.openrouterKeyError || null);
        setLlm(data.llm || null);
      })
      .catch(() => {});
    const timer = setInterval(async () => {
      try {
        const data = await fetchDebugLogs();
        setLogs(data.logs || []);
        setRateLimit(data.openrouterRateLimit || null);
        setKeyRateLimit(data.openrouterKeyRateLimit || null);
        setKeyRateLimitError(data.openrouterKeyError || null);
        setLlm(data.llm || null);
      } catch {
        // ignore
      }
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const effectiveRateLimit = keyRateLimit || rateLimit;

  return (
    <div className="flex h-96 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl dark:border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-mono text-xs font-semibold text-cyan-400">AI DEBUG STREAM</h3>
          <p className="truncate font-mono text-[10px] text-slate-500">
            {llm?.provider ?? "provider:n/a"} | {llm?.model ?? "model:n/a"} | {llm?.status ?? "idle"} | headers:{Array.isArray(llm?.seenRateLimitHeaders) ? llm.seenRateLimitHeaders.length : 0}
          </p>
          {keyRateLimitError ? (
            <p className="truncate font-mono text-[10px] text-rose-400">
              key endpoint: {keyRateLimitError}
            </p>
          ) : null}
        </div>
        <span className="font-mono text-[10px] text-slate-500">{logs.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300">
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-600">Waiting for AI activity...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    log.type === "prompt" ? "bg-blue-900/50 text-blue-400" :
                    log.type === "response" ? "bg-emerald-900/50 text-emerald-400" :
                    log.type === "info" ? "bg-amber-900/50 text-amber-400" :
                    "bg-rose-900/50 text-rose-400"
                  }`}>
                    {log.type}
                  </span>
                </div>
                <div className="rounded bg-slate-800/50 p-2 text-slate-400">
                  <pre className="whitespace-pre-wrap break-words">{log.content}</pre>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}

export default DebugCard;
