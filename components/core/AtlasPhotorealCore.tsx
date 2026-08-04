"use client";

import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useRef, useState } from "react";
import chunk0 from "./assets/chunk0";
import styles from "./AtlasPhotorealCore.module.css";

type AtlasState = "presence" | "listening" | "thinking" | "speaking";

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

function localReply(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("bonjour") || text.includes("salut")) return "Bonjour. Je suis ATLAS. Je vous écoute avec attention.";
  if (text.includes("stress") || text.includes("angoiss")) return "Je détecte une tension importante dans ce que vous exprimez. Commençons par isoler ce qui vous pèse le plus maintenant.";
  if (text.includes("triste") || text.includes("mal")) return "Je vous entends. Vous n’avez pas besoin de tout résoudre immédiatement. Dites-moi ce qui fait le plus mal dans cette situation.";
  return `J’ai reçu votre message : « ${message} ». Dans cette version de test, mon moteur conversationnel local valide la voix, les états et la présence visuelle. Le moteur IA complet sera branché après validation du Core.`;
}

export function AtlasPhotorealCore() {
  const [state, setState] = useState<AtlasState>("presence");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("Je suis ATLAS. Mon cerveau est actif. Vous pouvez me parler.");
  const [listening, setListening] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const recognitionRef = useRef<Recognition | null>(null);
  const imageSource = useMemo(() => `data:image/webp;base64,${chunk0}`, []);

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
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setState("presence");
      return;
    }
    const Constructor = getRecognition();
    if (!Constructor) {
      setReply("La reconnaissance vocale n’est pas disponible dans ce navigateur. Utilisez le champ de saisie.");
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
      setReply("Le microphone n’a pas pu être activé. Vérifiez les autorisations du navigateur.");
    };
    recognitionRef.current = recognition;
    setListening(true);
    setState("listening");
    recognition.start();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = message.trim();
    if (!clean) return;
    setState("thinking");
    setReply("Analyse du message et activation du réseau neuronal…");
    window.setTimeout(() => {
      const answer = localReply(clean);
      setReply(answer);
      setMessage("");
      speak(answer);
    }, 1150);
  }

  return (
    <main className={styles.page} onPointerMove={move} data-state={state}>
      <img
        className={styles.entity}
        src={imageSource}
        alt="ATLAS, entité robotique entourée d’un réseau neuronal"
        style={{ transform: `translate3d(${pointer.x * 7}px, ${pointer.y * -5}px, 0) scale(1.035)` }}
      />
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
        </div>
      </section>

      <aside className={styles.response} aria-live="polite">
        <div><span /><strong>ATLAS</strong><small>{LABELS[state]}</small></div>
        <p>{reply}</p>
      </aside>

      <form className={styles.composer} onSubmit={submit}>
        <button type="button" className={styles.mic} data-active={listening} onClick={toggleListening} aria-label="Activer le microphone"><span>◉</span></button>
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Adressez-vous à ATLAS…" maxLength={2000} />
        <button type="submit" className={styles.send} disabled={!message.trim() || state === "thinking"}>TRANSMETTRE <span>→</span></button>
      </form>

      <footer className={styles.footer}><span>CORE TEST / BRANCHE ISOLÉE</span><b>Interaction vocale · Réponse locale · États synchronisés</b></footer>
    </main>
  );
}
