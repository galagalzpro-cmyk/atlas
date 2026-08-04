import Link from "next/link";
import { ATLAS_RETENTION_RULES } from "../../lib/atlas/governance";

export default function PrivacyPage() {
  return (
    <main className="portal-shell">
      <header className="portal-header"><Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>CONFIDENTIALITÉ</small></span></Link><span className="environment-badge">VERSION DE PRÉPRODUCTION</span></header>
      <section className="portal-hero compact"><p className="kicker">MINIMISATION / CONSENTEMENT / EFFACEMENT</p><h1>Le contenu émotionnel ne devient pas une donnée marketing.</h1><p className="lead">Cette page décrit le comportement technique actuel. L’identité juridique, les coordonnées du responsable de traitement et les durées contractuelles devront être validées avant ouverture commerciale.</p></section>
      <section className="portal-panel"><h2>Principes actifs</h2><p>Les préférences, analytics, traceurs marketing et recours à une IA externe correspondent à des décisions distinctes. Une session urgente reste locale et suspend la génération externe. Les journaux techniques excluent les messages, transcriptions, diagnostics et données de santé.</p></section>
      <section className="portal-panel"><p className="kicker">CATÉGORIES ET CONSERVATION</p><div className="governance-table">{ATLAS_RETENTION_RULES.map((rule) => <article key={rule.dataClass}><h2>{rule.dataClass}</h2><p>{rule.examples.join(" · ")}</p><strong>{rule.retention}</strong><small>Consentement : {rule.requiresConsent ? "requis" : "non requis"}</small></article>)}</div></section>
      <section className="portal-panel"><h2>Limites</h2><p>ATLAS n’est pas un service d’urgence, n’établit pas de diagnostic et ne remplace pas un professionnel de santé. Les modalités d’exercice des droits, le contact DPO et les transferts éventuels doivent être complétés après choix définitif des fournisseurs et de l’entité exploitante.</p></section>
    </main>
  );
}
