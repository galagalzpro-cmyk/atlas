"use client";

import Link from "next/link";
import { FormEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";

type Audience = "adolescent" | "adult" | "senior";
type PresenceState = "idle" | "listening" | "thinking" | "speaking" | "calm";
type QualityTier = "ultra" | "balanced" | "light";
type Turn = { role: "user" | "assistant"; text: string };
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

const AUDIENCES: Record<Audience, { label: string; rate: number; pitch: number; starter: string }> = {
  adolescent: { label: "Adolescents", rate: 1.02, pitch: 1.02, starter: "Salut. Tu peux commencer comme tu veux. Je t’écoute." },
  adult: { label: "Adultes", rate: 0.97, pitch: 0.96, starter: "Bonjour. Prenez votre temps. Je vous écoute." },
  senior: { label: "Seniors", rate: 0.84, pitch: 0.92, starter: "Bonjour. Prenons le temps. Je vous écoute." },
};

const STATE_COPY: Record<PresenceState, { label: string; detail: string }> = {
  idle: { label: "Présent", detail: "ATLAS est disponible." },
  listening: { label: "Écoute", detail: "Votre voix guide l’attention d’ATLAS." },
  thinking: { label: "Réflexion", detail: "ATLAS organise le contexte avant de répondre." },
  speaking: { label: "Réponse", detail: "La présence, la voix et le mouvement sont synchronisés." },
  calm: { label: "Calme", detail: "Le salon ralentit et laisse davantage d’espace." },
};

const SHARDS = Array.from({ length: 42 }, (_, index) => index);
const SIGNALS = Array.from({ length: 18 }, (_, index) => index);

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const target = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return target.SpeechRecognition ?? target.webkitSpeechRecognition ?? null;
}

function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "balanced";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "light";
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  const memory = navigatorWithMemory.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (memory >= 8 && cores >= 8 && window.innerWidth >= 1100) return "ultra";
  if (memory >= 4 && cores >= 4) return "balanced";
  return "light";
}

