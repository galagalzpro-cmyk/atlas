"use client";

import type { CSSProperties, ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./atlas-v2.module.css";

type MoodKey = "calm" | "clarity" | "energy" | "protect";
type PulseState = "idle" | "listening" | "interpreting" | "responding";

type Mood = {
  key: MoodKey;
  label: string;
  title: string;
  description: string;
  accent: string;
  soft: string;
  rgb: string;
};

const MOODS: Mood[] = [
  { key: "calm", label: "Calme", title: "Ralentir sans s'éteindre.", description: "ATLAS réduit la densité, allonge le souffle visuel et crée un espace stable autour de votre attention.", accent: "#8b70c7", soft: "rgba(139,112,199,.18)", rgb: "139,112,199" },
  { key: "clarity", label: "Clarté", title: "Voir ce qui compte vraiment.", description: "Le bruit recule, les informations se réorganisent et la prochaine action devient lisible.", accent: "#287f84", soft: "rgba(40,127,132,.17)", rgb: "40,127,132" },
  { key: "energy", label: "Énergie", title: "Transformer l'élan en mouvement.", description: "Le rythme accélère, les connexions gagnent en intensité et l'interface pousse vers une action concrète.", accent: "#b66a35", soft: "rgba(182,106,53,.17)", rgb: "182,106,53" },
  { key: "protect", label: "Protection", title: "Protéger avant d'accélérer.", description: "ATLAS resserre le champ, priorise la sécurité et maintient une présence sobre.", accent: "#9b365d", soft: "rgba(155,54,93,.16)", rgb: "155,54,93" },
];

const STATUS: Record<PulseState, { label: string; detail: string }> = {
  idle: { label: "PRÉSENCE STABLE", detail: "Le noyau attend votre signal." },
  listening: { label: "ÉCOUTE ACTIVE", detail: "Les mots, le rythme et la tension sont séparés." },
  interpreting: { label: "INTERPRÉTATION", detail: "Le système cherche le besoin derrière le message." },
  responding: { label: "RÉPONSE EN FORMATION", detail: "Une orientation claire se construit." },
};

type BrainNode = { x: number; y: number; z: number; size: number; phase: number; side: number };
type BrainEdge = { from: number; to: number; phase: number };

function randomFactory(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createBrain() {
  const random = randomFactory(14021999);
  const nodes: BrainNode[] = [];
  let attempts = 0;
  while (nodes.length < 190 && attempts < 9000) {
    attempts += 1;
    const side = random() > .5 ? 1 : -1;
    const x = side * (.08 + Math.pow(random(), .78) * .82);
    const y = (random() - .5) * 1.55;
    const inside = Math.pow((Math.abs(x) - .33) / .63, 2) + Math.pow((y + .02) / .78, 2) < 1;
    if (inside && !(Math.abs(x) < .13 && y < -.18)) nodes.push({ x, y, z: (random() - .5) * .85, size: .7 + random() * 1.8, phase: random() * Math.PI * 2, side });
  }
  const edges: BrainEdge[] = [];
  nodes.forEach((node, index) => {
    nodes.map((other, otherIndex) => ({ otherIndex, distance: Math.hypot(node.x - other.x, node.y - other.y, (node.z - other.z) * .42) }))
      .filter((item) => item.otherIndex !== index && item.distance < .29)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .forEach((item) => { if (item.otherIndex > index) edges.push({ from: index, to: item.otherIndex, phase: random() * Math.PI * 2 }); });
  });
  return { nodes, edges };
}

function NeuralBrain({ mood, pulse }: { mood: Mood; pulse: PulseState }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const geometry = useMemo(createBrain, []);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let width = 0;
    let height = 0;
    let frame = 0;
    let animation = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2.4);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event: PointerEvent) => { pointer.current = { x: event.clientX / innerWidth - .5, y: event.clientY / innerHeight - .5 }; };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    addEventListener("pointermove", move, { passive: true });
    resize();

    const draw = (time: number) => {
      frame += 1;
      const seconds = time / 1000;
      const activity = pulse === "idle" ? .75 : pulse === "interpreting" ? 1.45 : 1.1;
      const px = pointer.current.x;
      const py = pointer.current.y;
      const centerX = width * (width > 900 ? .69 : .5) + px * 55;
      const centerY = height * .45 + py * 38;
      const scale = Math.min(width, height) * (width > 900 ? .35 : .43);
      context.clearRect(0, 0, width, height);

      const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 1.35);
      glow.addColorStop(0, `rgba(${mood.rgb},${.2 * activity})`);
      glow.addColorStop(.42, `rgba(${mood.rgb},.06)`);
      glow.addColorStop(1, `rgba(${mood.rgb},0)`);
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const ry = px * .34 + Math.sin(seconds * .13) * .04;
      const rx = py * -.18;
      const projected = geometry.nodes.map((node) => {
        const x1 = node.x * Math.cos(ry) - node.z * Math.sin(ry);
        const z1 = node.x * Math.sin(ry) + node.z * Math.cos(ry);
        const y1 = node.y * Math.cos(rx) - z1 * Math.sin(rx);
        const z2 = node.y * Math.sin(rx) + z1 * Math.cos(rx);
        const perspective = 1 / (1.52 - z2 * .2);
        const ripple = Math.sin(seconds * .9 + node.phase) * .013 * activity;
        return { x: centerX + (x1 + ripple * node.side) * scale * perspective, y: centerY + (y1 + ripple * .5) * scale * perspective, z: z2, size: node.size * (.8 + perspective * .65), phase: node.phase };
      });

      geometry.edges.forEach((edge, index) => {
        const from = projected[edge.from];
        const to = projected[edge.to];
        const signal = (Math.sin(seconds * 1.35 + edge.phase) + 1) * .5;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = `rgba(${mood.rgb},${.07 + signal * .15})`;
        context.lineWidth = .45 + signal * .8;
        context.stroke();
        if ((index + frame) % 47 === 0) {
          const progress = (seconds * .25 + edge.phase) % 1;
          context.beginPath();
          context.arc(from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress, 2, 0, Math.PI * 2);
          context.fillStyle = `rgba(${mood.rgb},.9)`;
          context.shadowColor = mood.accent;
          context.shadowBlur = 14;
          context.fill();
          context.shadowBlur = 0;
        }
      });

      projected.sort((a, b) => a.z - b.z).forEach((node, index) => {
        const signal = (Math.sin(seconds + node.phase) + 1) * .5;
        context.beginPath();
        context.arc(node.x, node.y, node.size * (.7 + signal * .7), 0, Math.PI * 2);
        context.fillStyle = index % 19 === 0 ? "rgba(255,255,255,.96)" : `rgba(${mood.rgb},${.42 + signal * .5})`;
        context.shadowColor = mood.accent;
        context.shadowBlur = 6 + signal * 10;
        context.fill();
        context.shadowBlur = 0;
      });
      animation = requestAnimationFrame(draw);
    };
    animation = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animation); observer.disconnect(); removeEventListener("pointermove", move); };
  }, [geometry, mood, pulse]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

