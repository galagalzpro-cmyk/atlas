"use client";

import { useState } from "react";
import type { AtlasAudience } from "../../lib/atlas/types";
import { assessSafety } from "../../lib/atlas/safety";
import { buildReply, type AtlasReply } from "../../lib/atlas/conversation";

interface ConversationSessionProps {
  audience: AtlasAudience;
  onPhase: (phase: "listening" | "thinking" | "speaking" | "ready" | "vigilance") => void;
}

export function ConversationSession({ audience, onPhase }: ConversationSessionProps) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<AtlasReply | null>(null);
  const [isListening, setIsListening] = useState(false);

  function submit() {
    const value = input.trim();
    if (!value) return;
    const assessment = assessSafety(value, audience);
    onPhase(assessment.level === "urgent" ? "vigilance" : "listening");
    window.setTimeout(() => onPhase(assessment.level === "urgent" ? "vigilance" : "thinking"), 350);
    window.setTimeout(() => {
      setReply(buildReply(value, audience, assessment));
      onPhase(assessment.level === "urgent" ? "vigilance" : "speaking");
    }, 850);
    window.setTimeout(() => onPhase(assessment.level === "urgent" ? "vigilance" : "ready"), 2000);
  }

  function speakReply() {
    if (!reply || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply.text);
    utterance.lang = "fr-FR";
    utterance.rate = audience === "senior" ? 0.82 : 0.94;
    window.speechSynthesis.speak(utterance);
  }

  function startVoice() {
    const SpeechRecognitionCtor = (window as typeof window & { webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (event: { results: { 0: { 0: { transcript: string } } }[] }) => void; onend: () => void; onerror: () => void; start: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  }

  return (
    <section className="conversation-panel" aria-labelledby="conversation-title">
      <div className="conversation-header">
        <div><p className="kicker">SESSION ATLAS</p><h2 id="conversation-title">Parler, clarifier, agir.</h2></div>
        <button onClick={() => { setInput(""); setReply(null); onPhase("ready"); }}>Effacer la session</button>
      </div>
      <div className="conversation-grid">
        <div className="conversation-input">
          <label htmlFor="atlas-session-input">Décrivez ce qui se passe</label>
          <textarea id="atlas-session-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Le texte reste dans cette session locale et n’est pas enregistré dans les préférences." />
          <div className="composer-actions">
            <button onClick={startVoice}>{isListening ? "Écoute en cours…" : "Parler"}</button>
            <button className="primary" onClick={submit}>Analyser avec ATLAS</button>
          </div>
        </div>
        <div className="conversation-output" aria-live="polite">
          {reply ? <>
            <p className="atlas-response">{reply.text}</p>
            <div className="next-step"><span>PROCHAIN PAS</span><strong>{reply.nextStep}</strong></div>
            <div className="response-labels">{reply.labels.map((label) => <span key={label}>{label}</span>)}</div>
            <button onClick={speakReply}>Écouter la réponse</button>
          </> : <p className="empty-response">ATLAS affichera ici une réponse structurée, ses limites et une prochaine action.</p>}
        </div>
      </div>
    </section>
  );
}
