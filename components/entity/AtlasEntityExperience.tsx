"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AtlasEntityExperience.module.css";
import type { AtlasPresenceState } from "./AtlasNeuralScene";

const AtlasNeuralScene = dynamic(
  () => import("./AtlasNeuralScene").then((module) => module.AtlasNeuralScene),
  { ssr: false },
);

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;
type ConversationEntry = { id: string; role: "user" | "atlas"; text: string; createdAt: number };

const STATE_LABELS: Record<AtlasPresenceState, string> = {
  idle: "PRÉSENCE",
  listening: "ÉCOUTE",
  thinking: "RÉFLEXION",
  speaking: "PAROLE",
};

const CAPABILITIES = [
  ["◈", "Analyse profonde"],
  ["⌁", "Scénarios adaptatifs"],
  ["◎", "Génération visuelle"],
  ["◇", "Simulation"],
  ["◉", "Voix & vision"],
];

const INITIAL_REPLY = "Je suis ATLAS. Mon cerveau, mon regard, ma voix et mon environnement réagissent à votre présence.";

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const target = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return target.SpeechRecognition ?? target.webkitSpeechRecognition ?? null;
}

function createEntry(role: ConversationEntry["role"], text: string): ConversationEntry {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text,
    createdAt: Date.now(),
  };
}

