import Link from "next/link";
import { ATLAS_PLANS, getCommerceReadiness } from "../../lib/atlas/commerce";
import { requireRole } from "../../lib/server/auth";
import { listOrganizationsForUser } from "../../lib/server/organizations";
import { logoutAction } from "../connexion/actions";
import { createOrganizationAction, inviteMemberAction } from "./actions";
import { CheckoutButtons } from "../../components/portal/CheckoutButtons";

const readiness = getCommerceReadiness(process.env);

export default async function ProfessionalPage() {
  const user = await requireRole(["professional", "organization_admin", "atlas_admin"]);
  const organizations = await listOrganizationsForUser(user.id);
  const professionalPlan = ATLAS_PLANS.find((plan) => plan.id === "professional");
  const canAdminister = user.role === "organization_admin" || user.role === "atlas_admin";

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>ESPACE PROFESSIONNELS</small></span></Link>
        <div className="portal-user"><span>{user.displayName}</span><form action={logoutAction}><button type="submit">Se déconnecter</button></form></div>
      </header>

      <section className="portal-hero">
        <p className="kicker">CABINETS / ÉQUIPES / ORGANISATIONS</p>
        <h1>Déployer ATLAS sans perdre le contrôle.</h1>
        <p className="lead">Gestion des équipes, des parcours, des accès et de la facturation. Les textes émotionnels libres n’apparaissent jamais dans cet espace.</p>
      </section>

      <section className="portal-grid">
        <article><span>01</span><h2>Parcours</h2><p>Configurer les parcours autorisés par public et contexte, avec versionnement et règles de sécurité.</p></article>
        <article><span>02</span><h2>Mesures agrégées</h2><p>Suivre l’usage, l’accessibilité et les abandons sans afficher les contenus des sessions.</p></article>
        <article><span>03</span><h2>Équipe</h2><p>Gérer professionnels et responsables d’organisation selon leurs capacités serveur.</p></article>
      </section>

      <section className="portal-panel">
        <p className="kicker">ORGANISATIONS ACCESSIBLES</p>
        <div className="governance-table">
          {organizations.length ? organizations.map((organization) => (
            <article key={organization.id}>
              <h2>{organization.name}</h2>
              <p>{organization.slug}</p>
              <small>Statut : {organization.status} · rôle : {organization.role}</small>
              {organization.role === "organization_admin" && (
                <form action={inviteMemberAction} className="auth-form compact-form">
                  <input type="hidden" name="organizationId" value={organization.id} />
                  <label>Inviter un membre<input name="email" type="email" required placeholder="professionnel@cabinet.fr" /></label>
                  <label>Rôle<select name="role" defaultValue="professional"><option value="professional">Professionnel</option><option value="organization_admin">Responsable</option></select></label>
                  <button type="submit">Créer une invitation temporaire</button>
                </form>
              )}
            </article>
          )) : <p className="notice">Aucune organisation active n’est encore rattachée à ce compte.</p>}
        </div>
        {canAdminister && (
          <form action={createOrganizationAction} className="auth-form compact-form">
            <h2>Créer une organisation</h2>
            <label>Nom<input name="name" required /></label>
            <label>Identifiant URL<input name="slug" required minLength={3} pattern="[a-zA-Z0-9-]+" /></label>
            <button type="submit">Créer et devenir responsable</button>
          </form>
        )}
      </section>

      <section className="portal-panel">
        <p className="kicker">OFFRE SANDBOX</p>
        <h2>{professionalPlan?.label}</h2>
        <ul>{professionalPlan?.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        <div className="readiness-row">
          <span>Stripe : {readiness.stripe ? "configuré" : "non configuré"}</span>
          <span>PayPal : {readiness.paypal ? "configuré" : "non configuré"}</span>
          <span>Production : {readiness.productionCheckoutEnabled ? "autorisée" : "bloquée"}</span>
        </div>
        <CheckoutButtons plan="professional" />
        {!readiness.productionCheckoutEnabled && <p className="notice">Les commandes ci-dessus restent limitées au sandbox. La production demeure bloquée par le contrat de readiness.</p>}
      </section>
    </main>
  );
}
