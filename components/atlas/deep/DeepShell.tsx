import type { ReactNode } from "react";
import styles from "../../../app/deep.module.css";

export function DeepShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href="/"><span className={styles.brandMark}>◈</span><span><strong>ATLAS</strong><small>ÉCOSYSTÈME ÉMOTIONNEL</small></span></a>
        <nav className={styles.nav}>
          <a href="/constellation-familiale">Constellation</a>
          <a href="/parcours">Parcours</a>
          <a href="/ressources">Ressources</a>
          <a href="/relais-humain">Relais humain</a>
          <a href="/professionnels">Professionnels</a>
        </nav>
        <a className={styles.private} href="/connexion">Espace privé</a>
      </header>
      {children}
      <footer className={styles.footer}>
        <div><strong>ATLAS</strong><p className={styles.lead}>Comprendre les dynamiques émotionnelles, relationnelles et familiales pour retrouver une capacité d’action.</p></div>
        <div><small>EXPÉRIENCE</small><a href="/constellation-familiale">Constellation familiale</a><a href="/parcours">Parcours personnel</a><a href="/ressources">Ressources</a></div>
        <div><small>ACCOMPAGNEMENT</small><a href="/relais-humain">Relais humain</a><a href="/professionnels">Professionnels</a><a href="/compte">Espace personnel</a></div>
        <div><small>CADRE</small><a href="/confidentialite">Confidentialité</a><a href="/conditions">Conditions</a><a href="/connexion">Connexion</a></div>
      </footer>
    </main>
  );
}