export function AtlasEntityExperience() {
  const [state, setState] = useState<AtlasPresenceState>("idle");
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState(INITIAL_REPLY);
  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [intensity, setIntensity] = useState(0.58);
  const [hue, setHue] = useState(224);
  const [listening, setListening] = useState(false);
  const [vision, setVision] = useState(false);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const style = useMemo(() => ({ "--accent": hue }) as CSSProperties, [hue]);
  const userEntries = useMemo(() => history.filter((entry) => entry.role === "user").slice(-5).reverse(), [history]);
  const latestUser = useMemo(() => [...history].reverse().find((entry) => entry.role === "user")?.text ?? "", [history]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("atlas-core-history");
      if (stored) {
        const parsed = JSON.parse(stored) as ConversationEntry[];
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(-20));
          const lastAtlas = [...parsed].reverse().find((entry) => entry.role === "atlas");
          if (lastAtlas) setReply(lastAtlas.text);
        }
      }
    } catch {
      // Local history is optional and failure must never block the core.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("atlas-core-history", JSON.stringify(history.slice(-20)));
    } catch {
      // Storage can be unavailable in private browsing modes.
    }
  }, [history, hydrated]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
    setPointer({ x, y });
    setIntensity((current) => Math.min(0.98, current * 0.985 + Math.hypot(x, y) * 0.006));
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setState("idle");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 0.82;
    utterance.volume = 0.95;
    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    setNotice("");
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setState("idle");
      return;
    }
    const RecognitionClass = recognitionConstructor();
    if (!RecognitionClass) {
      setNotice("La reconnaissance vocale n’est pas disponible dans ce navigateur. Utilisez le champ de saisie.");
      return;
    }
    const recognition = new RecognitionClass();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setMessage(transcript);
        window.setTimeout(() => textareaRef.current?.focus(), 80);
      }
    };
    recognition.onend = () => {
      setListening(false);
      setState("idle");
    };
    recognition.onerror = () => {
      setListening(false);
      setState("idle");
      setNotice("L’écoute n’a pas pu démarrer. Vérifiez l’autorisation du microphone.");
    };
    recognitionRef.current = recognition;
    setListening(true);
    setState("listening");
    setIntensity(0.8);
    recognition.start();
  }

  async function toggleVision() {
    setNotice("");
    if (vision) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setVision(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("La vision n’est pas disponible sur ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setVision(true);
      setIntensity(0.74);
    } catch {
      setNotice("L’accès à la caméra a été refusé ou n’est pas disponible.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = message.trim();
    if (!clean || state === "thinking") return;

    const userEntry = createEntry("user", clean);
    setHistory((current) => [...current, userEntry].slice(-20));
    setMessage("");
    setNotice("");
    setState("thinking");
    setIntensity(0.94);
    setHue((current) => (current + 29 + clean.length * 0.7) % 360);

    try {
      const response = await fetch("/api/atlas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, mode: "presence" }),
      });
      const data = await response.json() as { text?: string; intensity?: number; error?: string };
      const text = data.text ?? data.error ?? "ATLAS n’a pas pu produire de réponse exploitable.";
      setReply(text);
      setHistory((current) => [...current, createEntry("atlas", text)].slice(-20));
      setIntensity(data.intensity ?? 0.72);
      speak(text);
    } catch {
      const text = "La liaison cognitive est momentanément indisponible. Le cerveau visuel reste actif et la session locale est préservée.";
      setReply(text);
      setHistory((current) => [...current, createEntry("atlas", text)].slice(-20));
      setState("idle");
      setNotice("Erreur de connexion à l’orchestrateur ATLAS.");
    }
  }

  function newConversation() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setHistory([]);
    setReply(INITIAL_REPLY);
    setMessage("");
    setState("idle");
    setIntensity(0.58);
    setNotice("");
    textareaRef.current?.focus();
  }

  return (
    <main className={styles.page} style={style} onPointerMove={onPointerMove}>
      <div className={styles.scene}>
        <AtlasNeuralScene state={state} pointer={pointer} intensity={intensity} hue={hue} />
      </div>
      <div className={styles.veil} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <header className={styles.topbar}>
        <a className={styles.brand} href="#core" aria-label="ATLAS Core">
          <span className={styles.mark}><i /><i /><i /></span>
          <span><strong>ATLAS</strong><small>NEURAL CONVERSATION CORE</small></span>
        </a>
        <div className={styles.topControls}>
          <button type="button" data-active={listening} onClick={toggleListening}><span>◉</span> VOIX <i /></button>
          <button type="button" data-active={vision} onClick={toggleVision}><span>◇</span> VISION <i /></button>
          <div className={styles.avatar}>A</div>
        </div>
      </header>

      <aside className={styles.leftRail} aria-label="Navigation ATLAS">
        <button type="button" data-active="true" aria-label="Conversation">◈</button>
        <button type="button" aria-label="Mémoire">▣</button>
        <button type="button" aria-label="Scénarios">⌁</button>
        <button type="button" aria-label="Systèmes">◎</button>
        <span />
        <button type="button" aria-label="Paramètres">⊙</button>
      </aside>

      <aside className={styles.workspacePanel}>
        <section>
          <p className={styles.panelLabel}>CONVERSATION</p>
          <button className={styles.newConversation} type="button" onClick={newConversation}><span>◌</span> Nouvelle conversation <b>＋</b></button>
        </section>
        <section>
          <p className={styles.panelLabel}>FLUX MÉMOIRE LOCAL</p>
          <div className={styles.memoryList}>
            {userEntries.length ? userEntries.map((entry) => (
              <button key={entry.id} type="button" onClick={() => setMessage(entry.text)}><span>▧</span><b>{entry.text}</b></button>
            )) : <p className={styles.emptyMemory}>Les intentions de cette session apparaîtront ici.</p>}
          </div>
        </section>
        <section className={styles.capabilities}>
          <p className={styles.panelLabel}>CAPACITÉS CORE</p>
          {CAPABILITIES.map(([icon, label]) => <div key={label}><span>{icon}</span><b>{label}</b></div>)}
        </section>
        <div className={styles.coreStatus}>
          <div className={styles.statusOrb}><i /><i /><i /></div>
          <div><small>ATLAS CORE</small><strong>EN LIGNE</strong><span>Synchronisé · {Math.round(intensity * 100)}%</span></div>
        </div>
      </aside>

      <section className={styles.coreStage} id="core" aria-label="Présence robotique ATLAS">
        <div className={styles.entityCaption}>
          <span><i /> PRÉSENCE NEURONALE ACTIVE</span>
          <strong>{STATE_LABELS[state]}</strong>
        </div>
        {vision && <div className={styles.visionFeed}><video ref={videoRef} muted playsInline /><span>VISION LOCALE ACTIVE</span></div>}
        <div className={styles.neuralTelemetry}>
          <div><span>ACTIVITÉ</span><b>{Math.round(intensity * 100)}%</b></div>
          <div><span>ÉTAT</span><b>{STATE_LABELS[state]}</b></div>
          <div><span>MÉMOIRE</span><b>{history.length} SIGNAUX</b></div>
        </div>
      </section>

      <aside className={styles.conversationPanel} aria-label="Conversation avec ATLAS">
        {latestUser && <article className={styles.userCard}><small>VOUS</small><p>{latestUser}</p></article>}
        <article className={styles.thoughtCard} data-active={state === "thinking"}>
          <div><span className={styles.thoughtOrb}><i /><i /></span><b>ATLAS</b></div>
          <small>{state === "thinking" ? "Analyse des signaux et orchestration en cours…" : `État cognitif : ${STATE_LABELS[state].toLowerCase()}`}</small>
          <div className={styles.thoughtLine}><i /><i /><i /><i /><i /></div>
        </article>
        <article className={styles.atlasCard}>
          <div><span className={styles.responseOrb} /><b>ATLAS</b><small>{STATE_LABELS[state]}</small></div>
          <p>{reply}</p>
        </article>
        <button className={styles.voiceCard} type="button" data-active={listening || state === "speaking"} onClick={toggleListening}>
          <span className={styles.voiceOrb}><i /></span>
          <b>{listening ? "Je vous écoute…" : state === "speaking" ? "ATLAS vous répond…" : "Activer la liaison vocale"}</b>
          <span className={styles.waveform}>{Array.from({ length: 28 }, (_, index) => <i key={index} />)}</span>
        </button>
      </aside>

      <form className={styles.composer} onSubmit={submit}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Adressez-vous directement à ATLAS…"
          rows={1}
          maxLength={6000}
          aria-label="Message pour ATLAS"
        />
        <button type="button" onClick={() => setMessage("")} aria-label="Effacer">×</button>
        <button type="button" onClick={toggleVision} data-active={vision} aria-label="Vision">◇</button>
        <button type="button" onClick={toggleListening} data-active={listening} aria-label="Microphone">◉</button>
        <button className={styles.sendButton} type="submit" disabled={!message.trim() || state === "thinking"} aria-label="Envoyer">↑</button>
      </form>

      {notice && <div className={styles.notice}>{notice}</div>}

      <footer className={styles.footerBar}>
        <span>ATLAS — ADVANCED THINKING & LEARNING ASSISTANT SYSTEM</span>
        <b>{STATE_LABELS[state]} · {Math.round(intensity * 100)}%</b>
      </footer>
    </main>
  );
}
