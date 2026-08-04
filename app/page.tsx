"use client";

import { useEffect, useState } from "react";
import styles from "./gold.module.css";

export default function Home() {
  const [listening, setListening] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className={styles.page}>
      <img className={styles.art} src="/atlas-gold.webp" alt="ATLAS, intelligence émotionnelle augmentée" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <header className={styles.nav}>
        <a className={styles.logoHit} href="#top" aria-label="ATLAS accueil" />
        <nav aria-label="Navigation principale">
          <a href="#top">Accueil</a><a href="#atlas">Atlas IA</a><a href="#explorer">Explorer</a><a href="/professionnels">Solutions</a><a href="#about">À propos</a>
        </nav>
        <a className={styles.private} href="/connexion">Espace privé <span>⌁</span></a>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroActions}>
          <a className={styles.primary} href="#atlas">Commencer l’expérience <span>→</span></a>
          <a className={styles.secondary} href="#explorer">Découvrir ATLAS <span>→</span></a>
        </div>
        <button className={`${styles.voice} ${listening ? styles.listening : ""}`} onClick={() => setListening((value) => !value)} aria-pressed={listening}>
          <span className={styles.voiceLabel}>Parler à ATLAS</span>
          <span className={styles.wave}>{Array.from({ length: 25 }).map((_, index) => <i key={index} style={{ animationDelay: `${index * -35}ms` }} />)}</span>
          <b>{listening ? "ATLAS vous écoute…" : "Activer l’écoute"}</b>
        </button>
        <a className={styles.scroll} href="#atlas">Défiler pour explorer <span>⌄</span></a>
      </section>

      <section className={styles.content} id="atlas">
        <p className={styles.eyebrow}>ATLAS / CONSCIENCE AUGMENTÉE</p>
        <h1>Une présence qui comprend avant d’orienter.</h1>
        <p>ATLAS transforme une émotion confuse en compréhension, puis en prochaine action concrète. L’expérience adapte son rythme, sa lumière et son niveau de guidage au signal de l’utilisateur.</p>
        <div className={styles.cards}>
          <article><span>01</span><h2>Écoute émotionnelle</h2><p>Identifier la tension, le besoin et le contexte sans réduire l’humain à un score.</p></article>
          <article><span>02</span><h2>Réponse adaptative</h2><p>Faire évoluer la forme de l’expérience selon l’état, l’intention et le niveau d’urgence.</p></article>
          <article><span>03</span><h2>Contrôle humain</h2><p>Consentement explicite, mémoire contrôlable et règles de sécurité non négociables.</p></article>
        </div>
      </section>

      <section className={styles.darkSection} id="explorer">
        <div><p className={styles.eyebrow}>EXPÉRIENCE IMMERSIVE</p><h2>ATLAS écoute. Le système entier réagit.</h2></div>
        <a href="/compte">Entrer dans ATLAS <span>→</span></a>
      </section>

      <footer className={styles.footer} id="about"><strong>ATLAS</strong><span>Intelligence émotionnelle au service de l’humain.</span><small>Temps universel — {time}</small></footer>
    </main>
  );
}
