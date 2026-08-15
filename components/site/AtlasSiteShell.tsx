import Link from "next/link";
import type { ReactNode } from "react";

const NAVIGATION = [
  ["Expérience", "/experience"],
  ["Architecture", "/architecture"],
  ["Confiance", "/confiance"],
  ["Protection", "/protection"],
  ["Offres", "/offres"],
] as const;

export function AtlasSiteShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <main className={`site-shell${compact ? " site-shell-compact" : ""}`}>
      <div className="site-ambient" aria-hidden="true">
        <span className="site-orb site-orb-a" />
        <span className="site-orb site-orb-b" />
        <span className="site-mesh" />
      </div>

      <header className="site-header">
        <Link href="/" className="site-brand" aria-label="ATLAS — accueil">
          <span className="site-brand-mark">A</span>
          <span>
            <strong>ATLAS</strong>
            <small>ASSISTANCE ÉMOTIONNELLE GOUVERNÉE</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Navigation principale">
          {NAVIGATION.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>

        <div className="site-header-actions">
          <Link className="site-link-button" href="/connexion">Espace privé</Link>
          <Link className="site-primary-button" href="/conversation">Entrer dans ATLAS</Link>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <div>
          <Link href="/" className="site-brand site-brand-footer">
            <span className="site-brand-mark">A</span>
            <span><strong>ATLAS</strong><small>PRÉSENCE NUMÉRIQUE GOUVERNÉE</small></span>
          </Link>
          <p>Une présence numérique conçue pour aider à comprendre, clarifier et avancer sans confisquer le choix.</p>
        </div>
        <div className="site-footer-links">
          <div><strong>Découvrir</strong><Link href="/experience">Expérience</Link><Link href="/publics">Publics</Link><Link href="/offres">Offres</Link></div>
          <div><strong>ATLAS</strong><Link href="/architecture">Architecture</Link><Link href="/confiance">Confiance</Link><Link href="/protection">Protection</Link></div>
          <div><strong>Informations</strong><Link href="/a-propos">À propos</Link><Link href="/confidentialite">Confidentialité</Link><Link href="/mentions-legales">Mentions légales</Link></div>
        </div>
        <div className="site-footer-bottom">
          <span>Environnement privé de préproduction</span>
          <span>Assistance numérique · pas de diagnostic · pas d’action sensible sans consentement</span>
        </div>
      </footer>
    </main>
  );
}

export function SitePageHero({ eyebrow, title, lead, actions }: { eyebrow: string; title: string; lead: string; actions?: ReactNode }) {
  return (
    <section className="site-page-hero">
      <div className="site-page-hero-copy">
        <p className="site-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="site-lead">{lead}</p>
        {actions ? <div className="site-hero-actions">{actions}</div> : null}
      </div>
      <div className="site-page-presence" aria-hidden="true">
        <span className="site-page-orbit orbit-a" />
        <span className="site-page-orbit orbit-b" />
        <span className="site-page-core"><i /><i /><i /></span>
      </div>
    </section>
  );
}
