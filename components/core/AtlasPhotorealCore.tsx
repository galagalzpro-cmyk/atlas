"use client";

import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import chunk0 from "./assets/chunk0";
import styles from "./AtlasPhotorealCore.module.css";

type AtlasState = "presence" | "listening" | "thinking" | "speaking";
type VisualProfile = {
  hue: number;
  intensity: number;
  regions: string[];
  mode: "presence" | "clarity" | "stabilization" | "expansion";
};
type AtlasResponse = {
  text?: string;
  error?: string;
  source?: "openai" | "local-fallback" | "local-safety";
  safety?: "standard" | "urgent";
  visual?: VisualProfile;
};
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

const LABELS: Record<AtlasState, string> = {
  presence: "PRÉSENCE",
  listening: "ÉCOUTE",
  thinking: "RÉFLEXION",
  speaking: "PAROLE",
};

function getRecognition(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const target = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return target.SpeechRecognition ?? target.webkitSpeechRecognition ?? null;
}

export function AtlasPhotorealCore() {
  const [state, setState] = useState<AtlasState>("presence");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("Je suis ATLAS. Mon cerveau est actif. Vous pouvez me parler.");
  const [listening, setListening] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [visual, setVisual] = useState<VisualProfile>({ hue: 214, intensity: 0.64, regions: ["écoute", "contexte", "présence"], mode: "presence" });
  const [source, setSource] = useState<AtlasResponse["source"]>("local-fallback");
  const [notice, setNotice] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualRef = useRef(visual);
  const stateRef = useRef(state);
  const imageSource = useMemo(() => `data:image/webp;base64,${chunk0}`, []);

  useEffect(() => {
    visualRef.current = visual;
  }, [visual]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from({ length: reducedMotion ? 45 : 110 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00025,
      phase: Math.random() * Math.PI * 2,
    }));
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (time: number) => {
      const currentVisual = visualRef.current;
      const currentState = stateRef.current;
      const speed = reducedMotion ? 0.06 : currentState === "thinking" ? 1.5 : currentState === "speaking" ? 1.15 : currentState === "listening" ? 0.9 : 0.45;
      const maxDistance = 95 + currentVisual.intensity * 70;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        node.x += (node.vx + Math.sin(time * 0.00025 + node.phase) * 0.000018) * speed;
        node.y += (node.vy + Math.cos(time * 0.0002 + node.phase) * 0.000014) * speed;
        if (node.x < -0.03) node.x = 1.03;
        if (node.x > 1.03) node.x = -0.03;
        if (node.y < -0.03) node.y = 1.03;
        if (node.y > 1.03) node.y = -0.03;
        const x = node.x * width;
        const y = node.y * height;
        const pulse = 0.65 + Math.sin(time * 0.002 * speed + node.phase) * 0.35;
        context.beginPath();
        context.arc(x, y, 0.8 + currentVisual.intensity * 1.5 + pulse, 0, Math.PI * 2);
        context.fillStyle = `hsla(${currentVisual.hue}, 92%, 72%, ${0.17 + currentVisual.intensity * 0.42})`;
        context.fill();
        for (let next = index + 1; next < nodes.length; next += 1) {
          const other = nodes[next];
          const ox = other.x * width;
          const oy = other.y * height;
          const distance = Math.hypot(x - ox, y - oy);
          if (distance > maxDistance) continue;
          const alpha = (1 - distance / maxDistance) * (0.02 + currentVisual.intensity * 0.11);
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(ox, oy);
          context.strokeStyle = `hsla(${currentVisual.hue + 12}, 90%, 72%, ${alpha})`;
          context.lineWidth = 0.4 + currentVisual.intensity * 0.45;
          context.stroke();
        }
      }
      context.globalCompositeOperation = "source-over";
      frame = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = window.requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  function move(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * -2,
    });
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setState("presence");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.88;
    utterance.pitch = 0.78;
    utterance.volume = 0.95;
    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("presence");
    utterance.onerror = () => setState("presence");
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    setNotice("");
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setState("presence");
      return;
    }
    const Constructor = getRecognition();
    if (!Constructor) {
      setNotice("La reconnaissance vocale n’est pas disponible dans ce navigateur. Utilisez le champ de saisie.");
      return;
    }
    const recognition = new Constructor();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setMessage(transcript);
    };
    recognition.onend = () => {
      setListening(false);
      setState("presence");
    };
    recognition.onerror = () => {
      setListening(false);
      setState("presence");
      setNotice("Le microphone n’a pas pu être activé. Vérifiez les autorisations du navigateur.");
    };
    recognitionRef.current = recognition;
    setListening(true);
    setState("listening");
    setVisual((current) => ({ ...current, intensity: 0.82, regions: ["écoute", "transcription", "attention"] }));
    recognition.start();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = message.trim();
    if (!clean || state === "thinking") return;
    setNotice("");
    setState("thinking");
    setReply("Analyse du message et activation du réseau neuronal…");
    setVisual((current) => ({ ...current, intensity: 0.94, regions: ["analyse", "contexte", "orientation"] }));
    try {
      const response = await fetch("/api/atlas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean }),
      });
      const payload = (await response.json()) as AtlasResponse;
      if (!response.ok) throw new Error(payload.error || "La réponse ATLAS est indisponible.");
      const answer = payload.text?.trim() || "ATLAS n’a pas pu produire une réponse exploitable.";
      if (payload.visual) setVisual(payload.visual);
      setSource(payload.source);
      setReply(answer);
      setMessage("");
      speak(answer);
    } catch (error) {
      setState("presence");
      setNotice(error instanceof Error ? error.message : "Erreur de liaison avec ATLAS.");
      setReply("La liaison cognitive est momentanément indisponible. Réessayez dans quelques instants.");
    }
  }

  return (
    <main className={styles.page} onPointerMove={move} data-state={state} style={{ "--neural-hue": visual.hue, "--neural-intensity": visual.intensity } as React.CSSProperties}>
      <img
        className={styles.entity}
        src={imageSource}
        alt="ATLAS, entité robotique entourée d’un réseau neuronal"
        style={{ transform: `translate3d(${pointer.x * 7}px, ${pointer.y * -5}px, 0) scale(1.035)` }}
      />
      <canvas ref={canvasRef} className={styles.neuralCanvas} aria-hidden="true" />
      <div className={styles.depth} />
      <div className={styles.synapses} aria-hidden="true">
        {Array.from({ length: 34 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}
      </div>
      <div className={styles.scan} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.brand}><span /><strong>ATLAS</strong><small>NEURAL PRESENCE CORE</small></div>
        <div className={styles.status}><i /><span>{LABELS[state]}</span></div>
      </header>

      <section className={styles.presence}>
        <div className={styles.caption}>
          <p>ORGANISME NUMÉRIQUE ROBOTIQUE</p>
          <h1>Je suis <em>ATLAS.</em></h1>
          <span>Parlez. Le cerveau s’active, la présence réagit et la voix vous répond.</span>
        </div>

        <div className={styles.cognitiveState}>
          <small>ÉTAT COGNITIF</small>
          <strong>{LABELS[state]}</strong>
          <div><i /><i /><i /><i /><i /></div>
          <p>{visual.regions.join(" · ")}</p>
        </div>
      </section>

      <aside className={styles.response} aria-live="polite">
        <div><span /><strong>ATLAS</strong><small>{LABELS[state]}</small></div>
        <p>{reply}</p>
        <footer>{source === "openai" ? "ORCHESTRATEUR IA" : source === "local-safety" ? "SÉCURITÉ LOCALE" : "REPLI LOCAL"}</footer>
      </aside>

      <form className={styles.composer} onSubmit={submit}>
        <button type="button" className={styles.mic} data-active={listening} onClick={toggleListening} aria-label="Activer le microphone"><span>◉</span></button>
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Adressez-vous à ATLAS…" maxLength={6000} />
        <button type="submit" className={styles.send} disabled={!message.trim() || state === "thinking"}>TRANSMETTRE <span>→</span></button>
      </form>

      {notice && <div className={styles.notice}>{notice}</div>}
      <footer className={styles.footer}><span>CORE TEST / BRANCHE ISOLÉE</span><b>Conversation serveur · Voix navigateur · États cognitifs synchronisés</b></footer>
    </main>
  );
}
