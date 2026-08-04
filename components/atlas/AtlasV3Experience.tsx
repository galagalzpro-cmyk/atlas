"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../../app/atlas-v3.module.css";

type Mode = "presence" | "clarity" | "calm" | "momentum";

type Theme = {
  label: string;
  title: string;
  subtitle: string;
  accent: string;
  rgb: string;
};

const THEMES: Record<Mode, Theme> = {
  presence: { label: "Présence", title: "Je suis là.", subtitle: "Une présence stable qui observe avant d'agir.", accent: "#b9a27b", rgb: "185,162,123" },
  clarity: { label: "Clarté", title: "Le bruit recule.", subtitle: "Les tensions deviennent lisibles et les priorités apparaissent.", accent: "#7f9fa3", rgb: "127,159,163" },
  calm: { label: "Apaisement", title: "Le rythme ralentit.", subtitle: "L'espace respire avec vous sans vous enfermer.", accent: "#9987b9", rgb: "153,135,185" },
  momentum: { label: "Élan", title: "Une direction se forme.", subtitle: "ATLAS transforme l'intention en mouvement concret.", accent: "#b87552", rgb: "184,117,82" },
};

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function NeuralField({ rgb, intensity }: { rgb: string; intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const nodes = useMemo(() => {
    const random = seeded(24081999);
    return Array.from({ length: 210 }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), .62);
      const hemisphere = index % 2 === 0 ? -1 : 1;
      const x = Math.cos(angle) * radius * .88 + hemisphere * .22;
      const y = Math.sin(angle) * radius * .7 - .04;
      const z = (random() - .5) * .9;
      return { x, y, z, phase: random() * Math.PI * 2, size: .8 + random() * 1.9 };
    }).filter((node) => Math.abs(node.x) > .06 || node.y > .08);
  }, []);

  const edges = useMemo(() => {
    const result: Array<[number, number, number]> = [];
    nodes.forEach((node, index) => {
      nodes
        .map((other, otherIndex) => ({ otherIndex, distance: Math.hypot(node.x - other.x, node.y - other.y, (node.z - other.z) * .45) }))
        .filter((item) => item.otherIndex > index && item.distance < .22)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
        .forEach((item) => result.push([index, item.otherIndex, item.distance]));
    });
    return result;
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    let animation = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const move = (event: PointerEvent) => {
      pointer.current = { x: event.clientX / window.innerWidth - .5, y: event.clientY / window.innerHeight - .5 };
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("pointermove", move, { passive: true });
    resize();

    const draw = (time: number) => {
      const seconds = time / 1000;
      const centerX = width * (width > 900 ? .69 : .52) + pointer.current.x * 52;
      const centerY = height * .43 + pointer.current.y * 35;
      const scale = Math.min(width, height) * (width > 900 ? .34 : .43);
      const yaw = pointer.current.x * .36 + Math.sin(seconds * .11) * .045;
      const pitch = pointer.current.y * -.18;
      context.clearRect(0, 0, width, height);

      const aura = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 1.5);
      aura.addColorStop(0, `rgba(${rgb},${.18 * intensity})`);
      aura.addColorStop(.42, `rgba(${rgb},.055)`);
      aura.addColorStop(1, `rgba(${rgb},0)`);
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      const projected = nodes.map((node) => {
        const x1 = node.x * Math.cos(yaw) - node.z * Math.sin(yaw);
        const z1 = node.x * Math.sin(yaw) + node.z * Math.cos(yaw);
        const y1 = node.y * Math.cos(pitch) - z1 * Math.sin(pitch);
        const z2 = node.y * Math.sin(pitch) + z1 * Math.cos(pitch);
        const perspective = 1 / (1.5 - z2 * .19);
        const breathe = Math.sin(seconds * .8 + node.phase) * .01 * intensity;
        return { x: centerX + (x1 + breathe) * scale * perspective, y: centerY + (y1 + breathe * .4) * scale * perspective, z: z2, phase: node.phase, size: node.size * perspective };
      });

      edges.forEach(([fromIndex, toIndex], index) => {
        const from = projected[fromIndex];
        const to = projected[toIndex];
        const signal = (Math.sin(seconds * 1.25 + from.phase + index * .07) + 1) * .5;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = `rgba(${rgb},${.05 + signal * .17 * intensity})`;
        context.lineWidth = .45 + signal * .75;
        context.stroke();
        if ((index + frame) % 61 === 0) {
          const progress = (seconds * .22 + index * .013) % 1;
          context.beginPath();
          context.arc(from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress, 1.9, 0, Math.PI * 2);
          context.fillStyle = `rgba(${rgb},.92)`;
          context.shadowColor = `rgb(${rgb})`;
          context.shadowBlur = 14;
          context.fill();
          context.shadowBlur = 0;
        }
      });

      projected.sort((a, b) => a.z - b.z).forEach((node, index) => {
        const pulse = (Math.sin(seconds + node.phase) + 1) * .5;
        context.beginPath();
        context.arc(node.x, node.y, node.size * (.65 + pulse * .75), 0, Math.PI * 2);
        context.fillStyle = index % 21 === 0 ? "rgba(255,255,255,.96)" : `rgba(${rgb},${.34 + pulse * .55})`;
        context.shadowColor = `rgb(${rgb})`;
        context.shadowBlur = 6 + pulse * 12;
        context.fill();
        context.shadowBlur = 0;
      });

      frame += 1;
      animation = window.requestAnimationFrame(draw);
    };

    animation = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(animation);
      observer.disconnect();
      window.removeEventListener("pointermove", move);
    };
  }, [edges, intensity, nodes, rgb]);

  return <canvas ref={canvasRef} className={styles.neuralCanvas} aria-hidden="true" />;
}