export default function AtlasConversationLounge() {
  const [audience, setAudience] = useState<Audience>("adult");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", text: AUDIENCES.adult.starter }]);
  const [conversationState, setConversationState] = useState<string | null>(null);
  const [externalAiConsent, setExternalAiConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [calmMode, setCalmMode] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [qualityTier, setQualityTier] = useState<QualityTier>("balanced");
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const model = AUDIENCES[audience];

  const presenceState: PresenceState = calmMode
    ? "calm"
    : listening
      ? "listening"
      : loading
        ? "thinking"
        : speaking
          ? "speaking"
          : "idle";

  const lastAssistant = useMemo(() => [...turns].reverse().find((turn) => turn.role === "assistant"), [turns]);
  const stateCopy = STATE_COPY[presenceState];

  useEffect(() => {
    const refresh = () => setQualityTier(detectQualityTier());
    refresh();
    window.addEventListener("resize", refresh, { passive: true });
    return () => window.removeEventListener("resize", refresh);
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  function speak(text: string) {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = model.rate;
    utterance.pitch = model.pitch;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("fr"));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopVoice() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function reset(nextAudience = audience) {
    recognitionRef.current?.stop();
    stopVoice();
    setAudience(nextAudience);
    setTurns([{ role: "assistant", text: AUDIENCES[nextAudience].starter }]);
    setConversationState(null);
    setMessage("");
    setNotice("");
    composerRef.current?.focus();
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
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
      if (transcript) {
        setMessage(transcript);
        requestAnimationFrame(() => composerRef.current?.focus());
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setNotice("Le microphone n’a pas pu démarrer.");
    };
    recognitionRef.current = recognition;
    setListening(true);
    setNotice("");
    recognition.start();
  }

  function onStagePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (qualityTier === "light" || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    stageRef.current.style.setProperty("--look-x", x.toFixed(3));
    stageRef.current.style.setProperty("--look-y", y.toFixed(3));
  }

  function onStagePointerLeave() {
    stageRef.current?.style.setProperty("--look-x", "0");
    stageRef.current?.style.setProperty("--look-y", "0");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;

    recognitionRef.current?.stop();
    stopVoice();
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
          conversationState,
          externalAiConsent,
          memoryConsent: false,
        }),
      });
      const data = await response.json() as {
        error?: string;
        reply?: string;
        conversationState?: string | null;
      };
      if (!response.ok) throw new Error(data.error || "La conversation n’a pas pu être traitée.");
      const reply = data.reply?.trim() || "Je suis là.";
      setTurns((current) => [...current, { role: "assistant", text: reply }]);
      setConversationState(data.conversationState ?? null);
      speak(reply);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="atlas-lounge"
      data-presence={presenceState}
      data-quality={qualityTier}
      data-calm={calmMode ? "true" : "false"}
    >
      <div className="lounge-ambient" aria-hidden="true">
        <div className="lounge-aurora lounge-aurora-a" />
        <div className="lounge-aurora lounge-aurora-b" />
        <div className="lounge-grain" />
      </div>

      <aside className="lounge-sidebar lounge-sidebar-left" aria-label="Options de conversation">
        <Link href="/" className="lounge-brand" aria-label="Retour à l’accueil ATLAS">
          <span className="lounge-brand-core">A</span>
          <span><strong>ATLAS</strong><small>CONVERSATIONAL LOUNGE</small></span>
        </Link>

        <div className="lounge-sidebar-group">
          <span className="lounge-eyebrow">CONVERSATION</span>
          <button className="lounge-menu-primary" type="button" onClick={() => reset()}><span>＋</span> Nouvelle conversation</button>
          <button type="button" onClick={() => setThreadOpen(true)}><span>◌</span> Fil de discussion</button>
          <button type="button" onClick={() => composerRef.current?.focus()}><span>⌁</span> Reprendre la parole</button>
        </div>

        <div className="lounge-sidebar-group">
          <span className="lounge-eyebrow">PUBLIC</span>
          {(Object.keys(AUDIENCES) as Audience[]).map((key) => (
            <button
              key={key}
              className="audience-choice"
              type="button"
              onClick={() => reset(key)}
              aria-pressed={audience === key}
            >
              <span className="audience-dot" /> {AUDIENCES[key].label}
            </button>
          ))}
        </div>

        <div className="lounge-sidebar-group lounge-control-group">
          <span className="lounge-eyebrow">PRÉSENCE</span>
          <label className="lounge-switch-row">
            <span><strong>Mode calme</strong><small>Mouvements et intensité réduits</small></span>
            <input type="checkbox" checked={calmMode} onChange={(event) => setCalmMode(event.target.checked)} />
          </label>
          <label className="lounge-switch-row">
            <span><strong>Voix ATLAS</strong><small>Lecture locale de la réponse</small></span>
            <input type="checkbox" checked={voiceEnabled} onChange={(event) => { setVoiceEnabled(event.target.checked); if (!event.target.checked) stopVoice(); }} />
          </label>
          <label className="lounge-switch-row">
            <span><strong>IA avancée</strong><small>Autoriser le fournisseur externe</small></span>
            <input type="checkbox" checked={externalAiConsent} onChange={(event) => setExternalAiConsent(event.target.checked)} />
          </label>
        </div>

        <div className="lounge-performance-card">
          <span className="lounge-eyebrow">MOTEUR VISUEL</span>
          <strong>{qualityTier === "ultra" ? "Ultra" : qualityTier === "balanced" ? "Équilibré" : "Allégé"}</strong>
          <small>Ajusté automatiquement à cet appareil.</small>
          <div className="performance-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        </div>
      </aside>

      <section
        ref={stageRef}
        className="lounge-stage"
        onPointerMove={onStagePointerMove}
        onPointerLeave={onStagePointerLeave}
        aria-label="Présence conversationnelle ATLAS"
      >
        <header className="lounge-stage-header">
          <div>
            <span className="lounge-eyebrow">ATLAS PRESENCE ENGINE</span>
            <h1>ATLAS</h1>
          </div>
          <div className="presence-readout" aria-live="polite">
            <span className="presence-live-dot" />
            <span><small>ÉTAT</small><strong>{stateCopy.label}</strong></span>
          </div>
        </header>

        <div className="atlas-presence-wrap">
          <div className="presence-orbit orbit-outer" aria-hidden="true" />
          <div className="presence-orbit orbit-mid" aria-hidden="true" />
          <div className="presence-orbit orbit-inner" aria-hidden="true" />
          <div className="presence-neural-field" aria-hidden="true" />

          <div className="presence-shards" aria-hidden="true">
            {SHARDS.map((index) => <i key={index} style={{ "--shard": index } as React.CSSProperties} />)}
          </div>

          <div className="human-ai-face" aria-hidden="true">
            <div className="face-aura" />
            <div className="face-cranium-grid" />
            <div className="face-temple-light face-temple-left" />
            <div className="face-temple-light face-temple-right" />
            <div className="face-brow face-brow-left" />
            <div className="face-brow face-brow-right" />
            <div className="face-eye face-eye-left"><span className="face-iris"><i /></span></div>
            <div className="face-eye face-eye-right"><span className="face-iris"><i /></span></div>
            <div className="face-nose"><i /></div>
            <div className="face-cheek face-cheek-left" />
            <div className="face-cheek face-cheek-right" />
            <div className="face-mouth"><span /></div>
            <div className="face-chin-light" />
            <div className="face-digital-half" />
          </div>

          <div className="presence-waveform" aria-hidden="true">
            {SIGNALS.map((index) => <i key={index} style={{ "--signal": index } as React.CSSProperties} />)}
          </div>

          <div className="presence-context context-left-top"><small>CONTEXTE</small><strong>{presenceState === "listening" ? "Réceptif" : presenceState === "thinking" ? "Analyse" : presenceState === "speaking" ? "Transmission" : "Présence"}</strong></div>
          <div className="presence-context context-left-bottom"><small>TON</small><strong>{calmMode ? "Apaisé" : "Adaptatif"}</strong></div>
          <div className="presence-context context-right-top"><small>FOCUS</small><strong>{loading ? "Clarifier" : "Vous"}</strong></div>
          <div className="presence-context context-right-bottom"><small>RYTHME</small><strong>{audience === "senior" ? "Lent" : calmMode ? "Doux" : "Naturel"}</strong></div>
        </div>

        <div className="presence-message" aria-live="polite">
          <p>{lastAssistant?.text ?? "Je suis là."}</p>
          <span>{stateCopy.detail}</span>
        </div>

        <form className="lounge-composer" onSubmit={send}>
          <button
            className={`composer-mic${listening ? " active" : ""}`}
            type="button"
            onClick={toggleListening}
            aria-label={listening ? "Arrêter l’écoute" : "Parler à ATLAS"}
          >
            <span aria-hidden="true">⌁</span>
          </button>
          <div className="composer-field">
            <label htmlFor="atlas-lounge-message">Parlez ou écrivez librement</label>
            <textarea
              ref={composerRef}
              id="atlas-lounge-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={2}
              maxLength={6000}
              placeholder="Qu’est-ce qui vous traverse ?"
            />
          </div>
          <button className="composer-send" type="submit" disabled={loading || !message.trim()} aria-label="Envoyer">
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        {notice && <p className="lounge-notice" role="alert">{notice}</p>}

        <div className="lounge-quick-actions" aria-label="Actions rapides">
          <button type="button" onClick={() => setMessage("Aide-moi à mettre des mots sur ce que je ressens.")}>Mettre des mots</button>
          <button type="button" onClick={() => setMessage("Aide-moi à clarifier cette situation sans décider à ma place.")}>Clarifier</button>
          <button type="button" onClick={() => setMessage("J’ai surtout besoin que tu m’écoutes, sans me donner de solution.")}>Être écouté</button>
        </div>
      </section>

      <aside className="lounge-sidebar lounge-sidebar-right" aria-label="État ATLAS">
        <div className="live-status-card">
          <div className="status-card-title"><span>ÉTAT EN DIRECT</span><i /></div>
          {(Object.keys(STATE_COPY) as PresenceState[]).filter((state) => state !== "idle").map((state) => (
            <div key={state} className="live-status-row" data-active={presenceState === state ? "true" : "false"}>
              <span className="status-wave"><i /><i /><i /></span>
              <strong>{STATE_COPY[state].label}</strong>
              <small>{presenceState === state ? "Actif" : "Prêt"}</small>
            </div>
          ))}
        </div>

        <div className="lounge-insight-card">
          <span className="lounge-eyebrow">PRÉSENCE</span>
          <p>ATLAS adapte son rythme, ses mouvements et son intensité à l’échange sans prétendre connaître exactement votre état intérieur.</p>
        </div>

        <div className="lounge-system-card">
          <div><span>Qualité visuelle</span><strong>{qualityTier === "ultra" ? "MAX" : qualityTier === "balanced" ? "HAUTE" : "LÉGÈRE"}</strong></div>
          <div><span>Continuité</span><strong>{conversationState ? "ACTIVE" : "SESSION"}</strong></div>
          <div><span>Voix</span><strong>{voiceEnabled ? "ACTIVE" : "OFF"}</strong></div>
        </div>
      </aside>

      {threadOpen && (
        <div className="thread-backdrop" role="presentation" onClick={() => setThreadOpen(false)}>
          <section className="thread-drawer" role="dialog" aria-modal="true" aria-label="Fil de discussion" onClick={(event) => event.stopPropagation()}>
            <header><div><span className="lounge-eyebrow">FIL DE DISCUSSION</span><h2>Conversation</h2></div><button type="button" onClick={() => setThreadOpen(false)} aria-label="Fermer">×</button></header>
            <div className="thread-list">
              {turns.map((turn, index) => (
                <article key={`${turn.role}-${index}`} data-role={turn.role}>
                  <small>{turn.role === "assistant" ? "ATLAS" : "VOUS"}</small>
                  <p>{turn.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
