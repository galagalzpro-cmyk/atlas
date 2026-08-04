import Link from "next/link";
import { getCommerceReadiness } from "../../lib/atlas/commerce";
import { DEFAULT_CONSENTS, ATLAS_RETENTION_RULES } from "../../lib/atlas/governance";
import { getIntegrationStatuses } from "../../lib/atlas/external-integrations";
import { requireRole } from "../../lib/server/auth";
import { getOperationsSnapshot } from "../../lib/server/operations";
import { logoutAction } from "../connexion/actions";

const commerce = getCommerceReadiness(process.env);
const integrations = getIntegrationStatuses(process.env, DEFAULT_CONSENTS);

export default async function AdministrationPage() {
  const user = await requireRole(["atlas_admin"]);
  const operations = await getOperationsSnapshot();

  return (
    <main className="portal-shell admin-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>CONTRÔLE DE PLATEFORME</small></span></Link>
        <div className="portal-user"><span>{user.displayName}</span><form action={logoutAction}><button type="submit">Se déconnecter</button></form></div>
      </header>

      <section className="portal-hero compact">
        <p className="kicker">GOUVERNANCE / SÉCURITÉ / EXPLOITATION</p>
        <h1>Voir ce qui est actif. Bloquer ce qui ne l’est pas.</h1>
        <p className="lead">Console réservée au rôle atlas_admin. Elle affiche uniquement des métriques techniques agrégées et ne restitue aucun texte de session.</p>
      </section>

      <section className="status-grid">
        <article><span>BASE</span><strong>{operations.database ? "ACTIVE" : "ABSENTE"}</strong><small>PostgreSQL et contrôles serveur</small></article>
        <article><span>UTILISATEURS</span><strong>{operations.activeUsers}</strong><small>{operations.activeSessions} session(s) active(s)</small></article>
        <article><span>ORGANISATIONS</span><strong>{operations.activeOrganizations}</strong><small>{operations.activeSubscriptions} abonnement(s) actif(s)</small></article>
        <article><span>WEBHOOKS 24 H</span><strong>{operations.failedWebhooks24h ? "ALERTE" : "STABLE"}</strong><small>{operations.failedWebhooks24h} échec(s) · {operations.pendingWebhooks} en attente</small></article>
        <article><span>IA 24 H</span><strong>{operations.aiRuns24h}</strong><small>{operations.aiFailures24h} échec(s), sans contenu enregistré</small></article>
        <article><span>ACCÈS REFUSÉS 24 H</span><strong>{operations.deniedActions24h}</strong><small>Événements d’audit agrégés</small></article>
        <article><span>PAIEMENTS</span><strong>{commerce.productionCheckoutEnabled ? "ACTIFS" : "BLOQUÉS"}</strong><small>{commerce.missingRequirements.join(" · ") || "configuration complète"}</small></article>
        {integrations.map((integration) => (
          <article key={integration.provider}>
            <span>{integration.provider.toUpperCase()}</span>
            <strong>{integration.active ? "ACTIF" : "INACTIF"}</strong>
            <small>{integration.configured ? "identifiant présent" : "non configuré"} · consentement requis</small>
          </article>
        ))}
      </section>

      <section className="portal-panel">
        <p className="kicker">MATRICE DE CONSERVATION</p>
        <div className="governance-table">
          {ATLAS_RETENTION_RULES.map((rule) => (
            <article key={rule.dataClass}>
              <h2>{rule.dataClass}</h2>
              <p>{rule.examples.join(" · ")}</p>
              <strong>{rule.retention}</strong>
              <small>Consentement : {rule.requiresConsent ? "requis" : "non requis"} · Analytics externes : {rule.allowedInExternalAnalytics ? "autorisés sous règles" : "interdits"}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
