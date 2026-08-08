"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Audience = "adolescent" | "adult" | "senior";
type Turn = { role: "user" | "assistant"; text: string };
type PresenceState = "ready" | "listening" | "thinking" | "speaking";

const AUDIENCES: Array<{ key: Audience; label: string }> = [
  { key: "adolescent", label: "Adolescents" },
  { key: "adult", label: "Adultes" },
  { key: "senior", label: "Seniors" },
];

const CAPABILITIES = [
  ["01", "Comprendre", "ATLAS maintient le fil, distingue les faits des hypothèses et adapte la profondeur de l’échange."],
  ["02", "Raisonner", "Il organise ce qui est confus, compare plusieurs lectures possibles et garde l’incertitude visible."],
  ["03", "Agir", "Son architecture V5 est pensée pour orchestrer des capacités réversibles, gouvernées et vérifiables."],
  ["04", "Se souvenir", "La mémoire devient structurée, consentie, corrigible et limitée à ce qui est réellement utile."],
  ["05", "Se réparer", "ATLAS doit détecter les ruptures, les erreurs et les pannes, puis revenir vers un état sûr."],
  ["06", "Évoluer", "Chaque amélioration doit être testée, comparée, prouvée et réversible avant d’être promue."],
] as const;

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [bootProgress, setBootProgress] = useState(8);
  const [calmMode, setCalmMode] = useState(false);
  const [presence, setPresence] = useState<PresenceState>("ready");
  const [audience, setAudience] = useState<Audience>("adult");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationState, setConversationState] = useState<string | null>(null);
  const [externalAiConsent, setExternalAiConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (booted) return;
    const steps = [20, 37, 56, 73, 88, 100];
    let index = 0;
    const timer = window.setInterval(() => {
      setBootProgress(steps[index] ?? 100);
      index += 1;
      if (index >= steps.length) window.clearInterval(timer);
    }, 180);
    return () => window.clearInterval(timer);
  }, [booted]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: calmMode ? "auto" : "smooth" });
  }, [turns, presence, calmMode]);

  const stateLabel = useMemo(() => {
    if (presence === "listening") return "Je vous écoute";
    if (presence === "thinking") return "Je rassemble le contexte";
    if (presence === "speaking") return "Je vous réponds";
    return "Présence disponible";
  }, [presence]);

  function reset(nextAudience = audience) {
    setAudience(nextAudience);
    setTurns([]);
    setConversationState(null);
    setMessage("");
    setNotice("");
    setPresence("ready");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || presence === "thinking") return;

    setTurns((current) => [...current, { role: "user", text }]);
    setMessage("");
    setNotice("");
    setPresence("thinking");

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
      const data = await response.json() as {
        error?: string;
        reply?: string;
        conversationState?: string | null;
      };
      if (!response.ok) throw new Error(data.error || "La conversation n’a pas pu être traitée.");
      setPresence("speaking");
      const reply = data.reply?.trim() || "ATLAS a reçu votre message.";
      setTurns((current) => [...current, { role: "assistant", text: reply }]);
      setConversationState(data.conversationState ?? null);
      window.setTimeout(() => setPresence("ready"), calmMode ? 0 : 700);
    } catch (error) {
      setPresence("ready");
      setNotice(error instanceof Error ? error.message : "Une erreur est survenue.");
    }
  }

  if (!booted) {
    return (
      <main className="atlas">
        <div className="ambient" aria-hidden="true">
          <div className="mist mist-a" />
          <div className="mist mist-b" />
          <div className="grid-field" />
        </div>
        <section className="awakening" aria-label="Ouverture ATLAS">
          <p className="kicker">ATLAS Awakening / V5 Foundation</p>
          <div className="awakening-core" aria-hidden="true">
            <div className="pulse" />
            <div className="pulse pulse-two" />
            <div className="seed" />
          </div>
          <h1>ATLAS</h1>
          <p>Une intelligence émotionnelle, conversationnelle et autonome.</p>
          <div className="progress" aria-label={`Chargement ${bootProgress}%`}>
            <span style={{ width: `${bootProgress}%` }} />
          </div>
          <button type="button" onClick={() => setBooted(true)}>Entrer</button>
        </section>
      </main>
    );
  }

  return (
    <main className={`atlas ${calmMode ? "calm" : ""}`} data-state={presence}>
      <div className="ambient" aria-hidden="true">
        <div className="mist mist-a" />
        <div className="mist mist-b" />
        <div className="grid-field" />
      </div>

      <header className="topbar">
        <a className="brand" href="#accueil" aria-label="ATLAS — accueil">
          <span className="brand-mark">A</span>
          <span>
            <strong>ATLAS</strong>
            <small>AUTONOMOUS EMOTIONAL OS</small>
          </span>
        </a>
        <nav aria-label="Navigation principale">
          <a href="#experience">Expérience</a>
          <a href="#architecture">Architecture</a>
          <a href="#confiance">Confiance</a>
          <a href="/connexion">Espace privé</a>
        </nav>
        <button className="quiet-button" type="button" onClick={() => setCalmMode((value) => !value)}>
          {calmMode ? "Réactiver l’ambiance" : "Mode calme"}
        </button>
      </header>

      <section id="accueil" className="hero">
        <div>
          <p className="kicker">ChatGPT × JARVIS × Intelligence émotionnelle ATLAS</p>
          <h1>Une intelligence qui <em>comprend</em>, puis agit avec justesse.</h1>
          <p className="lead">
            ATLAS fusionne conversation avancée, compréhension émotionnelle et autonomie gouvernée dans une seule présence numérique. Vous parlez naturellement. Le système maintient le contexte, choisit la bonne posture, vérifie ce qu’il fait et vous laisse le contrôle.
          </p>

          <form className="composer" onSubmit={submit}>
            <label htmlFor="atlas-first-message">Commencez comme cela vient.</label>
            <textarea
              id="atlas-first-message"
              value={message}
              onFocus={() => setPresence("listening")}
              onBlur={() => presence === "listening" && setPresence("ready")}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={6000}
              placeholder="Une pensée, une situation, quelques mots…"
            />
            <div className="composer-actions">
              <button type="button" onClick={() => reset()}>Effacer</button>
              <button type="button" onClick={() => document.querySelector("#experience")?.scrollIntoView({ behavior: calmMode ? "auto" : "smooth" })}>Découvrir</button>
              <button className="primary" type="submit" disabled={!message.trim() || presence === "thinking"}>
                {presence === "thinking" ? "ATLAS réfléchit" : "Parler à ATLAS"}
              </button>
            </div>
            {notice && <p role="alert">{notice}</p>}
          </form>

          <div className="principles" aria-label="Principes ATLAS">
            <span>Pas de diagnostic</span>
            <span>Pas d’action cachée</span>
            <span>Mémoire consentie</span>
            <span>Contrôle utilisateur</span>
          </div>
        </div>

        <div className="presence-stage" aria-label="Présence procédurale ATLAS">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="presence-shell" aria-hidden="true">
            <div className="crown" />
            <div className="attention"><i /><i /></div>
            <div className="voice-organ" />
            <div className="neural neural-a" />
            <div className="neural neural-b" />
            <div className="neural neural-c" />
          </div>
          <div className="status" aria-live="polite">
            <span>ÉTAT DE PRÉSENCE</span>
            <strong>{stateLabel}</strong>
            <small>Adaptation locale · sécurité prioritaire · conversation gouvernée</small>
          </div>
        </div>
      </section>

      <section id="experience" className="section">
        <p className="kicker">Expérience</p>
        <h2>Une seule présence. Plusieurs formes d’intelligence.</h2>
        <div className="cards">
          {CAPABILITIES.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="architecture" className="section architecture">
        <p className="kicker">Mécanique invisible</p>
        <h2>La complexité reste derrière l’expérience.</h2>
        <div className="mechanism" aria-label="Chaîne cognitive ATLAS">
          {[
            "Percevoir",
            "Comprendre",
            "Délibérer",
            "Décider",
            "Vérifier",
            "Évoluer",
          ].map((step) => <div key={step}><strong>{step}</strong></div>)}
        </div>
      </section>

      <section id="confiance" className="section trust">
        <p className="kicker">Confiance par architecture</p>
        <h2>Puissant, sans devenir opaque.</h2>
        <div className="cards">
          <article>
            <span>01</span>
            <h3>Vous gardez la main</h3>
            <p>ATLAS ne contacte personne, n’engage aucune action extérieure sensible et ne conserve pas de mémoire durable sans règle explicite.</p>
          </article>
          <article>
            <span>02</span>
            <h3>La sécurité passe avant la fluidité</h3>
            <p>Les situations sensibles doivent déclencher des mécanismes locaux, déterministes et vérifiables avant toute génération externe.</p>
          </article>
          <article>
            <span>03</span>
            <h3>L’incertitude reste visible</h3>
            <p>ATLAS travaille avec des hypothèses, pas avec une prétention à connaître parfaitement l’état intérieur d’une personne.</p>
          </article>
        </div>

        <div className="composer" style={{ marginTop: 24 }}>
          <label>Adapter l’expérience</label>
          <div className="composer-actions" style={{ flexWrap: "wrap" }}>
            {AUDIENCES.map((item) => (
              <button key={item.key} type="button" aria-pressed={audience === item.key} onClick={() => reset(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
          <label style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start", fontWeight: 400 }}>
            <input type="checkbox" checked={externalAiConsent} onChange={(event) => setExternalAiConsent(event.target.checked)} />
            Autoriser pour cette session le recours au fournisseur d’intelligence externe lorsqu’il est permis par la politique ATLAS.
          </label>
        </div>

        {turns.length > 0 && (
          <div className="composer" style={{ marginTop: 24 }} aria-live="polite">
            <label>Conversation en cours</label>
            {turns.map((turn, index) => (
              <p key={`${turn.role}-${index}`} style={{ margin: "10px 0", lineHeight: 1.65 }}>
                <strong>{turn.role === "assistant" ? "ATLAS" : "Vous"} · </strong>{turn.text}
              </p>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </section>
    </main>
  );
}
