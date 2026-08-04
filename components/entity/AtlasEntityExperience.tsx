"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useRef, useState } from "react";
import styles from "./AtlasEntityExperience.module.css";
import type { AtlasPresenceState } from "./AtlasNeuralScene";

const AtlasNeuralScene = dynamic(() => import("./AtlasNeuralScene").then((module) => module.AtlasNeuralScene), { ssr: false });

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

const STATES: Array<{ id: AtlasPresenceState; label: string }> = [
  { id: "idle", label: "Présence" },
  { id: "listening", label: "Écoute" },
  { id: "thinking", label: "Réflexion" },
  { id: "speaking", label: "Parole" },
];

const SYSTEMS = [
  ["01", "Cerveau spatial", "Le réseau neuronal constitue le monde, la navigation et la visualisation du système."],
  ["02", "Présence robotique", "Le regard, la respiration, la parole et les micro-réactions sont synchronisés avec l’état cognitif."],
  ["03", "Orchestration", "Les signaux utilisateur pilotent les scénarios, la scène, la voix et les transitions en temps réel."],
  ["04", "Gouvernance", "Sécurité, consentement, mémoire et repli sont intégrés à la logique centrale."],
];

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const target = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return target.SpeechRecognition ?? target.webkitSpeechRecognition ?? null;
}

export function AtlasEntityExperience() {
  const [state, setState] = useState<AtlasPresenceState>("idle");
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("Je suis ATLAS. Mon cerveau, ma voix et mon environnement réagiront à votre présence.");
  const [intensity, setIntensity] = useState(0.48);
  const [hue, setHue] = useState(198);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  const style = useMemo(() => ({ "--accent": hue }) as CSSProperties, [hue]);

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
    setPointer({ x, y });
    setIntensity((current) => Math.min(0.96, current * 0.96 + Math.hypot(x, y) * 0.018));
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setState("idle");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.92;
    utterance.pitch = 0.86;
    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setState("idle");
      return;
    }
    const RecognitionClass = recognitionConstructor();
    if (!RecognitionClass) {
      setReply("La reconnaissance vocale n’est pas disponible dans ce navigateur. Écrivez votre message.");
      return;
    }
    const recognition = new RecognitionClass();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setMessage(transcript);
    };
    recognition.onend = () => {
      setListening(false);
      setState("idle");
    };
    recognition.onerror = () => {
      setListening(false);
      setState("idle");
      setReply("L’écoute n’a pas pu démarrer. Vérifiez l’autorisation du microphone.");
    };
    recognitionRef.current = recognition;
    setListening(true);
    setState("listening");
    recognition.start();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = message.trim();
    if (!clean) return;
    setState("thinking");
    setIntensity(0.86);
    setHue(clean.length % 2 ? 198 : 285);
    try {
      const response = await fetch("/api/atlas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, mode: "presence" }),
      });
      const data = await response.json() as { text?: string; intensity?: number; error?: string };
      const text = data.text ?? data.error ?? "ATLAS n’a pas pu répondre.";
      setReply(text);
      setIntensity(data.intensity ?? 0.62);
      speak(text);
    } catch {
      const text = "La liaison cognitive est momentanément indisponible. Le moteur visuel reste actif.";
      setReply(text);
      setState("idle");
    }
  }

  return (
    <main className={styles.page} style={style} onPointerMove={onPointerMove}>
      <div className={styles.scene}><AtlasNeuralScene state={state} pointer={pointer} intensity={intensity} hue={hue} /></div>
      <div className={styles.veil} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <header className={styles.nav}>
        <a href="#top" className={styles.brand}><span className={styles.mark}><i /><i /><i /></span><span><strong>ATLAS</strong><small>ROBOTIC NEURAL ENTITY</small></span></a>
        <nav><a href="#top">Entité</a><a href="#conversation">Conversation</a><a href="#systems">Systèmes</a></nav>
        <div className={styles.status}><i /><span>ÉTAT COGNITIF</span><b>{state.toUpperCase()}</b></div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>ATLAS / ORGANISME NUMÉRIQUE ROBOTIQUE</p>
          <h1>Entrez dans<br /><em>son cerveau.</em></h1>
          <p className={styles.lead}>ATLAS n’est plus une interface avec un avatar. Le cerveau est le monde, le robot est la présence, et chaque interaction modifie le réseau neuronal en direct.</p>
          <div className={styles.actions}><button onClick={toggleListening}>{listening ? "Arrêter l’écoute" : "Parler à ATLAS"}<span>◉</span></button><a href="#conversation">Ouvrir la liaison <span>↓</span></a></div>
        </div>
        <aside className={styles.presencePanel}>
          <div className={styles.presenceTop}><span>PRÉSENCE SYNCHRONISÉE</span><b>{Math.round(intensity * 100)}%</b></div>
          <div className={styles.stateGrid}>{STATES.map((item) => <button key={item.id} data-active={state === item.id} onClick={() => setState(item.id)}>{item.label}</button>)}</div>
        </aside>
      </section>

      <section className={styles.conversation} id="conversation">
        <div className={styles.conversationIntro}><p>01 / LIAISON COGNITIVE</p><h2>Le robot écoute. Le cerveau réagit.</h2><span>Lorsque vous parlez ou écrivez, ATLAS passe par des états visibles : écoute, réflexion, activation neuronale puis parole synchronisée.</span></div>
        <div className={styles.dialog}>
          <div className={styles.reply}><small>RÉPONSE D’ATLAS</small><p>{reply}</p></div>
          <form className={styles.composer} onSubmit={submit}><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Adressez-vous directement à ATLAS…" /><button type="submit">Transmettre <span>→</span></button></form>
          <div className={styles.voiceRow}><button type="button" onClick={toggleListening}>{listening ? "Micro actif" : "Activer le micro"}</button><span>La voix reste traitée par les capacités du navigateur dans cette première incarnation.</span></div>
        </div>
      </section>

      <section className={styles.systems} id="systems">
        <p className={styles.eyebrow}>02 / ARCHITECTURE DE L’ENTITÉ</p>
        <h2>Une présence extérieure soutenue par un système intérieur.</h2>
        <div className={styles.systemsGrid}>{SYSTEMS.map(([index, title, text]) => <article key={index}><small>{index}</small><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <footer className={styles.footer}><strong>ATLAS ZERO</strong><span>Incarnation procédurale 3D — branche isolée</span><small>{state} · intensité {Math.round(intensity * 100)}%</small></footer>
    </main>
  );
}
