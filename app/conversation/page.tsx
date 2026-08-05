"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Audience = "adolescent" | "adult" | "senior";
type EngineMode = "local" | "governed";
type Turn = { role: "user" | "assistant"; text: string; nextStep?: string };
type SpeechResultEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } };
type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionConstructor = new () => BrowserRecognition;

const MODELS: Record<Audience, { label: string; rate: number; pitch: number; starter: string }> = {
  adolescent: { label: "Adolescent", rate: 1.03, pitch: 1.02, starter: "Salut. Tu peux commencer comme tu veux. Qu’est-ce qui se passe ?" },
  adult: { label: "Adulte", rate: 0.98, pitch: 0.96, starter: "Bonjour. Prenez votre temps. Qu’est-ce qui vous amène aujourd’hui ?" },
  senior: { label: "Senior", rate: 0.84, pitch: 0.92, starter: "Bonjour. Prenons le temps. Qu’est-ce qui vous préoccupe aujourd’hui ?" },
};

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const target = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return target.SpeechRecognition ?? target.webkitSpeechRecognition ?? null;
}

export default function ConversationTestPage() {
  const [audience, setAudience] = useState<Audience>("adult");
  const [engineMode, setEngineMode] = useState<EngineMode>("governed");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", text: MODELS.adult.starter }]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notice, setNotice] = useState("");
  const [trace, setTrace] = useState("");
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const model = MODELS[audience];
  const lastAssistant = useMemo(() => [...turns].reverse().find((turn) => turn.role === "assistant"), [turns]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, loading]);
  useEffect(() => () => { recognitionRef.current?.stop(); window.speechSynthesis?.cancel(); }, []);

  function speak(text: string) {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = model.rate;
    utterance.pitch = model.pitch;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("fr"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function stopVoice() { window.speechSynthesis?.cancel(); }

  function reset(nextAudience = audience) {
    stopVoice();
    setTurns([{ role: "assistant", text: MODELS[nextAudience].starter }]);
    setMessage("");
    setTrace("");
    setNotice("Nouvelle conversation ouverte.");
  }

  function switchAudience(next: Audience) {
    setAudience(next);
    reset(next);
  }

  function toggleListening() {
    if (listening) { recognitionRef.current?.stop(); return; }
    const Recognition = recognitionConstructor();
    if (!Recognition) {
      setNotice("La reconnaissance vocale n’est pas disponible dans ce navigateur.");
      return;
    }
    stopVoice();
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setMessage(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setNotice("Le microphone n’a pas pu démarrer."); };
    recognitionRef.current = recognition;
    setListening(true);
    setNotice("ATLAS vous écoute.");
    recognition.start();
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    if (engineMode === "governed" && !consent) {
      setNotice("Activez le consentement pour tester le moteur génératif gouverné.");
      return;
    }
    const history = turns.map(({ role, text: turnText }) => ({ role, text: turnText }));
    setTurns((current) => [...current, { role: "user", text }]);
    setMessage("");
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          audience,
          history,
          externalAiConsent: engineMode === "governed" && consent,
          labMode: true,
        }),
      });
      const data = await response.json() as {
        error?: string;
        traceId?: string;
        reply?: { text?: string; nextStep?: string } | string;
        lab?: { source?: string };
      };
      if (!response.ok) throw new Error(data.error || "La conversation n’a pas pu être traitée.");
      const reply = typeof data.reply === "string"
        ? { text: data.reply }
        : { text: data.reply?.text || "ATLAS a reçu votre message.", nextStep: data.reply?.nextStep };
      setTurns((current) => [...current, { role: "assistant", ...reply }]);
      setTrace([data.lab?.source, data.traceId].filter(Boolean).join(" · "));
      speak([reply.text, reply.nextStep || ""].filter(Boolean).join(" "));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>LABORATOIRE DU CŒUR</small></span></Link>
        <Link href="/test">Centre de test</Link>
      </header>

      <section className="portal-hero compact">
        <p className="kicker">CONVERSATION / MÉMOIRE / VOIX</p>
        <h1>Tester le véritable cœur conversationnel.</h1>
        <p className="lead">Le mode local vérifie les garde-fous. Le mode gouverné mobilise le moteur génératif avec la mémoire, la sécurité et les contrôles ATLAS.</p>
      </section>

      <section className="portal-panel">
        <p className="kicker">PUBLIC</p>
        <div className="readiness-row">
          {(Object.keys(MODELS) as Audience[]).map((key) => (
            <button key={key} type="button" onClick={() => switchAudience(key)} aria-pressed={audience === key}>{MODELS[key].label}</button>
          ))}
        </div>
        <p className="kicker">MOTEUR</p>
        <div className="readiness-row">
          <button type="button" onClick={() => setEngineMode("local")} aria-pressed={engineMode === "local"}>Local sécurisé</button>
          <button type="button" onClick={() => setEngineMode("governed")} aria-pressed={engineMode === "governed"}>ATLAS gouverné</button>
        </div>
        {engineMode === "governed" && (
          <label>
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            J’autorise l’envoi de cette conversation au fournisseur d’intelligence externe pour ce test.
          </label>
        )}
      </section>

      <section className="portal-panel" aria-live="polite">
        <div style={{ display: "grid", gap: "1rem", maxHeight: "52vh", overflowY: "auto" }}>
          {turns.map((turn, index) => (
            <article key={`${turn.role}-${index}`} style={{ padding: "1rem", border: "1px solid rgba(25,25,25,.18)", borderRadius: "1rem", marginLeft: turn.role === "user" ? "10%" : 0, marginRight: turn.role === "assistant" ? "10%" : 0 }}>
              <small>{turn.role === "assistant" ? "ATLAS" : "VOUS"}</small>
              <p>{turn.text}</p>
              {turn.nextStep && <p>{turn.nextStep}</p>}
            </article>
          ))}
          {loading && <p>ATLAS prépare sa réponse…</p>}
          <div ref={endRef} />
        </div>
      </section>

      <section className="portal-panel">
        <form onSubmit={send} className="auth-form">
          <label htmlFor="conversation-message">Votre message</label>
          <textarea id="conversation-message" value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={6000} rows={5} placeholder="Écrivez ou utilisez le microphone…" />
          <div className="readiness-row">
            <button type="button" onClick={toggleListening}>{listening ? "Arrêter le micro" : "Parler"}</button>
            <button className="primary" type="submit" disabled={loading || !message.trim()}>{loading ? "Réponse…" : "Envoyer"}</button>
            <button type="button" onClick={() => lastAssistant && speak(lastAssistant.text)} disabled={!lastAssistant}>Répéter</button>
            <button type="button" onClick={stopVoice}>Arrêter la voix</button>
            <button type="button" onClick={() => setVoiceEnabled((value) => !value)}>Voix : {voiceEnabled ? "activée" : "désactivée"}</button>
            <button type="button" onClick={() => reset()}>Nouvelle conversation</button>
          </div>
          {notice && <p className="notice">{notice}</p>}
          {trace && <small>Trace laboratoire : {trace}</small>}
        </form>
      </section>
    </main>
  );
}
