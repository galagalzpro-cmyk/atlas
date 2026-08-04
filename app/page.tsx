"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./gold.module.css";

type Audience = "adolescent" | "adult" | "senior";
type Reply = { text: string; nextStep: string; labels: string[]; source?: string; safety?: string };
type SpeechResultEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } };
type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionConstructor = new () => BrowserRecognition;

const PILLARS = [
  { index: "01", title: "Écoute émotionnelle", text: "Séparer les faits, les émotions, les besoins et les incertitudes avant de proposer une direction." },
  { index: "02", title: "Réponse adaptative", text: "Faire évoluer le rythme, la densité et le niveau de guidage selon le signal de l’utilisateur." },
  { index: "03", title: "Orientation concrète", text: "Transformer une situation confuse en prochaine action lisible, réaliste et réversible." },
  { index: "04", title: "Contrôle humain", text: "Maintenir le consentement, l’effacement, la transparence et les relais humains au centre du système." },
];

const UNIVERSES = [
  { key: "adolescent" as Audience, number: "01", title: "Adolescents", subtitle: "Direct, discret, protecteur", text: "Une expérience plus claire, plus courte et plus visuelle, avec priorité aux limites, à la sécurité et aux adultes de confiance." },
  { key: "adult" as Audience, number: "02", title: "Adultes", subtitle: "Clarté, équilibre, décision", text: "Un espace pour organiser la charge mentale, comprendre les tensions et retrouver une capacité d’action concrète." },
  { key: "senior" as Audience, number: "03", title: "Seniors", subtitle: "Lent, lisible, rassurant", text: "Une interface plus stable, des étapes courtes et une interaction vocale prioritaire pour préserver l’autonomie." },
];

const JOURNEYS = [
  { number: "01", title: "Se déposer", text: "Exprimer ce qui se passe sans devoir immédiatement trouver une solution." },
  { number: "02", title: "Comprendre", text: "Identifier le fait principal, l’émotion dominante et le besoin non satisfait." },
  { number: "03", title: "Stabiliser", text: "Réduire l’intensité, restaurer de la sécurité et retrouver une vision plus nette." },
  { number: "04", title: "Avancer", text: "Choisir une action courte, vérifiable et adaptée au niveau d’énergie disponible." },
];

const CELLS = [
  ["Perception", "Détecte les signaux explicites sans transformer l’utilisateur en score."],
  ["Contexte", "Replace le message dans la situation, le moment et l’objectif exprimé."],
  ["Vigilance", "Priorise la sécurité et suspend l’analyse ordinaire lorsqu’un risque est détecté."],
  ["Orientation", "Construit une prochaine étape concrète plutôt qu’une réponse abstraite."],
  ["Mémoire consentie", "Ne conserve que ce qui est autorisé et permet l’effacement des préférences."],
  ["Adaptation", "Modifie la forme, le rythme et la profondeur de l’expérience en temps réel."],
];

