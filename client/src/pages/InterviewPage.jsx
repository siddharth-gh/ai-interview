import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import ErrorBanner from "../components/ErrorBanner";
import StartForm from "../components/StartForm";
import PreparingCard from "../components/PreparingCard";
import InterviewForm from "../components/InterviewForm";
import SummaryCard from "../components/SummaryCard";
import CvEvaluationCard from "../components/CvEvaluationCard";
import ReviewsCard from "../components/ReviewsCard";
import DebugCard from "../components/DebugCard";
import FinishEarlyModal from "../components/FinishEarlyModal";
import { evaluateCv, fetchSessionState, finishInterviewEarly, submitInterviewAnswer } from "../services/interviewApi";
import { useSpeechRecorder } from "../hooks/useSpeechRecorder";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const INTRO_QUESTION = {
  id: 1,
  text: "Give me a short introduction and walk through your background."
};

function InterviewPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [name, setName] = useState(user?.name || "");
  const [cv, setCv] = useState(null);
  const [devMode, setDevMode] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [interviewType, setInterviewType] = useState("technical");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [report, setReport] = useState(null);
  const [readyQuestions, setReadyQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [waitingForQuestion, setWaitingForQuestion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showFinishEarlyModal, setShowFinishEarlyModal] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [developerMode, setDeveloperMode] = useState(false);

  const {
    recording,
    recordingSupported,
    transcriptStatus,
    audioUrl,
    clearArtifacts,
    stopRecording,
    startRecording
  } = useSpeechRecorder({ waitingForQuestion, setAnswer });

  const { speak, stop: stopTTS, speaking: aiSpeaking } = useTextToSpeech();

  const tabSwitchesRef = useRef(0);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && sessionId && !summary && !preparing && !waitingForQuestion) {
        tabSwitchesRef.current += 1;
        if (tabSwitchesRef.current === 1) {
          alert("WARNING: Tab switching is strictly prohibited during the interview.\n\nIf you switch tabs again, your current answer will be automatically submitted and you will be forced to the next question.");
        } else if (tabSwitchesRef.current >= 2) {
          alert("You switched tabs again! Auto-submitting your current answer.");
          // Trigger form submission programmatically
          const form = document.getElementById("interview-form");
          if (form) {
            form.requestSubmit();
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionId, summary, preparing, waitingForQuestion]);

  useEffect(() => {
    if (currentQuestion?.text && !preparing && !summary && voiceEnabled) {
      const isTechnicalMsg = currentQuestion.id === "waiting" || 
                            currentQuestion.id === "loading" || 
                            currentQuestion.text.includes("Generating") ||
                            currentQuestion.text.includes("Waiting");
                            
      if (!isTechnicalMsg) {
        speak(currentQuestion.text);
      }
    }
  }, [currentQuestion, preparing, summary, voiceEnabled]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const progress = useMemo(() => Math.min(100, (reviews.length / 10) * 100), [reviews.length]);

  function clearAnswerArtifacts() {
    setAnswer("");
    clearArtifacts();
  }



  useEffect(() => {
    if (!sessionId || summary) return;
    const timer = setInterval(async () => {
      try {
        const data = await fetchSessionState(sessionId, user?.token);
        const ready = Array.isArray(data.readyQuestions) ? data.readyQuestions : [];
        setReadyQuestions(ready);
        if (Array.isArray(data.answers)) {
          setReviews(data.answers);
        }
        if (data.queueStalled) {
          setWaitingForQuestion(false);
          setError("AI model could not generate next questions. Please retry the interview.");
          return;
        }
        if (waitingForQuestion && ready.length > 0) {
          setCurrentQuestion(data.nextQuestion || ready[0]);
          setWaitingForQuestion(false);
        }
      } catch {
        // Keep polling quietly.
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [waitingForQuestion, sessionId, summary]);

  async function startInterview(e) {
    e.preventDefault();
    if (!name || !cv) return;

    setLoading(true);
    setPreparing(true);
    setCountdown(5);
    setError("");
    setCurrentQuestion(null);
    setReadyQuestions([]);
    setWaitingForQuestion(false);
    setSessionId("");
    setReport(null);
    setReviews([]);
    setSummary(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("devMode", devMode);
    formData.append("difficulty", difficulty);
    formData.append("interviewType", interviewType);
    formData.append("cv", cv);

    try {
      const data = await evaluateCv(formData, user?.token);
      setSessionId(data.sessionId);
      setReport(data.report);
      setReadyQuestions(Array.isArray(data.readyQuestions) ? data.readyQuestions : []);
      clearAnswerArtifacts();
      setLoading(false);

      // 5-second countdown while AI generates questions in the background
      let count = 5;
      setCountdown(count);
      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(timer);
          setCurrentQuestion(data.introQuestion || INTRO_QUESTION);
          setPreparing(false);
          setWaitingForQuestion(false);
        }
      }, 1000);
    } catch (err) {
      setPreparing(false);
      setSessionId("");
      setCurrentQuestion(null);
      setError(err?.message || "Could not reach the interview server.");
      setLoading(false);
    }
  }

  async function submitAnswer(e) {
    e.preventDefault();
    if (!sessionId || !currentQuestion || submitting) return;

    setSubmitting(true);
    try {
      const data = await submitInterviewAnswer({ sessionId, answer }, user?.token);
      if (data.submittedReview) {
        setReviews((prev) => {
          if (prev.find((r) => r.id === data.submittedReview.id)) return prev;
          return [...prev, data.submittedReview];
        });
      }
      setReadyQuestions(Array.isArray(data.readyQuestions) ? data.readyQuestions : []);
      clearAnswerArtifacts();

      if (data.done) {
        setCurrentQuestion(null);
        setSummary(data.summary);
        if (Array.isArray(data.answers)) {
          setReviews(data.answers);
        }
        setWaitingForQuestion(false);
        return;
      }

      if (data.queueError) {
        setWaitingForQuestion(false);
        setError(data.queueErrorMessage || "AI model could not generate next questions.");
        return;
      }

      if (data.waitingForQuestion || !data.nextQuestion) {
        setCurrentQuestion({
          id: "waiting",
          text: "🧠 AI is crafting your next question — hang tight..."
        });
        setWaitingForQuestion(true);
      } else {
        setCurrentQuestion(data.nextQuestion);
        setWaitingForQuestion(false);
      }
    } catch (err) {
      setError(err?.message || "Could not submit answer.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
      return;
    }
    startRecording();
  }

  function requestFinishEarly() {
    if (!sessionId || submitting || waitingForQuestion || recording) return;
    setShowFinishEarlyModal(true);
  }

  async function handleFinishEarly() {
    setSubmitting(true);
    try {
      const data = await finishInterviewEarly({ sessionId }, user?.token);
      if (Array.isArray(data.answers)) {
        setReviews(data.answers);
      }
      setSummary(data.summary || null);
      setCurrentQuestion(null);
      setWaitingForQuestion(false);
      setShowFinishEarlyModal(false);
    } catch (err) {
      setError(err?.message || "Could not finish interview early.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode((v) => !v)} />
        <ErrorBanner error={error} />

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] p-8"
          >
            {!sessionId && !preparing && !currentQuestion && (
              <StartForm
                name={name}
                onNameChange={setName}
                devMode={devMode}
                onDevModeChange={setDevMode}
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
                interviewType={interviewType}
                onInterviewTypeChange={setInterviewType}
                cv={cv}
                onCvChange={setCv}
                loading={loading}
                onSubmit={startInterview}
              />
            )}

            {preparing && <PreparingCard countdown={countdown} />}

            {sessionId && !preparing && currentQuestion && (
              <InterviewForm
                reviews={reviews}
                progress={progress}
                currentQuestion={currentQuestion}
                readyQuestions={readyQuestions}
                recording={recording}
                waitingForQuestion={waitingForQuestion || submitting}
                onToggleRecording={toggleRecording}
                audioUrl={audioUrl}
                recordingSupported={recordingSupported}
                transcriptStatus={transcriptStatus}
                answer={answer}
                onAnswerChange={setAnswer}
                sessionId={sessionId}
                onSubmit={submitAnswer}
                onFinishEarly={requestFinishEarly}
                questionsLeft={Math.max(0, 10 - reviews.length)}
                aiSpeaking={aiSpeaking}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => setVoiceEnabled(v => !v)}
                developerMode={developerMode}
              />
            )}

            <SummaryCard summary={summary} reviews={reviews} />
          </motion.div>

          <div className="space-y-6">
            <CvEvaluationCard report={report} />
            <ReviewsCard reviews={reviews} />
            {developerMode && <DebugCard />}
          </div>
        </div>
      </div>

      <FinishEarlyModal
        open={showFinishEarlyModal}
        questionsLeft={Math.max(0, 10 - reviews.length)}
        onCancel={() => setShowFinishEarlyModal(false)}
        onConfirm={handleFinishEarly}
        loading={submitting}
      />

      {/* Floating Developer Mode Toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/10 p-2 pl-4 pr-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur-xl transition-all hover:bg-white/20 hover:text-white border border-white/10 shadow-2xl">
          <span>Dev Mode</span>
          <input 
            type="checkbox" 
            className="sr-only" 
            checked={developerMode}
            onChange={(e) => setDeveloperMode(e.target.checked)}
          />
          <div className={`relative h-5 w-10 rounded-full transition-colors duration-300 ${developerMode ? 'bg-cyan-500/50' : 'bg-slate-800'}`}>
            <div className={`absolute top-1 left-1 h-3 w-3 rounded-full bg-white shadow-lg transition-transform duration-300 ${developerMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </label>
      </div>
    </div>
  );
}

export default InterviewPage;
