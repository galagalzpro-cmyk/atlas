"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Awakening } from "../components/atlas/Awakening";
import { AudienceSelector, AUDIENCE_LABELS } from "../components/atlas/AudienceSelector";
import { CellRegistryView } from "../components/atlas/CellRegistryView";
import { ConversationSession } from "../components/atlas/ConversationSession";
import { GuidedJourney } from "../components/atlas/GuidedJourney";
import { Presence } from "../components/atlas/Presence";
import { clearAtlasEvents } from "../lib/atlas/analytics";
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

const VISIT_KEY = "atlas.hasVisited";

export default function Home() {
  const [runtime, dispatch] = useReducer(atlasReducer, INITIAL_ATLAS_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const saved = readPreferences();
    const hasVisited = window.localStorage.getItem(VISIT_KEY) === "1";
    setReturning(hasVisited);
    if (saved) {
      dispatch({ type: "AUDIENCE_SET", audience: saved.audience });
      dispatch({ type: "MEMORY_CONSENT_SET", enabled: saved.memoryConsent });
      dispatch({ type: "CALM_MODE_SET", enabled: saved.calmMode });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (runtime.memoryConsent) writePreferences(runtime);
    else clearPreferences();
  }, [hydrated, runtime.audience, runtime.calmMode, runtime.memoryConsent]);

  useEffect(() => {
    if (runtime.presence !== "awakening") return;
    const cadence = returning ? 70 : 130;
    const timer = window.setInterval(() => {
      const step = returning ? 12 : Math.max(3, Math.round((100 - runtime.awakeningProgress) / 7));
      const next = Math.min(100, runtime.awakeningProgress + step);
      dispatch({ type: "AWAKENING_PROGRESS", progress: next });
      if (next === 100) {
        window.clearInterval(timer);
        window.localStorage.setItem(VISIT_KEY, "1");
        window.setTimeout(() => dispatch({ type: "AWAKENING_COMPLETE" }), returning ? 120 : 320);
      }
    }, cadence);
    return () => window.clearInterval(timer);
  }, [returning, runtime.awakeningProgress, runtime.presence]);

  const current = STATES[runtime.presence];
  const cells = useMemo(() => selectCells(runtime.audience, runtime.presence === "awakening" ? "ready" : runtime.presence), [runtime.audience, runtime.presence]);

  function setAudience(audience: AtlasAudience) {
    dispatch({ type: "AUDIENCE_SET", audience });
  }

  function setConversationPhase(phase: "listening" | "thinking" | "speaking" | "ready" | "vigilance") {
    if (phase === "listening") dispatch({ type: "USER_STARTED_INPUT" });
    if (phase === "thinking") dispatch({ type: "INTERPRETATION_STARTED" });
    if (phase === "speaking") dispatch({ type: "RESPONSE_STARTED" });
    if (phase === "ready") dispatch({ type: "RESPONSE_COMPLETED" });
    if (phase === "vigilance") dispatch({ type: "SAFETY_ALERT" });
  }

  function eraseAllLocalData() {
    clearPreferences();
    clearAtlasEvents();
    window.localStorage.removeItem(VISIT_KEY);
    setReturning(false);
    dispatch({ type: "RESET_SESSION" });
  }

  const className = ["atlas", runtime.calmMode ? "calm" : "", `audience-${runtime.audience}`].filter(Boolean).join(" ");

  return (
    <main className={className} data-state={runtime.presence}>
      <div className="ambient" aria-hidden="true"><div className="mist mist-a" /><div className="mist mist-b" /><div className="grid-field" /></div>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="ATLAS, accueil"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>INTELLIGENCE ÉMOTIONNELLE VIVANTE</small></span></a>
        <nav aria-label="Navigation principale"><a href="#home">Accueil</a><a href="#session">Session</a><a href="#journey">Parcours</a><a href="#univers">Univers</a><a href="#cells">Cellules</a><a href="#trust">Confiance</a></nav>
        <button className="quiet-button" onClick={() => dispatch({ type: "CALM_MODE_SET", enabled: !runtime.calmMode })}>{runtime.calmMode ? "Réactiver la présence" : "Mode calme"}</button>
      </header>

      {runtime.presence === "awakening" ? (
        <Awakening progress={runtime.awakeningProgress} returning={returning} detail={current.detail} onSkip={() => { window.localStorage.setItem(VISIT_KEY, "1"); dispatch({ type: "AWAKENING_COMPLETE" }); }} />
      ) : (
        <>
          <section className="hero" id="home">
            <div className="hero-copy">
              <p className="kicker">ATLAS / {AUDIENCE_LABELS[runtime.audience].toUpperCase()}</p>
              <h1>Une intelligence qui change de forme.<br /><em>Jamais de nature.</em></h1>
              <p className="lead">La présence, le rythme, la densité et les cellules s’adaptent à l’univers choisi, tout en conservant les mêmes règles de sécurité et de consentement.</p>
              <a className="session-link" href="#session">Commencer une session structurée</a>
              <div className="principles"><span>Événements traçables</span><span>Aucun diagnostic</span><span>Mémoire contrôlable</span><span>Transitions réversibles</span></div>
            </div>
            <Presence label={current.label} detail={current.detail} />
          </section>

          <div id="session" className="section">
            <ConversationSession audience={runtime.audience} analyticsConsent={runtime.memoryConsent} onPhase={setConversationPhase} />
          </div>

          <div id="journey" className="section">
            <GuidedJourney audience={runtime.audience} analyticsConsent={runtime.memoryConsent} />
          </div>

          <section className="section" id="univers">
            <p className="kicker">UN NOYAU / TROIS ÉCOSYSTÈMES</p><h2>L’utilisateur choisit son univers. ATLAS adapte ensuite la forme.</h2>
            <AudienceSelector active={runtime.audience} onSelect={setAudience} />
          </section>

          <section className="section architecture" id="cells">
            <p className="kicker">REGISTRE DE CELLULES</p><h2>{cells.length} cellule(s) compatible(s) avec {AUDIENCE_LABELS[runtime.audience]} et l’état actuel.</h2>
            <CellRegistryView cells={cells} />
          </section>

          <section className="section trust" id="trust">
            <p className="kicker">MÉMOIRE ET MESURE SOUS CONSENTEMENT</p><h2>Sans autorisation, aucune préférence ni mesure locale n’est conservée.</h2>
            <p className="lead">Lorsque la mémoire est autorisée, ATLAS conserve uniquement l’univers, le mode calme et des événements techniques sans texte libre. Tout peut être effacé immédiatement.</p>
            <div className="composer-actions"><button onClick={() => dispatch({ type: "MEMORY_CONSENT_SET", enabled: !runtime.memoryConsent })}>{runtime.memoryConsent ? "Retirer le consentement" : "Autoriser mémoire et mesure"}</button><button onClick={eraseAllLocalData}>Effacer toutes les données locales</button></div>
          </section>
        </>
      )}
    </main>
  );
}