function Bars({ pulse }: { pulse: PulseState }) {
  return <div className={styles.bars} data-pulse={pulse} aria-hidden="true">{Array.from({ length: 19 }).map((_, index) => <span key={index} style={{ "--bar": index } as CSSProperties} />)}</div>;
}

export default function Home() {
  const [moodKey, setMoodKey] = useState<MoodKey>("calm");
  const [pulse, setPulse] = useState<PulseState>("idle");
  const [message, setMessage] = useState("Je me sens dispersé et je ne sais pas par quoi commencer.");
  const [response, setResponse] = useState("Commencez par isoler une seule tension. ATLAS transformera ensuite cette tension en prochaine action lisible.");
  const timers = useRef<number[]>([]);
  const mood = useMemo(() => MOODS.find((item) => item.key === moodKey) ?? MOODS[0], [moodKey]);
  const status = STATUS[pulse];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const analyse = () => {
    timers.current.forEach(clearTimeout);
    setPulse("listening");
    setResponse("");
    timers.current = [
      window.setTimeout(() => setPulse("interpreting"), 750),
      window.setTimeout(() => {
        setPulse("responding");
        const text = message.toLowerCase();
        setResponse(text.includes("peur") || text.includes("angoisse")
          ? "Nous n'allons pas forcer une solution. D'abord: ralentir, nommer ce qui vous menace, puis choisir une action qui augmente votre sécurité immédiate."
          : text.includes("colère") || text.includes("énerve")
            ? "La colère contient souvent une limite dépassée. Identifions la limite et la phrase la plus simple pour la poser clairement."
            : "Je sépare votre situation en trois couches: ce qui vous pèse, ce qui dépend de vous et la plus petite action utile. On commence par cette dernière.");
      }, 1550),
      window.setTimeout(() => setPulse("idle"), 3600),
    ];
  };

  const theme = { "--accent": mood.accent, "--accent-soft": mood.soft, "--accent-rgb": mood.rgb } as CSSProperties;

  return (
    <main className={styles.atlas} style={theme}>
      <div className={styles.background} aria-hidden="true"><div /><div /><i /></div>
      <NeuralBrain mood={mood} pulse={pulse} />

      <header className={styles.header}>
        <a className={styles.brand} href="#top"><span className={styles.mark}>A</span><span><strong>ATLAS</strong><small>EMOTIONAL INTELLIGENCE SYSTEM</small></span></a>
        <nav><a href="#vision">Vision</a><a href="#experience">Expérience</a><a href="#system">Système</a><a href="/connexion">Connexion</a></nav>
        <span className={styles.private}><i /> PRODUCTION PRIVÉE</span>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span>01</span> UNE PRÉSENCE NUMÉRIQUE VIVANTE</p>
          <h1>L'intelligence <em>qui change</em> avec vous.</h1>
          <p className={styles.lead}>ATLAS ne montre pas une interface. Il construit un environnement qui écoute, respire et se reconfigure selon votre signal.</p>
          <div className={styles.actions}><a className={styles.primary} href="#experience">Entrer dans l'expérience <span>→</span></a><a className={styles.secondary} href="#vision">Découvrir le système</a></div>
          <div className={styles.meta}><div><span>01</span><strong>PROCÉDURAL</strong><small>Aucune image préconçue</small></div><div><span>02</span><strong>ADAPTATIF</strong><small>Forme et rythme variables</small></div><div><span>03</span><strong>GOUVERNÉ</strong><small>Sécurité et consentement</small></div></div>
        </div>
        <aside className={styles.core}>
          <div className={styles.dial}><small>NEURAL CORE</small><b>{pulse === "interpreting" ? "96" : "72"}</b><span>% COHÉRENCE</span></div>
          <div className={styles.coreStatus}><i /><div><small>ÉTAT DU NOYAU</small><strong>{status.label}</strong><p>{status.detail}</p></div></div>
        </aside>
      </section>

      <section className={styles.vision} id="vision">
        <p className={styles.index}>02 / VISION</p>
        <div className={styles.heading}><div><p className={styles.eyebrow}><span>ATLAS</span> N'EST PAS UN CHATBOT</p><h2>Un organisme numérique composé de cellules qui coopèrent.</h2></div><p>Chaque cellule observe une dimension différente: émotion, contexte, urgence, intention, mémoire autorisée et prochaine action.</p></div>
        <div className={styles.gridCards}>
          <article className={styles.largeCard}><small>PERCEPTION / 01</small><div className={styles.scan}><i /><span>INTENTION</span><span>RYTHME</span><span>TENSION</span><b /></div><h3>Il ne lit pas seulement les mots.</h3><p>ATLAS distingue ce qui est dit, ce qui est ressenti et ce qui doit être traité en premier.</p></article>
          <article><small>ADAPTATION / 02</small><div className={styles.morph}><i /><i /><i /></div><h3>La forme se recompose.</h3><p>Densité, contraste, mouvement et langage évoluent sans casser l'identité.</p></article>
          <article><small>RESPIRATION / 03</small><div className={styles.breath}><i /><i /><i /></div><h3>Le rythme devient fonctionnel.</h3><p>Quand la charge augmente, l'interface ralentit et remet la priorité sur la stabilité.</p></article>
        </div>
      </section>

      <section className={styles.experience} id="experience">
        <p className={styles.index}>03 / EXPÉRIENCE</p>
        <div className={styles.heading}><div><p className={styles.eyebrow}><span>LIVE</span> MODIFIEZ L'ÉTAT DU SYSTÈME</p><h2>{mood.title}</h2></div><p>{mood.description}</p></div>
        <div className={styles.moods}>{MOODS.map((item, index) => <button key={item.key} className={item.key === mood.key ? styles.activeMood : ""} onClick={() => setMoodKey(item.key)}><span>0{index + 1}</span><strong>{item.label}</strong></button>)}</div>
        <div className={styles.stage}>
          <div className={styles.stageTop}><span><i /> SESSION EXPÉRIMENTALE</span><small>TRAITEMENT LOCAL / DÉMONSTRATION</small></div>
          <div className={styles.dialogue}><label htmlFor="message">Que se passe-t-il pour vous maintenant ?</label><textarea id="message" value={message} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setMessage(event.target.value)} maxLength={420} /><div><span>{message.length}/420</span><button onClick={analyse} disabled={!message.trim() || pulse !== "idle"}>{pulse === "idle" ? "Activer ATLAS" : status.label} <b>▶</b></button></div></div>
          <div className={styles.analysis}><header><div><small>ANALYSE DU SIGNAL</small><strong>{status.label}</strong></div><span>{pulse === "idle" ? "READY" : "LIVE"}</span></header><Bars pulse={pulse} /><div className={styles.metrics}><span><small>TENSION</small><b>{pulse === "idle" ? "42" : "68"}</b></span><span><small>CLARTÉ</small><b>{pulse === "responding" ? "81" : "54"}</b></span><span><small>URGENCE</small><b>18</b></span><span><small>AGENCE</small><b>{pulse === "responding" ? "76" : "47"}</b></span></div><div className={styles.response}><small>ORIENTATION ATLAS</small><p>{response || "Le système compose une orientation..."}</p><div><span>Sans diagnostic</span><span>Action concrète</span><span>Contrôle humain</span></div></div></div>
        </div>
      </section>

      <section className={styles.system} id="system">
        <p className={styles.index}>04 / SYSTÈME</p>
        <div className={styles.heading}><div><p className={styles.eyebrow}><span>ARCHITECTURE</span> INTELLIGENCE DISTRIBUÉE</p><h2>Six couches. Une seule présence.</h2></div></div>
        <div className={styles.orbit}><div className={styles.orbitCore}><small>ATLAS</small><strong>CORE</strong><span>ÉTAT COHÉRENT</span></div>{["PERCEPTION", "SÉCURITÉ", "MÉMOIRE", "LANGAGE", "ACTION", "MESURE"].map((label, index) => <article key={label} style={{ "--angle": `${index * 60 - 90}deg`, "--counter": `${90 - index * 60}deg` } as CSSProperties}><small>0{index + 1}</small><strong>{label}</strong><span>ONLINE</span></article>)}<i className={styles.ringA} /><i className={styles.ringB} /></div>
      </section>

      <section className={styles.final}><p className={styles.eyebrow}><span>ATLAS</span> PRIVATE RELEASE</p><h2>La technologie doit disparaître.<br />La présence doit rester.</h2><p>Cette version est une expérience privée. Le produit complet conservera ce niveau d'immersion dans chaque parcours.</p><a className={styles.primary} href="#experience">Revenir à l'expérience <span>↑</span></a></section>
      <footer><div className={styles.brand}><span className={styles.mark}>A</span><span><strong>ATLAS</strong><small>INTELLIGENCE ÉMOTIONNELLE VIVANTE</small></span></div><div>VERSION 2.0 / PRIVATE · PARIS / 2026</div></footer>
    </main>
  );
}
