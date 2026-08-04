"use client";

import { useEffect, useMemo, useState } from "react";

type PresenceState = "awakening" | "ready" | "listening" | "thinking" | "speaking" | "calm";

const STATES: Record<PresenceState, { label: string; detail: string }> = {
  awakening: { label: "Éveil", detail: "Synchronisation des cellules essentielles" },
  ready: { label: "Présence établie", detail: "ATLAS est prêt à s’adapter" },
  listening: { label: "Écoute", detail: "La présence se concentre sur votre signal" },
  thinking: { label: "Interprétation", detail: "Les faits, besoins et incertitudes sont séparés" },
  speaking: { label: "Expression", detail: "La réponse prend forme sans masquer l’incertitude" },
  calm: { label: "Mode calme", detail: "Mouvement et densité visuelle réduits" },
};

export default function Home() {
  const [state, setState] = useState<PresenceState>("awakening");
  const [progress, setProgress] = useState(8);
  const [calm, setCalm] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (state !== "awakening") return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(100, value + Math.max(2, Math.round((100 - value) / 8)));
        if (next === 100) {
          window.clearInterval(timer);
          window.setTimeout(() => setState("ready"), 320);
        }
        return next;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [state]);

  const current = useMemo(() => STATES[calm ? "calm" : state], [calm, state]);

  function submit() {
    if (!text.trim()) return;
    setState("listening");
    window.setTimeout(() => setState("thinking"), 700);
    window.setTimeout(() => setState("speaking"), 1700);
    window.setTimeout(() => setState("ready"), 3200);
  }

  return (
    <main className={calm ? "atlas calm" : "atlas"} data-state={state}>
      <div className="ambient" aria-hidden="true">
        <div className="mist mist-a" />
        <div className="mist mist-b" />
        <div className="grid-field" />
      </div>

      <header className="topbar">
        <a className="brand" href="#home" aria-label="ATLAS, accueil">
          <span className="brand-mark">A</span>
          <span><strong>ATLAS</strong><small>INTELLIGENCE ÉMOTIONNELLE VIVANTE</small></span>
        </a>
        <nav aria-label="Navigation principale">
          <a href="#home">Accueil</a><a href="#univers">Univers</a><a href="#architecture">Architecture</a><a href="#trust">Confiance</a>
        </nav>
        <button className="quiet-button" onClick={() => setCalm((value) => !value)}>
          {calm ? "Réactiver la présence" : "Mode calme"}
        </button>
      </header>

      {state === "awakening" && (
        <section className="awakening" aria-live="polite">
          <div className="awakening-core" style={{ "--progress": `${progress}%` } as React.CSSProperties}>
            <div className="pulse" /><div className="pulse pulse-two" /><div className="seed" />
          </div>
          <p className="kicker">ATLAS AWAKENING</p>
          <h1>La présence se construit.</h1>
          <p>{current.detail}</p>
          <div className="progress" aria-label={`Chargement ${progress} %`}><span style={{ width: `${progress}%` }} /></div>
          <button onClick={() => { setProgress(100); setState("ready"); }}>Entrer directement</button>
        </section>
      )}

      {state !== "awakening" && (
        <>
          <section className="hero" id="home">
            <div className="hero-copy">
              <p className="kicker">ATLAS / INFRASTRUCTURE ADAPTATIVE</p>
              <h1>Une intelligence qui change de forme.<br /><em>Jamais de nature.</em></h1>
              <p className="lead">ATLAS écoute, clarifie, régule et oriente. L’interface, la voix, la densité et l’environnement s’adaptent sans modifier son socle éthique.</p>
              <div className="composer">
                <label htmlFor="entry">Qu’est-ce qui vous occupe aujourd’hui ?</label>
                <textarea id="entry" value={text} onChange={(event) => setText(event.target.value)} placeholder="Parlez librement. ATLAS distinguera ce qui est certain, probable, émotionnel ou encore imprécis." />
                <div className="composer-actions"><button onClick={() => setState("listening")}>Parler</button><button className="primary" onClick={submit}>Entrer dans ATLAS</button></div>
              </div>
              <div className="principles"><span>IA clairement identifiée</span><span>Aucun diagnostic</span><span>Mémoire contrôlable</span><span>Hypothèses corrigibles</span></div>
            </div>

            <div className="presence-stage" aria-label={`État d’ATLAS : ${current.label}`}>
              <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
              <div className="presence-shell">
                <div className="crown" /><div className="attention"><i /><i /></div><div className="voice-organ" />
                <div className="neural neural-a" /><div className="neural neural-b" /><div className="neural neural-c" />
              </div>
              <div className="status"><span>ÉTAT</span><strong>{current.label}</strong><small>{current.detail}</small></div>
            </div>
          </section>

          <section className="section" id="univers">
            <p className="kicker">UN NOYAU / TROIS ÉCOSYSTÈMES</p><h2>Chaque public reçoit une expérience complète.</h2>
            <div className="cards">
              <article><span>01</span><h3>Adolescents</h3><p>École, famille, relations, pression, harcèlement, adulte de confiance et mode discret.</p></article>
              <article><span>02</span><h3>Adultes</h3><p>Charge mentale, décisions, travail, relations, transitions, limites et reconstruction.</p></article>
              <article><span>03</span><h3>Seniors</h3><p>Voix prioritaire, lisibilité, organisation, transmission, lien social, sécurité et aidants.</p></article>
            </div>
          </section>

          <section className="section architecture" id="architecture">
            <p className="kicker">HORLOGERIE LOGICIELLE</p><h2>Chaque cellule connaît son rôle, ses dépendances et ses limites.</h2>
            <div className="mechanism"><div>Percevoir</div><div>Comprendre</div><div>Évaluer</div><div>Adapter</div><div>Interagir</div><div>Corriger</div></div>
          </section>

          <section className="section trust" id="trust"><p className="kicker">CONFIANCE PAR CONSTRUCTION</p><h2>Autonome, mais jamais incontrôlé.</h2><p className="lead">Les choix d’ATLAS doivent rester explicables, réversibles et soumis aux règles de sécurité, de consentement et d’accessibilité.</p></section>
        </>
      )}
    </main>
  );
}
