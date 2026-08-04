import Link from "next/link";
import { ATLAS_PLANS, getCommerceReadiness } from "../../lib/atlas/commerce";

const readiness = getCommerceReadiness(process.env);

export default function ProfessionalPage() {
  const professionalPlan = ATLAS_PLANS.find((plan) => plan.id === "professional");

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>ESPACE PROFESSIONNELS</small></span></Link>
        <span className="environment-badge">PRÉVERSION — ACCÈS NON AUTHENTIFIÉ</span>
      </header>

      <section className="portal-hero">
        <p className="kicker">CABINETS / ÉQUIPES / ORGANISATIONS</p>
        <h1>Déployer ATLAS sans perdre le contrôle.</h1>
        <p className="lead">Cet espace prépare la gestion des membres, des parcours, de la facturation et des mesures agrégées. Aucune donnée clinique individuelle n’est exposée dans ce prototype.</p>
      </section>

      <section className="portal-grid">
        <article><span>01</span><h2>Parcours</h2><p>Configurer les parcours autorisés par public et contexte, avec versionnement et règles de sécurité.</p></article>
        <article><span>02</span><h2>Mesures agrégées</h2><p>Suivre l’usage, l’accessibilité et les abandons sans afficher les textes émotionnels libres.</p></article>
        <article><span>03</span><h2>Équipe</h2><p>Préparer les rôles professionnel, responsable d’organisation et administrateur de plateforme.</p></article>
      </section>

      <section className="portal-panel">
        <p className="kicker">OFFRE PRÉPARÉE</p>
        <h2>{professionalPlan?.label}</h2>
        <ul>{professionalPlan?.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        <div className="readiness-row">
          <span>Stripe : {readiness.stripe ? "configuré" : "non configuré"}</span>
          <span>PayPal : {readiness.paypal ? "configuré" : "non configuré"}</span>
          <span>Paiement public : {readiness.productionCheckoutEnabled ? "activé" : "bloqué"}</span>
        </div>
        {!readiness.productionCheckoutEnabled && <p className="notice">Le paiement reste volontairement désactivé tant que les secrets, webhooks et documents contractuels ne sont pas validés.</p>}
      </section>
    </main>
  );
}
