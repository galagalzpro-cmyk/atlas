import Link from "next/link";
import { ATLAS_RETENTION_RULES } from "../../lib/atlas/governance";
import { getAtlasLegalProfile } from "../../lib/atlas/legal-profile";

export const dynamic = "force-dynamic";

function shown(value: string): string {
  return value || "À compléter avant lancement public";
}

export default function PrivacyPage() {
  const legal = getAtlasLegalProfile(process.env);
  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>CONFIDENTIALITÉ</small></span></Link>
        <span className="environment-badge">{legal.documentsComplete ? `VERSION ${legal.privacyVersion}` : "VERSION DE PRÉPRODUCTION"}</span>
      </header>
      <section className="portal-hero compact">
        <p className="kicker">MINIMISATION / CONSENTEMENT / EFFACEMENT</p>
        <h1>Le contenu émotionnel ne devient pas une donnée marketing.</h1>
        <p className="lead">Cette page décrit le comportement technique actuel. Une publication contractuelle exige une identité de responsable de traitement, un contact de droits et une version juridiquement validés.</p>
      </section>
      <section className="portal-panel">
        <p className="kicker">RESPONSABLE ET DROITS</p>
        <h2>{shown(legal.entity)}</h2>
        <p>Adresse : {shown(legal.address)}</p>
        <p>Exercice des droits : {shown(legal.privacyEmail)} · Sécurité : {shown(legal.securityEmail)}</p>
        <p>Relais humain surveillé : {shown(legal.humanRelay)}</p>
      </section>
      <section className="portal-panel"><h2>Principes actifs</h2><p>Les préférences, analytics, traceurs marketing et recours à une IA externe correspondent à des décisions distinctes. Les traceurs Google Analytics, Google Ads et Meta Pixel ne peuvent être chargés qu’après le choix explicite correspondant, conservé dans le navigateur et révocable via « Gérer les traceurs ». Une session urgente reste locale et suspend la génération externe. Les journaux techniques excluent les messages, transcriptions, diagnostics et données de santé.</p></section>
      <section className="portal-panel"><p className="kicker">CATÉGORIES ET CONSERVATION</p><div className="governance-table">{ATLAS_RETENTION_RULES.map((rule) => <article key={rule.dataClass}><h2>{rule.dataClass}</h2><p>{rule.examples.join(" · ")}</p><strong>{rule.retention}</strong><small>Consentement : {rule.requiresConsent ? "requis" : "non requis"}</small></article>)}</div></section>
      <section className="portal-panel"><h2>Limites</h2><p>ATLAS n’est pas un service d’urgence, n’établit pas de diagnostic et ne remplace pas un professionnel de santé. Les transferts, sous-traitants, durées contractuelles et procédures d’exercice des droits doivent rester alignés avec la configuration effectivement déployée.</p></section>
    </main>
  );
}
