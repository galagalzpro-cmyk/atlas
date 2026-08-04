import Link from "next/link";
import { getCommerceReadiness } from "../../lib/atlas/commerce";
import { DEFAULT_CONSENTS, ATLAS_RETENTION_RULES } from "../../lib/atlas/governance";
import { getIntegrationStatuses } from "../../lib/atlas/external-integrations";

const commerce = getCommerceReadiness(process.env);
const integrations = getIntegrationStatuses(process.env, DEFAULT_CONSENTS);

export default function AdministrationPage() {
  return (
    <main className="portal-shell admin-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>CONTRÔLE DE PLATEFORME</small></span></Link>
        <span className="environment-badge">PRÉVERSION — DONNÉES TECHNIQUES</span>
      </header>

      <section className="portal-hero compact">
        <p className="kicker">GOUVERNANCE / SÉCURITÉ / EXPLOITATION</p>
        <h1>Voir ce qui est actif. Bloquer ce qui ne l’est pas.</h1>
        <p className="lead">Ce tableau présente la préparation technique. Il ne remplace pas encore une authentification administrateur, une base d’audit ou une supervision clinique.</p>
      </section>

      <section className="status-grid">
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
