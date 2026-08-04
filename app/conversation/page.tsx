"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Audience = "adolescent" | "adult" | "senior";
type Turn = { role: "user" | "assistant"; text: string; nextStep?: string; labels?: string[] };
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

const MODELS: Record<Audience, { label: string; description: string; rate: number; pitch: number; starter: string }> = {
  adolescent: {
    label: "Adolescent",
    description: "Direct, discret, non infantilisant, orienté vers la sécurité et les adultes de confiance.",
    rate: 1.03,
    pitch: 1.02,
    starter: "Salut. Vous pouvez parler franchement. Qu’est-ce qui se passe ?",
  },
  adult: {
    label: "Adulte",
    description: "Structuré, analytique et concret : faits, émotions, besoins et décision suivante.",
    rate: 0.98,
    pitch: 0.96,
    starter: "Bonjour. Décrivez la situation comme elle vient ; nous allons la clarifier ensemble.",
  },
  senior: {
    label: "Senior",
    description: "Phrases courtes, rythme calme, une seule étape à la fois et priorité à la voix.",
    rate: 0.84,
    pitch: 0.92,
    starter: "Bonjour. Prenons le temps. Qu’est-ce qui vous préoccupe le plus aujourd’hui ?",
  },
};

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const target = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return target.SpeechRecognition ?? target.webkitSpeechRecognition ?? null;
}

export default function ConversationTestPage() {
  const [audience, setAudience] = useState<Audience>("adult");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", text: MODELS.adult.starter }]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notice, setNotice] = useState("");
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const model = MODELS[audience];
  const lastAssistant = useMemo(() => [...turns].reverse().find((turn) => turn.role === "assistant"), [turns]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  function speak(text: string) {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = model.rate;
    utterance.pitch = model.pitch;
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("fr"));
    if (frenchVoice) utterance.voice = frenchVoice;
    window.speechSynthesis.speak(utterance);
  }

  function stopVoice() {
    window.speechSynthesis?.cancel();
  }

  function switchAudience(next: Audience) {
    stopVoice();
    setAudience(next);
    setTurns([{ role: "assistant", text: MODELS[next].starter }]);
    setMessage("");
    setNotice(`Modèle ${MODELS[next].label} activé.`);
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = recognitionConstructor();
    if (!Recognition) {
      setNotice("La reconnaissance vocale n’est pas disponible dans ce navigateur. Utilisez Chrome ou Samsung Internet et autorisez le microphone.");
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
    recognition.onerror = () => {
      setListening(false);
      setNotice("Le microphone n’a pas démarré. Vérifiez son autorisation dans le navigateur.");
    };
    recognitionRef.current = recognition;
    setNotice("Parlez maintenant.");
    setListening(true);
    recognition.start();
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    const history = turns.map(({ role, text: turnText }) => ({ role, text: turnText }));
    setTurns((current) => [...current, { role: "user", text }]);
    setMessage("");
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, audience, history, externalAiConsent: false }),
      });
      const data = await response.json() as {
        error?: string;
        reply?: { text?: string; nextStep?: string; labels?: string[] } | string;
      };
      if (!response.ok) throw new Error(data.error || "La conversation n’a pas pu être traitée.");
      const reply = typeof data.reply === "string"
        ? { text: data.reply }
        : {
          text: data.reply?.text || "ATLAS a reçu votre message.",
          nextStep: data.reply?.nextStep,
          labels: data.reply?.labels,
        };
      setTurns((current) => [...current, { role: "assistant", ...reply }]);
      speak([reply.text, reply.nextStep ? `Prochaine étape : ${reply.nextStep}` : ""].filter(Boolean).join(" "));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function resetConversation() {
    stopVoice();
    setTurns([{ role: "assistant", text: model.starter }]);
    setMessage("");
    setNotice("Conversation réinitialisée.");
  }

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>MOTEUR CONVERSATIONNEL</small></span></Link>
        <Link href="/test">Centre de test</Link>
      </header>

      <section className="portal-hero compact">
        <p className="kicker">VOIX / CONVERSATION / MODÈLES ADAPTATIFS</p>
        <h1>Tester le moteur ATLAS en conversation réelle.</h1>
        <p className="lead">Choisissez un modèle, parlez ou écrivez, puis laissez ATLAS répondre à l’écran et à voix haute.</p>
      </section>

      <section className="portal-panel">
        <div className="readiness-row">
          {(Object.keys(MODELS) as Audience[]).map((key) => (
            <button key={key} type="button" onClick={() => switchAudience(key)} aria-pressed={audience === key}>
              {MODELS[key].label}
            </button>
          ))}
        </div>
        <p><strong>Modèle actif : {model.label}</strong> — {model.description}</p>
      </section>

      <section className="portal-panel" aria-live="polite">
        <div style={{ display: "grid", gap: "1rem", maxHeight: "52vh", overflowY: "auto", paddingRight: ".25rem" }}>
          {turns.map((turn, index) => (
            <article key={`${turn.role}-${index}`} style={{ padding: "1rem", border: "1px solid rgba(25,25,25,.18)", borderRadius: "1rem", marginLeft: turn.role === "user" ? "10%" : 0, marginRight: turn.role === "assistant" ? "10%" : 0 }}>
              <small>{turn.role === "assistant" ? "ATLAS" : "VOUS"}</small>
              <p>{turn.text}</p>
              {turn.nextStep && <p><strong>Prochaine étape :</strong> {turn.nextStep}</p>}
              {turn.labels?.length ? <small>{turn.labels.join(" · ")}</small> : null}
            </article>
          ))}
          {loading && <p>ATLAS structure la réponse…</p>}
          <div ref={endRef} />
        </div>
      </section>

      <section className="portal-panel">
        <form onSubmit={send} className="auth-form">
          <label htmlFor="conversation-message">Votre message</label>
          <textarea id="conversation-message" value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={6000} rows={5} placeholder="Parlez ou écrivez ici…" />
          <div className="readiness-row">
            <button type="button" onClick={toggleListening}>{listening ? "Arrêter le micro" : "Parler"}</button>
            <button className="primary" type="submit" disabled={loading || !message.trim()}>{loading ? "Analyse…" : "Envoyer"}</button>
            <button type="button" onClick={() => lastAssistant && speak([lastAssistant.text, lastAssistant.nextStep || ""].join(" "))} disabled={!lastAssistant}>Répéter la réponse</button>
            <button type="button" onClick={stopVoice}>Arrêter la voix</button>
            <button type="button" onClick={() => setVoiceEnabled((value) => !value)}>Voix automatique : {voiceEnabled ? "activée" : "désactivée"}</button>
            <button type="button" onClick={resetConversation}>Nouvelle conversation</button>
          </div>
          {notice && <p className="notice">{notice}</p>}
        </form>
      </section>

      <section className="portal-panel">
        <p className="kicker">COMMANDES VOCALES À TESTER</p>
        <p>Dites par exemple : « Je suis stressé par mon travail », « Je me sens seul », « Je dois prendre une décision », « Je ne sais pas quoi répondre » ou « Les réseaux sociaux me prennent trop de temps ».</p>
        <p>ATLAS reste un système de clarification et d’orientation. Il ne remplace pas les secours ni un professionnel de santé.</p>
      </section>
    </main>
  );
}
