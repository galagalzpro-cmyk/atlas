"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { selectCells } from "../lib/atlas/cells";
import { clearPreferences, readPreferences, writePreferences } from "../lib/atlas/persistence";
import { atlasReducer } from "../lib/atlas/reducer";
import { INITIAL_ATLAS_STATE, type AtlasAudience, type AtlasPresenceState } from "../lib/atlas/types";

const STATES: Record<AtlasPresenceState, { label: string; detail: string }> = {
  awakening: { label: "Éveil", detail: "Synchronisation des cellules essentielles" },
  ready: { label: "Présence établie", detail: "ATLAS est prêt à s’adapter" },
  listening: { label: "Écoute", detail: "La présence se concentre sur votre signal" },
  thinking: { label: "Interprétation", detail: "Les faits, besoins et incertitudes sont séparés" },
  speaking: { label: "Expression", detail: "La réponse prend forme sans masquer l’incertitude" },
  calm: { label: "Mode calme", detail: "Mouvement et densité visuelle réduits" },
  vigilance: { label: "Vigilance", detail: "Les protections prioritaires sont activées" },
};

const AUDIENCE_LABELS: Record<AtlasAudience, string> = {
  adolescent: "Adolescents",
  adult: "Adultes",
  senior: "Seniors",
};

export default function Home() {
  const [runtime, dispatch] = useReducer(atlasReducer, INITIAL_ATLAS_STATE);
  const [text, setText] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = readPreferences();
    if (saved) {
      dispatch({ type: "AUDIENCE_SET", audience: saved.audience });
      dispatch({ type: "MEMORY_CONSENT_SET", enabled: saved.memoryConsent });
      dispatch({ type: "CALM_MODE_SET", enabled: saved.calmMode });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writePreferences(runtime);
  }, [hydrated, runtime.audience, runtime.calmMode, runtime.memoryConsent]);

  useEffect(() => {
    if (runtime.presence !== "awakening") return;
    const timer = window.setInterval(() => {
      const next = Math.min(100, runtime.awakeningProgress + Math.max(3, Math.round((100 - runtime.awakeningProgress) / 7)));
      dispatch({ type: "AWAKENING_PROGRESS", progress: next });
      if (next === 100) {
        window.clearInterval(timer);
        window.setTimeout(() => dispatch({ type: "AWAKENING_COMPLETE" }), 320);
      }
    }, 130);
    return () => window.clearInterval(timer);
  }, [runtime.awakeningProgress, runtime.presence]);

  const current = STATES[runtime.presence];
  const cells = useMemo(
    () => selectCells(runtime.audience, runtime.presence === "awakening" ? "ready" : runtime.presence),
    [runtime.audience, runtime.presence],
  );

  function submit() {
    const value = text.trim();
    if (!value) return;
    dispatch({ type: "USER_SUBMITTED_INPUT", text: value });
    window.setTimeout(() => dispatch({ type: "INTERPRETATION_STARTED" }), 650);
    window.setTimeout(() => dispatch({ type: "RESPONSE_STARTED" }), 1500);
    window.setTimeout(() => dispatch({ type: "RESPONSE_COMPLETED" }), 3000);
  }

  function setAudience(audience: AtlasAudience) {
    dispatch({ type: "AUDIENCE_SET", audience });
  }

  return (
    <main className={runtime.calmMode ? "atlas calm" : "atlas"} data-state={runtime.presence}>
      <div className="ambient" aria-hidden="true"><div className="mist mist-a" /><div className="mist mist-b" /><div className="grid-field" /></div>

      <header className="topbar">
        <a className="brand" href="#home" aria-label="ATLAS, accueil"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>INTELLIGENCE ÉMOTIONNELLE VIVANTE</small></span></a>
        <nav aria-label="Navigation principale"><a href="#home">Accueil</a><a href="#univers">Univers</a><a href="#cells">Cellules</a><a href="#trust">Confiance</a></nav>
        <button className="quiet-button" onClick={() => dispatch({ type: "CALM_MODE_SET", enabled: !runtime.calmMode })}>{runtime.calmMode ? "Réactiver la présence" : "Mode calme"}</button>
      </header>

      {runtime.presence === "awakening" ? (
        <section className="awakening" aria-live="polite">
          <div className="awakening-core" style={{ "--progress": `${runtime.awakeningProgress}%` } as React.CSSProperties}><div className="pulse" /><div className="pulse pulse-two" /><div className="seed" /></div>
          <p className="kicker">ATLAS AWAKENING</p><h1>La présence se construit.</h1><p>{current.detail}</p>
          <div className="progress" aria-label={`Chargement ${runtime.awakeningProgress} %`}><span style={{ width: `${runtime.awakeningProgress}%` }} /></div>
          <button onClick={() => dispatch({ type: "AWAKENING_COMPLETE" })}>Entrer directement</button>
        </section>
      ) : (
        <>
          <section className="hero" id="home">
            <div className="hero-copy">
              <p className="kicker">ATLAS / ORCHESTRATEUR ACTIF</p>
              <h1>Une intelligence qui change de forme.<br /><em>Jamais de nature.</em></h1>
              <p className="lead">Chaque action déclenche un événement explicite. La présence, les cellules, l’accessibilité et la mémoire autorisée évoluent ensemble.</p>
              <div className="composer">
                <label htmlFor="entry">Qu’est-ce qui vous occupe aujourd’hui ?</label>
                <textarea id="entry" value={text} onFocus={() => dispatch({ type: "USER_STARTED_INPUT" })} onChange={(event) => setText(event.target.value)} placeholder="Parlez librement. ATLAS distinguera ce qui est certain, probable, émotionnel ou encore imprécis." />
                <div className="composer-actions"><button onClick={() => dispatch({ type: "USER_STARTED_INPUT" })}>Parler</button><button className="primary" onClick={submit}>Entrer dans ATLAS</button></div>
              </div>
              <div className="principles"><span>Événements traçables</span><span>Aucun diagnostic</span><span>Mémoire contrôlable</span><span>Transitions réversibles</span></div>
            </div>

            <div className="presence-stage" aria-label={`État d’ATLAS : ${current.label}`}>
              <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
              <div className="presence-shell"><div className="crown" /><div className="attention"><i /><i /></div><div className="voice-organ" /><div className="neural neural-a" /><div className="neural neural-b" /><div className="neural neural-c" /></div>
              <div className="status"><span>ÉTAT</span><strong>{current.label}</strong><small>{current.detail}</small></div>
            </div>
          </section>

          <section className="section" id="univers">
            <p className="kicker">UN NOYAU / TROIS ÉCOSYSTÈMES</p><h2>L’utilisateur choisit son univers. ATLAS adapte ensuite la forme.</h2>
            <div className="cards">
              {(Object.keys(AUDIENCE_LABELS) as AtlasAudience[]).map((audience, index) => (
                <article key={audience} className={runtime.audience === audience ? "selected" : ""}>
                  <span>0{index + 1}</span><h3>{AUDIENCE_LABELS[audience]}</h3>
                  <p>{audience === "adolescent" ? "Mode discret, adulte de confiance et protections renforcées." : audience === "senior" ? "Voix prioritaire, texte agrandi, rythme lent et sécurité numérique." : "Charge mentale, décisions, relations, travail et reconstruction."}</p>
                  <button onClick={() => setAudience(audience)}>Activer cet univers</button>
                </article>
              ))}
            </div>
          </section>

          <section className="section architecture" id="cells">
            <p className="kicker">REGISTRE DE CELLULES</p><h2>{cells.length} cellule(s) compatible(s) avec {AUDIENCE_LABELS[runtime.audience]} et l’état actuel.</h2>
            <div className="cards">
              {cells.map((cell) => <article key={cell.id}><span>{cell.durationMinutes} MIN</span><h3>{cell.title}</h3><p>{cell.purpose}</p><small>{cell.safetyLevel === "reinforced" ? "Protection renforcée" : "Protection standard"}</small></article>)}
            </div>
          </section>

          <section className="section trust" id="trust">
            <p className="kicker">MÉMOIRE SOUS CONSENTEMENT</p><h2>Les préférences peuvent être conservées. Le contenu sensible ne l’est pas.</h2>
            <p className="lead">Univers, mode calme et choix de mémoire sont stockés localement. Les paroles saisies ne sont pas persistées par ce socle.</p>
            <div className="composer-actions"><button onClick={() => dispatch({ type: "MEMORY_CONSENT_SET", enabled: !runtime.memoryConsent })}>{runtime.memoryConsent ? "Désactiver la mémoire" : "Autoriser la mémoire"}</button><button onClick={() => { clearPreferences(); dispatch({ type: "RESET_SESSION" }); }}>Effacer les préférences</button></div>
          </section>
        </>
      )}
    </main>
  );
}