const FAQ = [
  ["ATLAS remplace-t-il un psychologue ou un médecin ?", "Non. ATLAS est un outil d’accompagnement, de clarification et d’orientation. Il ne pose pas de diagnostic et ne remplace pas un professionnel de santé."],
  ["Mes conversations sont-elles conservées ?", "La mémoire et l’usage d’une intelligence artificielle externe dépendent d’un consentement explicite. Les préférences locales peuvent être supprimées par l’utilisateur."],
  ["Que se passe-t-il en cas de signal urgent ?", "L’analyse ordinaire est interrompue. ATLAS privilégie la sécurité immédiate, le contact avec une personne réelle et les services d’urgence du pays concerné."],
  ["ATLAS peut-il être utilisé dans un cabinet ?", "Oui. L’espace professionnel est conçu pour les cabinets, équipes et structures qui souhaitent proposer des parcours encadrés et suivre des indicateurs opérationnels sans exploiter les contenus sensibles."],
];

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export default function Home() {
  const [time, setTime] = useState("");
  const [audience, setAudience] = useState<Audience>("adult");
  const [message, setMessage] = useState("Je me sens dispersé et je ne sais pas par quoi commencer.");
  const [reply, setReply] = useState<Reply | null>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [externalAiConsent, setExternalAiConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const recognitionRef = useRef<BrowserRecognition | null>(null);

  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const currentUniverse = useMemo(() => UNIVERSES.find((item) => item.key === audience) ?? UNIVERSES[1], [audience]);

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setNotice("La reconnaissance vocale n’est pas disponible dans ce navigateur. Vous pouvez écrire votre message.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setMessage(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setNotice("L’écoute vocale n’a pas pu démarrer. Vérifiez l’autorisation du microphone.");
    };
    recognitionRef.current = recognition;
    setNotice("");
    setListening(true);
    recognition.start();
  }

  async function submitConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    setLoading(true);
    setNotice("");
    setReply(null);
    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, audience, externalAiConsent }),
      });
      const data = await response.json() as {
        error?: string;
        reply?: string | { text?: string; nextStep?: string; labels?: string[] };
        source?: string;
        safety?: { level?: string };
      };
      if (!response.ok) throw new Error(data.error || "La session n’a pas pu être traitée.");
      const raw = data.reply;
      setReply(typeof raw === "string"
        ? { text: raw, nextStep: "", labels: [], source: data.source, safety: data.safety?.level }
        : {
          text: raw?.text || "ATLAS a reçu votre message.",
          nextStep: raw?.nextStep || "",
          labels: Array.isArray(raw?.labels) ? raw.labels : [],
          source: data.source,
          safety: data.safety?.level,
        });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <a className={styles.brand} href="#top" aria-label="ATLAS, accueil"><span className={styles.brandTree}>◈</span><span><strong>ATLAS</strong><small>CONSCIENCE AUGMENTÉE</small></span></a>
        <nav aria-label="Navigation principale"><a href="#atlas">ATLAS IA</a><a href="#experience">Expérience</a><a href="#universes">Univers</a><a href="#professionals">Professionnels</a><a href="#trust">Confiance</a></nav>
        <a className={styles.private} href="/connexion">Espace privé <span>↗</span></a>
      </header>

      <section className={styles.hero} id="top">
        <img className={styles.art} src="/atlas-gold.webp" alt="Univers visuel ATLAS avec une présence neuronale lumineuse" />
        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />
        <div className={styles.heroHotspots}>
          <a className={styles.primary} href="#experience">Commencer l’expérience <span>→</span></a>
          <a className={styles.secondary} href="#atlas">Découvrir ATLAS <span>→</span></a>
        </div>
        <button className={`${styles.voice} ${listening ? styles.listening : ""}`} onClick={toggleVoice} aria-pressed={listening}>
          <span>Parler à ATLAS</span><b>{listening ? "ATLAS vous écoute…" : "Activer l’écoute"}</b>
        </button>
        <a className={styles.scroll} href="#atlas">Défiler pour explorer <span>⌄</span></a>
        <div className={styles.liveRail}><span><i /> ATLAS EN DIRECT</span><span>EXPÉRIENCE CHIFFRÉE</span><span>ARCHITECTURE EUROPÉENNE</span><span>TEMPS LOCAL {time}</span></div>
      </section>

      <section className={styles.intro} id="atlas">
        <div className={styles.sectionHeading}><p>01 / ATLAS IA</p><h1>Une intelligence émotionnelle qui structure l’expérience autour de l’humain.</h1><span>ATLAS observe le message, le contexte, le niveau de tension et l’intention exprimée. Il produit ensuite une réponse structurée, sans diagnostic et sans masquer l’incertitude.</span></div>
        <div className={styles.pillarGrid}>{PILLARS.map((pillar) => <article key={pillar.index}><small>{pillar.index}</small><h2>{pillar.title}</h2><p>{pillar.text}</p><i /></article>)}</div>
      </section>

      <section className={styles.experience} id="experience">
        <div className={styles.experienceHeading}><p>02 / INTERACTION EN TEMPS RÉEL</p><h2>Parlez. ATLAS écoute, analyse et répond.</h2><span>Cette zone utilise le véritable endpoint conversationnel du projet. La sécurité locale reste active, même sans fournisseur d’IA externe.</span></div>
        <div className={styles.audienceTabs} role="tablist" aria-label="Choisir un univers">{UNIVERSES.map((item) => <button key={item.key} className={audience === item.key ? styles.activeTab : ""} onClick={() => setAudience(item.key)}><small>{item.number}</small><strong>{item.title}</strong></button>)}</div>
        <div className={styles.console}>
          <form className={styles.composer} onSubmit={submitConversation}>
            <div className={styles.composerTop}><span><i /> SESSION CONFIDENTIELLE</span><small>{currentUniverse.subtitle}</small></div>
            <label htmlFor="atlas-message">Qu’est-ce qui se passe pour vous ?</label>
            <textarea id="atlas-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={6000} placeholder="Décrivez la situation avec vos mots…" />
            <div className={styles.composerActions}><button type="button" className={styles.mic} onClick={toggleVoice}>{listening ? "Arrêter l’écoute" : "Utiliser la voix"}</button><button type="submit" className={styles.send} disabled={loading}>{loading ? "ATLAS analyse…" : "Envoyer à ATLAS"}<span>→</span></button></div>
            <label className={styles.consent}><input type="checkbox" checked={externalAiConsent} onChange={(event) => setExternalAiConsent(event.target.checked)} /><span>Autoriser, pour cette session, le recours à une IA externe lorsque disponible.</span></label>
            {notice && <p className={styles.notice}>{notice}</p>}
          </form>
          <aside className={styles.response} aria-live="polite">
            <div className={styles.responseCore}><span /><span /><span /><b>ATLAS</b></div>
            <small>RÉPONSE STRUCTURÉE</small>
            {reply ? <><p>{reply.text}</p>{reply.nextStep && <div className={styles.nextStep}><span>PROCHAINE ÉTAPE</span><strong>{reply.nextStep}</strong></div>}<div className={styles.labels}>{reply.labels.map((label) => <span key={label}>{label}</span>)}</div></> : <p className={styles.placeholder}>Votre réponse apparaîtra ici. ATLAS séparera les faits, les émotions, les besoins et la prochaine action possible.</p>}
          </aside>
        </div>
        <p className={styles.safetyNote}>ATLAS n’est pas un service d’urgence et ne remplace pas un professionnel de santé. En cas de danger immédiat, contactez une personne réelle et les secours de votre pays.</p>
      </section>

      <section className={styles.universes} id="universes">
        <div className={styles.sectionHeading}><p>03 / UNIVERS ADAPTATIFS</p><h2>Une même exigence. Trois expériences distinctes.</h2><span>La structure de sécurité reste identique, mais le langage, la densité, le rythme et les parcours changent selon le public.</span></div>
        <div className={styles.universeGrid}>{UNIVERSES.map((item) => <article key={item.key} className={audience === item.key ? styles.selectedUniverse : ""} onClick={() => setAudience(item.key)}><span>{item.number}</span><small>{item.subtitle}</small><h3>{item.title}</h3><p>{item.text}</p><button onClick={() => { setAudience(item.key); document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" }); }}>Explorer cet univers →</button></article>)}</div>
      </section>

      <section className={styles.journeys} id="journeys">
        <div className={styles.sectionHeading}><p>04 / PARCOURS GUIDÉS</p><h2>Du signal brut à une action possible.</h2><span>Les parcours ne forcent pas une réponse. Ils organisent le chemin pour réduire la confusion et restaurer une capacité de décision.</span></div>
        <div className={styles.journeyTrack}>{JOURNEYS.map((journey) => <article key={journey.number}><span>{journey.number}</span><div><h3>{journey.title}</h3><p>{journey.text}</p></div></article>)}</div>
      </section>

      <section className={styles.system} id="system">
        <div className={styles.sectionHeading}><p>05 / ARCHITECTURE NEURONALE</p><h2>Des cellules spécialisées qui coopèrent.</h2><span>Chaque cellule possède un rôle limité. L’ensemble forme une chaîne contrôlable plutôt qu’un bloc opaque prétendant tout savoir.</span></div>
        <div className={styles.cellGrid}>{CELLS.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div className={styles.cellOrb}><i /><i /><i /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.professionals} id="professionals">
        <div><p>06 / CABINETS & ORGANISATIONS</p><h2>Un espace professionnel conçu pour encadrer, déployer et mesurer.</h2><span>Invitations d’équipe, organisations, rôles, audit, parcours gouvernés, paiements et indicateurs opérationnels : le socle professionnel existe déjà dans l’application.</span><div className={styles.professionalActions}><a href="/professionnels">Découvrir l’espace professionnel →</a><a href="/connexion">Se connecter</a></div></div>
        <aside><article><small>01</small><strong>Organisations & rôles</strong><p>Gestion structurée des membres, invitations et droits d’accès.</p></article><article><small>02</small><strong>Gouvernance</strong><p>Consentement, audit, sécurité et séparation des responsabilités.</p></article><article><small>03</small><strong>Déploiement commercial</strong><p>Socle Stripe, PayPal et parcours de souscription déjà intégré.</p></article></aside>
      </section>

      <section className={styles.trust} id="trust">
        <div className={styles.sectionHeading}><p>07 / CONFIANCE</p><h2>La puissance n’a de valeur que si elle reste maîtrisable.</h2><span>ATLAS applique des principes de minimisation, de consentement explicite et de sécurité. Les certifications et validations réglementaires finales restent à obtenir avant toute promesse contractuelle.</span></div>
        <div className={styles.trustGrid}><article><span>01</span><h3>Consentement explicite</h3><p>L’usage d’une IA externe et la mémoire ne sont pas activés silencieusement.</p></article><article><span>02</span><h3>Analyse locale prioritaire</h3><p>Les signaux urgents sont traités localement avant tout appel externe.</p></article><article><span>03</span><h3>Traçabilité technique</h3><p>Les événements opérationnels et les accès sensibles peuvent être audités.</p></article><article><span>04</span><h3>Réversibilité</h3><p>Préférences, consentements et données locales peuvent être retirés ou effacés.</p></article></div>
      </section>

      <section className={styles.access} id="access">
        <div><p>ACCÉDER À ATLAS</p><h2>Choisissez votre porte d’entrée.</h2></div>
        <div className={styles.accessGrid}><article><small>PARTICULIERS</small><h3>Vivre l’expérience</h3><p>Créer un espace personnel et commencer un parcours émotionnel structuré.</p><a href="/compte">Créer mon espace →</a></article><article><small>PROFESSIONNELS</small><h3>Déployer ATLAS</h3><p>Découvrir les usages pour cabinets, équipes et structures d’accompagnement.</p><a href="/professionnels">Voir les solutions →</a></article><article><small>MEMBRES</small><h3>Retrouver son espace</h3><p>Accéder aux outils, organisations et parcours déjà activés.</p><a href="/connexion">Se connecter →</a></article></div>
      </section>

      <section className={styles.faq} id="faq">
        <div><p>QUESTIONS ESSENTIELLES</p><h2>Comprendre avant d’entrer.</h2></div>
        <div>{FAQ.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><strong>ATLAS</strong><span>Intelligence émotionnelle augmentée, au service de l’humain.</span></div>
        <div><small>EXPLORER</small><a href="#atlas">ATLAS IA</a><a href="#experience">Expérience</a><a href="#universes">Univers</a><a href="#system">Architecture</a></div>
        <div><small>ESPACES</small><a href="/compte">Compte</a><a href="/professionnels">Professionnels</a><a href="/connexion">Connexion</a></div>
        <div><small>LÉGAL</small><a href="/confidentialite">Confidentialité</a><a href="/conditions">Conditions</a></div>
        <div className={styles.footerTime}><small>SYSTÈME</small><span><i /> En ligne</span><b>{time}</b></div>
      </footer>
    </main>
  );
}