export default function AtlasV3Experience() {
  const [mode, setMode] = useState<Mode>("presence");
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("J'ai besoin de remettre de l'ordre dans ce que je ressens.");
  const [answer, setAnswer] = useState("Commençons par isoler une seule tension. Le reste attendra. Quel élément prend le plus de place maintenant ?");
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking">("idle");
  const timers = useRef<number[]>([]);
  const theme = THEMES[mode];

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const analyse = () => {
    timers.current.forEach(window.clearTimeout);
    setPhase("listening");
    setAnswer("");
    timers.current = [
      window.setTimeout(() => setPhase("thinking"), 650),
      window.setTimeout(() => {
        const lower = message.toLowerCase();
        setAnswer(lower.includes("peur") || lower.includes("angoisse")
          ? "Nous ne chercherons pas à tout résoudre. D'abord, sécurisons le présent : nommer la menace, réduire l'incertitude et choisir une action immédiatement protectrice."
          : lower.includes("colère") || lower.includes("énerv")
            ? "La colère indique souvent une limite franchie. Identifions cette limite, puis formulons-la sans détour et sans violence."
            : "Je sépare ce que vous ressentez, ce qui dépend de vous et ce qui doit attendre. Nous allons commencer par la plus petite action réellement utile.");
        setPhase("idle");
      }, 1600),
    ];
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setCursor({ x: (event.clientX - bounds.left) / bounds.width - .5, y: (event.clientY - bounds.top) / bounds.height - .5 });
  };

  const style = {
    "--accent": theme.accent,
    "--accent-rgb": theme.rgb,
    "--mx": cursor.x,
    "--my": cursor.y,
  } as CSSProperties;

  return (
    <main className={styles.page} style={style} onPointerMove={onPointerMove}>
      <div className={styles.atmosphere} aria-hidden="true"><span /><span /><span /></div>
      <NeuralField rgb={theme.rgb} intensity={phase === "thinking" ? 1.45 : phase === "listening" ? 1.2 : 1} />

      <header className={styles.navbar}>
        <a className={styles.brand} href="#top"><span className={styles.brandOrb}>A</span><span><strong>ATLAS</strong><small>INTELLIGENCE ÉMOTIONNELLE VIVANTE</small></span></a>
        <nav><a href="#vision">Vision</a><a href="#experience">Expérience</a><a href="#universes">Univers</a><a href="#trust">Confiance</a></nav>
        <a className={styles.privateAccess} href="/connexion"><i /> Accès privé</a>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span>ATLAS / V3</span> UNE PRÉSENCE NUMÉRIQUE</p>
          <h1>Une intelligence qui <em>ressent l'espace</em> entre vos mots.</h1>
          <p className={styles.heroLead}>ATLAS transforme une conversation en environnement vivant : la lumière, le rythme, la densité et les cellules se recomposent en temps réel.</p>
          <div className={styles.heroActions}><a className={styles.primary} href="#experience">Entrer dans l'expérience <span>↗</span></a><a className={styles.secondary} href="#vision">Comprendre le système</a></div>
          <div className={styles.heroMetrics}>
            <div><small>01</small><strong>Procédural</strong><span>Aucune scène préfabriquée</span></div>
            <div><small>02</small><strong>Adaptatif</strong><span>Réagit au signal humain</span></div>
            <div><small>03</small><strong>Gouverné</strong><span>Sécurité avant spectacle</span></div>
          </div>
        </div>

        <aside className={styles.heroCore} aria-label="État du noyau ATLAS">
          <div className={styles.orbit}><i /><i /><i /></div>
          <div className={styles.coreLabel}><small>NEURAL CORE / 03</small><strong>{theme.title}</strong><p>{theme.subtitle}</p></div>
          <div className={styles.coherence}><span>{phase === "thinking" ? "96" : phase === "listening" ? "84" : "72"}</span><small>COHÉRENCE</small></div>
        </aside>
      </section>

      <section className={styles.statement} id="vision">
        <p className={styles.sectionIndex}>02 / MANIFESTE</p>
        <h2>Ce n'est pas une interface.<br /><em>C'est un organisme numérique.</em></h2>
        <div className={styles.statementGrid}>
          <p>Chaque cellule observe une dimension différente : émotion, rythme, contexte, sécurité, mémoire autorisée et prochaine action.</p>
          <p>Le décor n'est jamais décoratif. Il devient une traduction directe de l'état de l'échange.</p>
        </div>
      </section>

      <section className={styles.experience} id="experience">
        <div className={styles.experienceHeading}><p className={styles.sectionIndex}>03 / INTERACTION TEMPS RÉEL</p><h2>Parlez. Le système se transforme.</h2></div>
        <div className={styles.modeRail} role="tablist" aria-label="États émotionnels">
          {(Object.keys(THEMES) as Mode[]).map((key, index) => <button key={key} className={mode === key ? styles.activeMode : ""} onClick={() => setMode(key)}><span>0{index + 1}</span><strong>{THEMES[key].label}</strong></button>)}
        </div>
        <div className={styles.console}>
          <div className={styles.consoleHeader}><span><i /> ATLAS / SESSION PRIVÉE</span><small>{phase === "thinking" ? "INTERPRÉTATION" : phase === "listening" ? "ÉCOUTE" : "PRÉSENCE STABLE"}</small></div>
          <div className={styles.dialogue}>
            <label htmlFor="atlas-message">Que veux-tu rendre plus clair maintenant ?</label>
            <textarea id="atlas-message" value={message} onChange={(event) => setMessage(event.target.value)} />
            <button onClick={analyse} disabled={phase !== "idle"}>{phase === "idle" ? "Laisser ATLAS interpréter" : "Signal en cours"}<span>→</span></button>
          </div>
          <div className={styles.responsePanel}>
            <div className={styles.wave}>{Array.from({ length: 28 }).map((_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}</div>
            <small>RÉPONSE DU NOYAU</small>
            <p>{phase === "listening" ? "Je vous écoute." : phase === "thinking" ? "Je sépare les faits, les émotions et le besoin." : answer}</p>
          </div>
        </div>
      </section>

      <section className={styles.universes} id="universes">
        <p className={styles.sectionIndex}>04 / UNIVERS ADAPTATIFS</p>
        <div className={styles.universeHeading}><h2>Une même intelligence.<br />Trois rythmes de vie.</h2><p>Le langage, la densité et l'accompagnement changent. Les exigences de sécurité restent identiques.</p></div>
        <div className={styles.universeGrid}>
          <article><span>01</span><small>ADOLESCENTS</small><h3>Comprendre sans être jugé.</h3><p>Un univers expressif, direct et protecteur qui aide à nommer ce qui déborde.</p><i /></article>
          <article><span>02</span><small>ADULTES</small><h3>Reprendre de la clarté.</h3><p>Un environnement précis pour traverser la pression, les choix et les transitions.</p><i /></article>
          <article><span>03</span><small>SENIORS</small><h3>Rester relié et autonome.</h3><p>Une présence lisible, chaleureuse et respectueuse du rythme de chacun.</p><i /></article>
        </div>
      </section>

      <section className={styles.system}>
        <p className={styles.sectionIndex}>05 / CELLULES INTELLIGENTES</p>
        <div className={styles.systemGrid}>
          {[
            ["Perception", "Détecte les signaux faibles sans produire de diagnostic."],
            ["Contexte", "Sépare les faits, les hypothèses et les incertitudes."],
            ["Sécurité", "Interrompt le spectacle quand une protection devient prioritaire."],
            ["Orientation", "Transforme la compréhension en prochaine action concrète."],
          ].map(([title, text], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}
        </div>
      </section>

      <section className={styles.trust} id="trust">
        <div><p className={styles.sectionIndex}>06 / CONFIANCE</p><h2>La sophistication n'existe que si elle reste gouvernée.</h2></div>
        <div className={styles.trustGrid}><article><strong>Consentement explicite</strong><p>Chaque mémoire et chaque intégration externe sont contrôlables.</p></article><article><strong>Architecture traçable</strong><p>Les actions sensibles sont auditées sans conserver les textes émotionnels.</p></article><article><strong>Protection prioritaire</strong><p>Les signaux urgents désactivent l'IA externe et activent les garde-fous locaux.</p></article></div>
      </section>

      <footer className={styles.footer}><a className={styles.brand} href="#top"><span className={styles.brandOrb}>A</span><span><strong>ATLAS</strong><small>PRIVATE RESEARCH EXPERIENCE</small></span></a><p>Version de recherche — aucune validation graphique définitive.</p><a href="/connexion">Entrer dans l'espace privé ↗</a></footer>
    </main>
  );
}
