"use client";

import { useState } from "react";
import type { AtlasAudience } from "../../lib/atlas/types";
import { assessSafety } from "../../lib/atlas/safety";
import { buildReply, type AtlasReply } from "../../lib/atlas/conversation";
import { extractTranscript, getSpeechRecognitionConstructor, speakAtlasText } from "../../lib/atlas/voice";
import { trackAtlasEvent } from "../../lib/atlas/analytics";

interface ConversationSessionProps {
  audience: AtlasAudience;
  analyticsConsent: boolean;
  onPhase: (phase: "listening" | "thinking" | "speaking" | "ready" | "vigilance") => void;
}

export function ConversationSession({ audience, analyticsConsent, onPhase }: ConversationSessionProps) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<AtlasReply | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [externalAiConsent, setExternalAiConsent] = useState(false);
  const [source, setSource] = useState<"local" | "external" | "local_fallback" | null>(null);
  const [voiceAvailable] = useState(() => typeof window !== "undefined" && Boolean(getSpeechRecognitionConstructor()));

  async function submit() {
    const value = input.trim();
    if (!value || isSubmitting) return;
    const assessment = assessSafety(value, audience);
    trackAtlasEvent({ name: "conversation_submitted", audience, timestamp: Date.now(), metadata: { safetyLevel: assessment.level } }, analyticsConsent);
    if (assessment.level === "attention") trackAtlasEvent({ name: "safety_attention", audience, timestamp: Date.now() }, analyticsConsent);
    if (assessment.level === "urgent") trackAtlasEvent({ name: "safety_urgent", audience, timestamp: Date.now() }, analyticsConsent);
    onPhase(assessment.level === "urgent" ? "vigilance" : "listening");
    setIsSubmitting(true);
    setReply(null);
    setSource(null);
    window.setTimeout(() => onPhase(assessment.level === "urgent" ? "vigilance" : "thinking"), 180);

    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, audience, externalAiConsent }),
      });
      if (!response.ok) throw new Error("conversation_unavailable");
      const payload = await response.json() as { reply?: AtlasReply; source?: "local" | "external" | "local_fallback" };
      if (!payload.reply) throw new Error("invalid_reply");
      setReply(payload.reply);
      setSource(payload.source ?? "local");
    } catch {
      setReply(buildReply(value, audience, assessment));
      setSource("local_fallback");
    } finally {
      setIsSubmitting(false);
      if (assessment.level !== "urgent") {
        onPhase("speaking");
        window.setTimeout(() => onPhase("ready"), 900);
      }
    }
  }

  function startVoice() {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = extractTranscript(event);
      if (transcript) setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    setIsListening(true);
    trackAtlasEvent({ name: "voice_started", audience, timestamp: Date.now() }, analyticsConsent);
    recognition.start();
  }

  function eraseSession() {
    setInput("");
    setReply(null);
    setSource(null);
    setExternalAiConsent(false);
    onPhase("ready");
  }

  return (
    <section className="conversation-panel" aria-labelledby="conversation-title">
      <div className="conversation-header">
        <div><p className="kicker">SESSION ATLAS</p><h2 id="conversation-title">Parler, clarifier, agir.</h2></div>
        <button onClick={eraseSession}>Effacer la session</button>
      </div>
      <div className="conversation-grid">
        <div className="conversation-input">
          <label htmlFor="atlas-session-input">Décrivez ce qui se passe</label>
          <textarea id="atlas-session-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Le texte reste limité à cette requête et n’est jamais enregistré dans les préférences ou les analytics." />
          <label className="consent-control">
            <input type="checkbox" checked={externalAiConsent} onChange={(event) => setExternalAiConsent(event.target.checked)} />
            <span>Autoriser l’envoi de ce message au moteur IA externe pour cette session uniquement.</span>
          </label>
          <div className="composer-actions">
            <button onClick={startVoice} disabled={!voiceAvailable || isSubmitting}>{voiceAvailable ? (isListening ? "Écoute en cours…" : "Parler") : "Voix indisponible"}</button>
            <button className="primary" onClick={submit} disabled={isSubmitting}>{isSubmitting ? "Interprétation…" : "Analyser avec ATLAS"}</button>
          </div>
        </div>
        <div className="conversation-output" aria-live="polite" aria-busy={isSubmitting}>
          {reply ? <>
            <p className="atlas-response">{reply.text}</p>
            <div className="next-step"><span>PROCHAIN PAS</span><strong>{reply.nextStep}</strong></div>
            <div className="response-labels">{reply.labels.map((label) => <span key={label}>{label}</span>)}</div>
            <p className="response-source">{source === "external" ? "Réponse assistée par IA externe, sans conservation ATLAS." : source === "local_fallback" ? "Réponse locale de secours." : "Réponse locale ATLAS."}</p>
            <button onClick={() => speakAtlasText(reply.text, audience)}>Écouter la réponse</button>
          </> : <p className="empty-response">ATLAS affichera ici une réponse structurée, ses limites et une prochaine action.</p>}
        </div>
      </div>
    </section>
  );
}
