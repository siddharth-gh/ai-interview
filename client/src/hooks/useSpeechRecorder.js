import { useEffect, useRef, useState } from "react";

export function useSpeechRecorder({ waitingForQuestion, setAnswer }) {
  const [recording, setRecording] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [transcriptStatus, setTranscriptStatus] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setRecordingSupported(Boolean(SpeechRecognition && navigator.mediaDevices?.getUserMedia));

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore stale instance stop errors
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  function clearArtifacts() {
    setTranscriptStatus("");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }
  }

  function stopRecording() {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  async function startRecording() {
    if (waitingForQuestion) return;
    setTranscriptStatus("");
    setAnswer("");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !navigator.mediaDevices?.getUserMedia) {
      setTranscriptStatus("Speech-to-text is not supported in this browser.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return URL.createObjectURL(blob);
      });
    };

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    speechRecognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(transcript.trim());
      setTranscriptStatus("Transcript is ready. You can edit it before sending.");
    };

    recognition.onerror = () => {
      setTranscriptStatus("Could not transcribe the audio. You can still edit or type manually.");
    };

    recognition.onend = () => {
      setRecording(false);
    };

    mediaRecorder.start();
    recognition.start();
    setRecording(true);
    setTranscriptStatus("Listening...");
  }

  return {
    recording,
    recordingSupported,
    transcriptStatus,
    audioUrl,
    clearArtifacts,
    stopRecording,
    startRecording
  };
}
