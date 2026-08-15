"use client";

import Link from "next/link";
import type { CSSProperties, FormEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import AtlasNeuralCanvas, { type LoungeQuality, type LoungeVisualState } from "../../components/atlas/lounge/AtlasNeuralCanvas";

type Audience = "adolescent" | "adult" | "senior";
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
  adolescent: { label: "Adolescents", rate: 1.02, pitch: 1.02, starter: "Tu peux commencer comme tu veux. Je t’écoute." },
  adult: { label: "Adultes", rate: 0.96, pitch: 0.96, starter: "Prenez votre temps. Je vous écoute." },
  senior: { label: "Seniors", rate: 0.84, pitch: 0.92, starter: "Prenons le temps. Je vous écoute." },
};

const STATE_LABELS: Record<LoungeVisualState, { title: string; detail: string }> = {
  idle: { title: "Présent", detail: "ATLAS est ici." },
  listening: { title: "Écoute", detail: "Votre voix devient le centre de l’espace." },
  thinking: { title: "Réflexion", detail: "ATLAS organise le contexte avant de répondre." },
  speaking: { title: "Réponse", detail: "La présence et la voix s’alignent." },
  calm: { title: "Calme", detail: "Le salon ralentit." },
};

const SHARDS = Array.from({ length: 64 }, (_, index) => index);
const WAVE = Array.from({ length: 24 }, (_, index) => index);

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const target = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return target.SpeechRecognition ?? target.webkitSpeechRecognition ?? null;
}

