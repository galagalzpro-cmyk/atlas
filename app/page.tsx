"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

type Audience = "adolescent" | "adult" | "senior";
type Turn = { role: "user" | "assistant"; text: string };

const AUDIENCES: Array<{ key: Audience; label: string; description: string }> = [
  { key: "adolescent", label: "Adolescents", description: "Direct, protecteur, sans infantilisation." },
  { key: "adult", label: "Adultes", description: "Clarté, profondeur et autonomie." },
  { key: "senior", label: "Seniors", description: "Calme, lisibilité et rythme maîtrisé." },
];

const shell: CSSProperties = {
  minHeight: "100vh",
  color: "#171714",
  background: "radial-gradient(circle at 50% 28%, rgba(201,164,106,.24), transparent 22%), linear-gradient(145deg, #f7f2e9 0%, #ece2d2 48%, #f8f4ed 100%)",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  overflow: "hidden",
};

const glass: CSSProperties = {
  border: "1px solid rgba(23,23,20,.14)",
  background: "rgba(255,255,255,.42)",
  backdropFilter: "blur(24px)",
  borderRadius: "28px",
  boxShadow: "0 26px 80px rgba(32,25,16,.08)",
};

export default function Home() {
  const [audience, setAudience] = useState<Audience>("adult");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationState, setConversationState] = useState<string | null>(null);
  const [externalAiConsent, setExternalAiConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  function reset(nextAudience = audience) {
    setAudience(nextAudience);
    setTurns([]);
    setConversationState(null);
    setMessage("");
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;

    setTurns((current) => [...current, { role: "user", text }]);
    setMessage("");
    setLoading(true);
    setNotice("");

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
      const reply = data.reply?.trim() || "ATLAS a reçu votre message.";
      setTurns((current) => [...current, { role: "assistant", text: reply }]);
      setConversationState(data.conversationState ?? null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={shell}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px clamp(22px, 5vw, 72px)", position: "relative", zIndex: 4 }}>
        <a href="#top" style={{ color: "inherit", textDecoration: "none", letterSpacing: ".18em" }}>
          <strong style={{ fontSize: "1.05rem" }}>ATLAS</strong>
          <span style={{ display: "block", marginTop: 4, fontSize: ".62rem", opacity: .58 }}>INTELLIGENCE ÉMOTIONNELLE</span>
        </a>
        <nav style={{ display: "flex", gap: 24, fontSize: ".78rem" }}>
          <a href="#experience" style={{ color: "inherit" }}>Expérience</a>
          <a href="/connexion" style={{ color: "inherit" }}>Espace privé</a>
        </nav>
      </header>

      <section id="top" style={{ position: "relative", minHeight: "78vh", display: "grid", placeItems: "center", padding: "60px 22px 100px" }}>
        <div aria-hidden="true" style={{ position: "absolute", width: "min(58vw, 680px)", aspectRatio: "1", borderRadius: "50%", border: "1px solid rgba(23,23,20,.11)", animation: "pulse 8s ease-in-out infinite" }} />
        <div aria-hidden="true" style={{ position: "absolute", width: "min(38vw, 430px)", aspectRatio: "1", borderRadius: "50%", border: "1px solid rgba(201,164,106,.42)", boxShadow: "inset 0 0 90px rgba(201,164,106,.16), 0 0 100px rgba(201,164,106,.12)" }} />
        <div style={{ maxWidth: 920, textAlign: "center", position: "relative", zIndex: 2 }}>
          <p style={{ letterSpacing: ".24em", fontSize: ".7rem", opacity: .58 }}>UNE PRÉSENCE NUMÉRIQUE NOUVELLE GÉNÉRATION</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(3rem, 7vw, 6.8rem)", lineHeight: .98, margin: "28px 0" }}>
            Un espace pensé pour mieux vous comprendre.
          </h1>
          <p style={{ maxWidth: 690, margin: "0 auto", fontSize: "clamp(1rem, 1.7vw, 1.28rem)", lineHeight: 1.7, opacity: .72 }}>
            ATLAS écoute, maintient le fil, ajuste sa présence et vous aide à retrouver plus de paix, de clarté et de liberté intérieure.
          </p>
          <a href="#experience" style={{ display: "inline-flex", marginTop: 38, padding: "15px 25px", borderRadius: 999, background: "#171714", color: "#f7f2e9", textDecoration: "none", fontSize: ".82rem" }}>
            Entrer dans l’expérience
          </a>
        </div>
      </section>

      <section id="experience" style={{ padding: "0 clamp(18px, 5vw, 72px) 90px", position: "relative", zIndex: 3 }}>
        <div style={{ ...glass, maxWidth: 1180, margin: "0 auto", padding: "clamp(22px, 4vw, 48px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 36 }}>
            <div>
              <p style={{ letterSpacing: ".2em", fontSize: ".68rem", opacity: .55 }}>ATLAS EMOTIONAL OS V4</p>
              <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(2rem, 4vw, 3.6rem)", lineHeight: 1.08, margin: "18px 0" }}>Parlez comme cela vient.</h2>
              <p style={{ lineHeight: 1.7, opacity: .68 }}>Vous n’avez pas besoin d’organiser vos mots. ATLAS adapte la profondeur, le rythme et le type de réponse à ce qui se passe dans l’échange.</p>

              <div style={{ display: "grid", gap: 10, marginTop: 28 }}>
                {AUDIENCES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => reset(item.key)}
                    aria-pressed={audience === item.key}
                    style={{ textAlign: "left", border: audience === item.key ? "1px solid rgba(23,23,20,.42)" : "1px solid rgba(23,23,20,.12)", borderRadius: 16, padding: 15, background: audience === item.key ? "rgba(255,255,255,.72)" : "transparent", cursor: "pointer" }}
                  >
                    <strong>{item.label}</strong>
                    <span style={{ display: "block", marginTop: 5, fontSize: ".78rem", opacity: .62 }}>{item.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div aria-live="polite" style={{ minHeight: 340, maxHeight: 480, overflowY: "auto", border: "1px solid rgba(23,23,20,.12)", borderRadius: 22, padding: 18, background: "rgba(248,244,237,.58)" }}>
                {turns.length === 0 && <p style={{ opacity: .56, lineHeight: 1.7 }}>Commencez avec une phrase, une sensation, une situation ou même quelques mots.</p>}
                {turns.map((turn, index) => (
                  <article key={`${turn.role}-${index}`} style={{ margin: "0 0 14px", marginLeft: turn.role === "user" ? "12%" : 0, marginRight: turn.role === "assistant" ? "12%" : 0, padding: "13px 15px", borderRadius: 16, background: turn.role === "user" ? "rgba(23,23,20,.08)" : "rgba(255,255,255,.75)" }}>
                    <small style={{ letterSpacing: ".13em", fontSize: ".58rem", opacity: .48 }}>{turn.role === "assistant" ? "ATLAS" : "VOUS"}</small>
                    <p style={{ margin: "7px 0 0", lineHeight: 1.6 }}>{turn.text}</p>
                  </article>
                ))}
                {loading && <p style={{ opacity: .54 }}>ATLAS ajuste sa réponse…</p>}
                <div ref={endRef} />
              </div>

              <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
                <label htmlFor="atlas-message" style={{ fontSize: ".78rem" }}>Votre message</label>
                <textarea id="atlas-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={6000} placeholder="Écrivez librement…" style={{ resize: "vertical", border: "1px solid rgba(23,23,20,.18)", borderRadius: 18, padding: 15, background: "rgba(255,255,255,.66)", color: "inherit", font: "inherit" }} />
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: ".72rem", lineHeight: 1.45, opacity: .7 }}>
                  <input type="checkbox" checked={externalAiConsent} onChange={(event) => setExternalAiConsent(event.target.checked)} />
                  Autoriser, pour cette session, le recours au fournisseur d’intelligence externe lorsque la politique ATLAS l’autorise.
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" disabled={loading || !message.trim()} style={{ border: 0, borderRadius: 999, padding: "13px 22px", background: "#171714", color: "#f7f2e9", cursor: "pointer" }}>{loading ? "Réponse…" : "Envoyer"}</button>
                  <button type="button" onClick={() => reset()} style={{ border: "1px solid rgba(23,23,20,.18)", borderRadius: 999, padding: "13px 20px", background: "transparent", cursor: "pointer" }}>Nouvelle conversation</button>
                </div>
                {notice && <p role="alert" style={{ margin: 0, fontSize: ".78rem" }}>{notice}</p>}
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: "30px clamp(22px, 5vw, 72px) 48px", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", fontSize: ".68rem", opacity: .58 }}>
        <span>ATLAS — assistance numérique, pas un diagnostic médical.</span>
        <span>La personne garde le contrôle de l’échange.</span>
      </footer>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(.96); opacity: .45; }
          50% { transform: scale(1.04); opacity: .82; }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        button, textarea, input { font-family: inherit; }
        a { text-underline-offset: 4px; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; scroll-behavior: auto !important; }
        }
      `}</style>
    </main>
  );
}
