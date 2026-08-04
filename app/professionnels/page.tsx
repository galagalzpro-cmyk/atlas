import Link from "next/link";
import { ATLAS_PLANS, getCommerceReadiness } from "../../lib/atlas/commerce";
import { requireRole } from "../../lib/server/auth";
import { logoutAction } from "../connexion/actions";

const readiness = getCommerceReadiness(process.env);

export default async function ProfessionalPage() {
  const user = await requireRole(["professional", "organization_admin", "atlas_admin"]);
  const professionalPlan = ATLAS_PLANS.find((plan) => plan.id === "professional");

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>ESPACE PROFESSIONNELS</small></span></Link>
        <div className="portal-user"><span>{user.displayName}</span><form action={logoutAction}><button type="submit">Se déconnecter</button></form></div>
      </header>

      <section className="portal-hero">
        <p className="kicker">CABINETS / ÉQUIPES / ORGANISATIONS</p>
        <h1>Déployer ATLAS sans perdre le contrôle.</h1>
        <p className="lead">Cet espace protégé prépare la gestion des membres, des parcours, de la facturation et des mesures agrégées. Aucune conversation émotionnelle libre n’y est exposée.</p>
      </section>

      <section className="portal-grid">
        <article><span>01</span><h2>Parcours</h2><p>Configurer les parcours autorisés par public et contexte, avec versionnement et règles de sécurité.</p></article>
        <article><span>02</span><h2>Mesures agrégées</h2><p>Suivre l’usage, l’accessibilité et les abandons sans afficher les textes émotionnels libres.</p></article>
        <article><span>03</span><h2>Équipe</h2><p>Gérer les professionnels et responsables d’organisation selon leurs capacités serveur.</p></article>
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
