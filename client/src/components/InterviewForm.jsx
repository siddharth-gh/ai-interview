import { useEffect, useRef, useState } from "react";
import { analyzeFace, loadModels } from "../services/faceAnalysisService";

function InterviewForm({
  reviews,
  progress,
  currentQuestion,
  readyQuestions,
  recording,
  waitingForQuestion,
  onToggleRecording,
  audioUrl,
  recordingSupported,
  transcriptStatus,
  answer,
  onAnswerChange,
  sessionId,
  onSubmit,
  onFinishEarly,
  questionsLeft,
  aiSpeaking,
  onToggleVoice,
  voiceEnabled,
  developerMode
}) {
  const videoRef = useRef(null);
  const [metrics, setMetrics] = useState({ eyeContact: 0, confidence: 0 });
  const [cameraEnabled, setCameraEnabled] = useState(true);

  useEffect(() => {
    let interval;
    let currentStream = null;
    let isCancelled = false;

    if (cameraEnabled && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(async stream => {
          if (isCancelled) {
            // The user toggled the camera off before the stream finished loading.
            // Instantly kill the stream.
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            // Try to load models and start analysis
            try {
              await loadModels();
              interval = setInterval(async () => {
                if (videoRef.current && !isCancelled) {
                  const results = await analyzeFace(videoRef.current);
                  if (results) {
                    setMetrics({
                      eyeContact: results.eyeContact,
                      confidence: results.confidence
                    });
                  }
                }
              }, 1000);
            } catch (err) {
              console.error("Face models failed to load. Live monitoring disabled.", err);
              if (!isCancelled) setMetrics({ eyeContact: 0, confidence: 0 });
            }
          }
        })
        .catch(err => console.error("Webcam error:", err));
    }
    
    return () => {
      isCancelled = true;
      if (interval) clearInterval(interval);
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraEnabled]);
  const previewQuestions = readyQuestions
    .filter((item) => item?.text && item.text !== currentQuestion?.text)
    .slice(0, 2);


  return (
    <form id="interview-form" onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>Question {reviews.length + 1} of 10</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-slate-100 p-5 dark:bg-slate-800">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {aiSpeaking && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:0.2s]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:0.4s]"></span>
              <span className="text-xs font-medium text-cyan-500">AI Speaking...</span>
            </div>
          )}
        </div>
        <p className="text-lg font-semibold">{currentQuestion.text}</p>
        {!voiceEnabled && (
          <p className="mt-2 text-xs font-medium text-slate-400">Voice feedback is muted</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-inner flex items-center justify-center">
          {cameraEnabled ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover grayscale-[0.5] contrast-[1.2]"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 backdrop-blur-md">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-medium text-white">Live Monitoring</span>
              </div>
            </>
          ) : (
            <div className="text-slate-500 flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.875 13.875A2.99 2.99 0 0 1 12 15a3 3 0 0 1-3-3c0-.71.246-1.365.655-1.885"/><path d="M15 15a3 3 0 0 0-3-3"/><path d="M18 18c-.894 0-1.743-.194-2.5-.54"/><path d="M21 15v-4"/><path d="M3 15v-4"/><path d="M6.07 6.07a9 9 0 0 1 11.86 0"/><path d="M9.13 9.13a5 5 0 0 1 5.74 0"/></svg>
              <span className="text-sm font-medium">Camera Disabled</span>
            </div>
          )}
        </div>
      </div>

      {(previewQuestions.length > 0 || Math.min(2, 10 - (reviews.length + 1)) > 0) && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <p className="font-medium text-slate-700 dark:text-slate-200">Next ready questions</p>
          <div className="mt-3 space-y-3">
            {previewQuestions.map((item, index) => (
              <div key={`${item?.id ?? index}-${item?.text ?? index}`} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="font-medium text-slate-800 dark:text-slate-100">{item?.text || "Question loading..."}</p>
              </div>
            ))}
            {Array.from({ length: Math.max(0, Math.min(2, 10 - (reviews.length + 1)) - previewQuestions.length) }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex animate-pulse items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <svg className="h-4 w-4 animate-spin text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={waitingForQuestion}
          onClick={onToggleRecording}
          className="rounded-2xl border border-cyan-500 px-5 py-3 font-medium text-cyan-700 disabled:opacity-60 dark:text-cyan-300"
        >
          {recording ? "Stop recording" : "Record answer"}
        </button>

        <button
          type="button"
          onClick={onToggleVoice}
          className={`rounded-2xl px-5 py-3 font-medium transition-all ${
            voiceEnabled 
            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200" 
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          }`}
        >
          {voiceEnabled ? "Mute AI Voice" : "Unmute AI Voice"}
        </button>

        <button
          type="button"
          onClick={() => {
            setCameraEnabled(v => !v);
            if (cameraEnabled) setMetrics({ eyeContact: 0, confidence: 0 });
          }}
          className={`rounded-2xl px-5 py-3 font-medium transition-all ${
            cameraEnabled 
            ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200" 
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
        </button>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {waitingForQuestion
          ? "Please wait while the next question is generated."
          : recordingSupported
            ? transcriptStatus || "Record your answer, then edit the transcript before sending."
            : "Audio transcription is not supported here, so you can type your answer manually."}
      </p>

      <textarea
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        onCopy={developerMode ? undefined : (e) => { e.preventDefault(); alert("Copying is disabled during the interview."); }}
        onPaste={developerMode ? undefined : (e) => { e.preventDefault(); alert("Pasting is disabled during the interview."); }}
        rows="6"
        disabled={waitingForQuestion}
        className="w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-cyan-500 dark:border-slate-700"
        placeholder="Your transcript will appear here. Edit it before sending..."
      />

      <button
        disabled={!sessionId || waitingForQuestion || recording}
        className="rounded-2xl bg-cyan-600 px-5 py-3 font-medium text-white disabled:opacity-60"
      >
        {!sessionId ? "Waiting for setup..." : waitingForQuestion ? "Please wait..." : recording ? "Stop recording first..." : "Submit answer"}
      </button>

      <button
        type="button"
        onClick={onFinishEarly}
        disabled={!sessionId || waitingForQuestion || recording}
        className="rounded-2xl border border-amber-500 px-5 py-3 font-medium text-amber-700 disabled:opacity-60 dark:text-amber-300"
      >
        Finish Interview Early ({questionsLeft} left)
      </button>
    </form>
  );
}

export default InterviewForm;
