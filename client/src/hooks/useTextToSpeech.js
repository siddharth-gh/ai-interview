import { useEffect, useRef, useState } from "react";

export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  const lastSpokenRef = useRef("");

  function speak(text) {
    if (!synthRef.current || !text || text === lastSpokenRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    lastSpokenRef.current = text;
    // Force the browser to interpret the text as English
    utterance.lang = "en-US";
    
    // Pick a professional sounding voice
    const voices = synthRef.current.getVoices();
    // Filter for English voices that sound natural
    const preferredVoice = voices.find(v => 
      (v.lang.startsWith("en")) && 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Microsoft Zira"))
    ) || voices.find(v => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setSpeaking(false);
    };

    synthRef.current.speak(utterance);
  }

  function stop() {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeaking(false);
    }
  }

  useEffect(() => {
    // Ensure voices are loaded (some browsers load them async)
    const handleVoicesChanged = () => synthRef.current.getVoices();
    synthRef.current.addEventListener('voiceschanged', handleVoicesChanged);
    
    return () => {
      synthRef.current.removeEventListener('voiceschanged', handleVoicesChanged);
      stop();
    };
  }, []);

  return { speak, stop, speaking };
}