function detectQuality(): LoungeQuality {
  if (typeof window === "undefined") return "balanced";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "light";
  const device = navigator as Navigator & { deviceMemory?: number };
  const memory = device.deviceMemory ?? 8;
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [calmMode, setCalmMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState("");
  const [quality, setQuality] = useState<LoungeQuality>("balanced");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const controlsPanelRef = useRef<HTMLElement | null>(null);
  const threadPanelRef = useRef<HTMLElement | null>(null);
  const controlsCloseRef = useRef<HTMLButtonElement | null>(null);
  const threadCloseRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const model = AUDIENCES[audience];

  const visualState: LoungeVisualState = calmMode
    ? "calm"
    : listening
      ? "listening"
      : loading
        ? "thinking"
        : speaking
          ? "speaking"
          : "idle";

  const stateCopy = STATE_LABELS[visualState];
  const lastAssistant = useMemo(() => [...turns].reverse().find((turn) => turn.role === "assistant")?.text ?? model.starter, [turns, model.starter]);

  useEffect(() => {
    const update = () => setQuality(detectQuality());
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    const panel = controlsOpen ? controlsPanelRef.current : threadOpen ? threadPanelRef.current : null;
    const closeButton = controlsOpen ? controlsCloseRef.current : threadCloseRef.current;
    if (!panel) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => closeButton?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setControlsOpen(false);
        setThreadOpen(false);
        const target = returnFocusRef.current;
        requestAnimationFrame(() => target?.focus());
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [controlsOpen, threadOpen]);

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

  function reset(nextAudience = audience, focusComposer = true) {
    recognitionRef.current?.stop();
    stopVoice();
    setAudience(nextAudience);
    setTurns([{ role: "assistant", text: AUDIENCES[nextAudience].starter }]);
    setConversationState(null);
    setMessage("");
    setNotice("");
    if (focusComposer) requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function openControls(event: ReactMouseEvent<HTMLButtonElement>) {
    returnFocusRef.current = event.currentTarget;
    setThreadOpen(false);
    setControlsOpen(true);
  }

  function openThread(event: ReactMouseEvent<HTMLButtonElement>) {
    returnFocusRef.current = event.currentTarget;
    setControlsOpen(false);
    setThreadOpen(true);
  }

  function closeDialogs() {
    setControlsOpen(false);
    setThreadOpen(false);
    const target = returnFocusRef.current;
    requestAnimationFrame(() => target?.focus());
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
      if (transcript) setMessage(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setNotice("Le microphone n’a pas pu démarrer.");
    };
    recognitionRef.current = recognition;
    setNotice("");
    setListening(true);
    recognition.start();
  }

  function movePresence(event: ReactPointerEvent<HTMLElement>) {
    if (!stageRef.current || quality === "light") return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    stageRef.current.style.setProperty("--look-x", x.toFixed(3));
    stageRef.current.style.setProperty("--look-y", y.toFixed(3));
  }

  function resetPresence() {
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
      const data = await response.json() as { error?: string; reply?: string; conversationState?: string | null };
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
    <main className="atlas-lounge-v6" data-state={visualState} data-quality={quality} data-calm={calmMode ? "true" : "false"}>
      <section ref={stageRef} className="atlas-sanctuary" onPointerMove={movePresence} onPointerLeave={resetPresence}>
        <AtlasNeuralCanvas state={visualState} quality={quality} />
        <div className="sanctuary-architecture" aria-hidden="true">
          <span className="vault vault-left" />
          <span className="vault vault-right" />
          <span className="floor-ring floor-ring-a" />
          <span className="floor-ring floor-ring-b" />
          <span className="sanctuary-mist" />
        </div>

        <header className="atlas-sanctuary-header">
          <Link href="/" className="atlas-signature" aria-label="Retour à l’accueil ATLAS">
            <span className="atlas-sigil"><i /><i /><i /></span>
            <span><strong>ATLAS</strong><small>Présence numérique interactive</small></span>
          </Link>
          <div className="atlas-state-pill" aria-live="polite"><i /><span>État : {stateCopy.title.toLowerCase()}</span></div>
        </header>

        <div className="atlas-side-status atlas-side-left">
          <span>ÉCOUTE</span>
          <strong>{visualState === "listening" ? "Je vous entends." : "Je suis ici."}</strong>
          <small>{visualState === "thinking" ? "Je rassemble le contexte." : "Je vous écoute."}</small>
          <div className="side-wave" aria-hidden="true">{WAVE.slice(0, 14).map((item) => <i key={item} style={{ "--i": item } as CSSProperties} />)}</div>
        </div>

        <div className="atlas-side-status atlas-side-right">
          <span>PRÉSENCE</span>
          <strong>{visualState === "thinking" ? "Concentrée" : visualState === "speaking" ? "Engagée" : visualState === "calm" ? "Calme" : "Stable"}</strong>
          <small>{stateCopy.detail}</small>
        </div>

        <div className="atlas-avatar-stage" aria-hidden="true">
          <div className="avatar-halo avatar-halo-a" />
          <div className="avatar-halo avatar-halo-b" />
          <div className="avatar-energy-field" />
          <div className="atlas-avatar">
            <div className="avatar-skin-light" />
            <div className="avatar-digital-mask" />
            <div className="avatar-cranium-grid" />
            <div className="avatar-brow brow-left" />
            <div className="avatar-brow brow-right" />
            <div className="avatar-eye eye-left"><span className="avatar-iris"><i /></span></div>
            <div className="avatar-eye eye-right"><span className="avatar-iris"><i /></span></div>
            <div className="avatar-nose"><i /></div>
            <div className="avatar-cheek cheek-left" />
            <div className="avatar-cheek cheek-right" />
            <div className="avatar-mouth"><span /></div>
            <div className="avatar-jaw" />
            <div className="avatar-neck" />
            <div className="avatar-shoulders" />
          </div>
          <div className="avatar-shards">
            {SHARDS.map((index) => <i key={index} style={{ "--shard": index } as CSSProperties} />)}
          </div>
        </div>

        <div className="atlas-response" aria-live="polite" aria-busy={loading}>
          <p>{loading ? "Je rassemble ce qui compte…" : lastAssistant}</p>
        </div>

        <form className="atlas-command-dock" onSubmit={send}>
          <button type="button" className={`dock-mic${listening ? " is-active" : ""}`} onClick={toggleListening} aria-label={listening ? "Arrêter l’écoute" : "Parler à ATLAS"} aria-pressed={listening}>
            <span aria-hidden="true">◉</span>
          </button>
          <div className="dock-main">
            <label htmlFor="atlas-message">Parlez librement. ATLAS vous écoute.</label>
            <textarea
              ref={textareaRef}
              id="atlas-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={6000}
              rows={1}
              placeholder="Écrivez ici…"
            />
            <button type="button" className="conversation-mode" onClick={openControls} aria-expanded={controlsOpen} aria-controls="atlas-controls-dialog">Conversation profonde <span>⌄</span></button>
          </div>
          <button type="submit" className="dock-send" disabled={!message.trim() || loading} aria-label="Envoyer"><span>↗</span></button>
        </form>

        <div className="dock-utilities">
          <button type="button" onClick={openThread} aria-expanded={threadOpen} aria-controls="atlas-thread-dialog">Fil</button>
          <button type="button" onClick={() => setCalmMode((value) => !value)} aria-pressed={calmMode}>{calmMode ? "Réactiver" : "Calme"}</button>
          <button type="button" onClick={openControls} aria-expanded={controlsOpen} aria-controls="atlas-controls-dialog">Réglages</button>
        </div>

        {notice ? <p className="atlas-notice" role="alert">{notice}</p> : null}
      </section>

      {controlsOpen ? (
        <div id="atlas-controls-dialog" className="atlas-overlay" role="dialog" aria-modal="true" aria-labelledby="atlas-controls-title">
          <button type="button" className="overlay-backdrop" aria-hidden="true" tabIndex={-1} onClick={closeDialogs} />
          <section ref={controlsPanelRef} className="atlas-control-panel">
            <div className="panel-heading"><span>ATLAS</span><button ref={controlsCloseRef} type="button" onClick={closeDialogs}>Fermer</button></div>
            <h2 id="atlas-controls-title">Réglages de présence</h2>
            <div className="control-grid">
              <label><span>Public</span><select value={audience} onChange={(event) => reset(event.target.value as Audience, false)}>{(Object.keys(AUDIENCES) as Audience[]).map((key) => <option key={key} value={key}>{AUDIENCES[key].label}</option>)}</select></label>
              <label className="control-toggle"><span><strong>Voix ATLAS</strong><small>Lecture locale des réponses</small></span><input type="checkbox" checked={voiceEnabled} onChange={(event) => { setVoiceEnabled(event.target.checked); if (!event.target.checked) stopVoice(); }} /></label>
              <label className="control-toggle"><span><strong>IA avancée</strong><small>Autoriser le fournisseur externe pour cette session</small></span><input type="checkbox" checked={externalAiConsent} onChange={(event) => setExternalAiConsent(event.target.checked)} /></label>
              <label className="control-toggle"><span><strong>Mode calme</strong><small>Réduire mouvement et intensité</small></span><input type="checkbox" checked={calmMode} onChange={(event) => setCalmMode(event.target.checked)} /></label>
            </div>
            <div className="control-foot"><span>Moteur visuel : {quality}</span><button type="button" onClick={() => { closeDialogs(); reset(); }}>Nouvelle conversation</button></div>
          </section>
        </div>
      ) : null}

      {threadOpen ? (
        <div id="atlas-thread-dialog" className="atlas-overlay" role="dialog" aria-modal="true" aria-labelledby="atlas-thread-title">
          <button type="button" className="overlay-backdrop" aria-hidden="true" tabIndex={-1} onClick={closeDialogs} />
          <section ref={threadPanelRef} className="atlas-thread-panel">
            <div className="panel-heading"><span id="atlas-thread-title">FIL DE DISCUSSION</span><button ref={threadCloseRef} type="button" onClick={closeDialogs}>Fermer</button></div>
            <div className="thread-list">{turns.map((turn, index) => <article key={`${turn.role}-${index}`} data-role={turn.role}><small>{turn.role === "assistant" ? "ATLAS" : "VOUS"}</small><p>{turn.text}</p></article>)}</div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
