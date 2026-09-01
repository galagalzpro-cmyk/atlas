import Link from "next/link";
import { requireUser } from "../../lib/server/auth";
import { listAtlasConnectionsForUser } from "../../lib/server/connections";
import { listOrganizationsForUser } from "../../lib/server/organizations";
import { logoutAction } from "../connexion/actions";

export const dynamic = "force-dynamic";

interface AccountPageProps {
  searchParams: Promise<{ connection?: string; provider?: string }>;
}

const CONNECTION_MESSAGES: Record<string, string> = {
  connected: "Le service est connecté et ses outils autorisés sont disponibles dans ATLAS.",
  denied: "L’autorisation a été refusée. Aucun accès n’a été enregistré.",
  invalid: "La tentative de connexion n’est plus valide. Relancez-la depuis cette page.",
  failed: "La connexion n’a pas pu être finalisée. Aucun jeton n’est affiché ni conservé en clair.",
  disconnected: "Le service a été révoqué et sa référence de secret a été supprimée.",
  not_connected: "Ce service était déjà déconnecté.",
  "strong-auth-required": "Cette révocation exige une connexion récente. Déconnectez-vous puis reconnectez-vous avant de réessayer.",
  "revocation-failed": "Le fournisseur n’a pas confirmé la révocation. ATLAS conserve la connexion pour permettre un nouvel essai sûr.",
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await requireUser();
  const [organizations, connections, query] = await Promise.all([
    listOrganizationsForUser(user.id),
    listAtlasConnectionsForUser(user.id),
    searchParams,
  ]);
  const connectionMessage = query.connection ? CONNECTION_MESSAGES[query.connection] : null;
  return (
    <main className="portal-shell">
      <header className="portal-header">
        <Link href="/" className="brand"><span className="brand-mark">A</span><span><strong>ATLAS</strong><small>COMPTE</small></span></Link>
        <form action={logoutAction}><button type="submit">Se déconnecter</button></form>
      </header>
      <section className="portal-hero compact"><p className="kicker">IDENTITÉ / ACCÈS / CONTRÔLE</p><h1>{user.displayName}</h1><p className="lead">{user.email} · rôle plateforme : {user.role}</p></section>
      {connectionMessage && <p className="notice connection-notice" role="status">{connectionMessage}</p>}
      <section className="portal-grid">
        <article><span>01</span><h2>Sécurité</h2><p>Les sessions sont stockées sous forme de jetons hachés et peuvent être révoquées après réinitialisation du mot de passe.</p><Link href="/mot-de-passe-oublie">Changer le mot de passe</Link></article>
        <article><span>02</span><h2>Organisations</h2><p>{organizations.length} organisation(s) active(s) rattachée(s) à ce compte.</p>{organizations.map((organization) => <small key={organization.id}>{organization.name} · {organization.role}<br /></small>)}</article>
        <article><span>03</span><h2>Données</h2><p>ATLAS ne stocke pas les textes émotionnels dans le profil, les analytics, les journaux d’audit ou les exécutions IA.</p><Link href="/confidentialite">Consulter la politique de données</Link></article>
      </section>
      <section className="portal-panel connections-panel">
        <p className="kicker">SERVICES CONNECTÉS / AUTORISATIONS MINIMALES</p>
        <h2>Donner à ATLAS uniquement les accès nécessaires.</h2>
        <p>Chaque connexion passe par le consentement du fournisseur. Les jetons restent chiffrés côté serveur ; le registre d’outils n’active que les actions couvertes par les permissions accordées.</p>
        <div className="connections-grid">
          {connections.map((connection) => {
            const active = connection.status === "active";
            return (
              <article key={connection.provider}>
                <div className="connection-heading">
                  <span>{connection.label}</span>
                  <strong data-active={active}>{active ? "CONNECTÉ" : connection.configured ? "DISPONIBLE" : "À CONFIGURER"}</strong>
                </div>
                <p>{connection.description}</p>
                {connection.externalAccountHint && <small>{connection.externalAccountHint}</small>}
                {active && <small>{connection.capabilities.length} outil(s) activé(s) · {connection.grantedPermissions.length} permission(s)</small>}
                {active ? (
                  <form action={`/api/connections/${connection.provider}/disconnect`} method="post">
                    <input type="hidden" name="confirmation" value={`disconnect:${connection.provider}`} />
                    <button type="submit" className="connection-button danger">Révoquer et déconnecter</button>
                  </form>
                ) : (
                  <form action={`/api/connections/${connection.provider}/authorize`} method="post">
                    <button type="submit" className="connection-button" disabled={!connection.configured}>Connecter {connection.label}</button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
        <small className="strong-auth-note">La déconnexion est une action sensible : elle demande une confirmation explicite et une authentification forte datant de moins de quinze minutes.</small>
      </section>
    </main>
  );
}
